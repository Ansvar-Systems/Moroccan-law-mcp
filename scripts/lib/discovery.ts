/**
 * Source discovery for broader Moroccan legal ingestion.
 *
 * Discovers machine-downloadable legal texts from reachable official portals:
 * - DGSSI legal/regulatory index
 * - OMPIC legal references pages
 *
 * OCR is intentionally not used. Image-only documents are handled as skipped
 * downstream by the parser/ingestion pipeline.
 */

import { downloadWithRateLimit } from './fetcher.js';
import { SOURCE_DOCUMENTS, type SourceDocument } from './parser.js';

const DGSSI_INDEX_URL = 'https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires';
const OMPIC_INDEX_URLS = [
  'http://www.ompic.ma/fr/content/lois-et-reglementations',
  'http://www.ompic.ma/fr/content/lois-et-reglementations-rcc',
];

const OBFUSCATED_LAW_NUMBERS = new Set(['09-08', '53-05']);

type DiscoveredKind = 'loi' | 'decret' | 'arrete' | 'circulaire' | 'unknown';

interface DerivedMeta {
  kind: DiscoveredKind;
  number?: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#([0-9]+);/g, (_, dec: string) => {
      const code = Number.parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, ' ');
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeLegalNumber(raw: string): string {
  return raw
    .replace(/[–—]/g, '-')
    .replace(/[._/]/g, '-')
    .replace(/\s+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function absoluteUrl(baseUrl: string, href: string): string {
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href;
  }
  if (href.startsWith('/')) {
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}${href}`;
  }
  return new URL(href, baseUrl).toString();
}

function extractH1Title(html: string): string | undefined {
  const match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (!match) return undefined;
  return normalizeWhitespace(decodeHtmlEntities(stripTags(match[1])));
}

function deriveMetaFromTitle(title: string): DerivedMeta {
  const normalized = normalizeWhitespace(title);

  const decretMatch = /\bD[ée]cret\b[\s\S]{0,80}?(?:n[°º]?\s*)?([0-9]{1,4}[.\-][0-9]{1,4}(?:[.\-][0-9]{1,4})?)\b/i.exec(normalized);
  if (decretMatch) {
    return { kind: 'decret', number: normalizeLegalNumber(decretMatch[1]) };
  }

  const arreteMatch = /\bArr[êe]t[ée]\b[\s\S]{0,80}?(?:n[°º]?\s*)?([0-9]{1,4}(?:[.\-][0-9]{1,4}){0,2})\b/i.exec(normalized);
  if (arreteMatch) {
    return { kind: 'arrete', number: normalizeLegalNumber(arreteMatch[1]) };
  }

  const circulaireMatch = /\bCirculaire\b[\s\S]{0,80}?(?:n[°º]?\s*)?([0-9]{1,4}(?:[.\-\/][0-9]{1,4}){0,3})\b/i.exec(normalized);
  if (circulaireMatch) {
    return { kind: 'circulaire', number: normalizeLegalNumber(circulaireMatch[1]) };
  }

  const loiMatch = /\bLoi(?:\s*n[°º]?)?\s*([0-9]{1,4}[.\-][0-9]{1,4})\b/i.exec(normalized);
  if (loiMatch) {
    return { kind: 'loi', number: normalizeLegalNumber(loiMatch[1]) };
  }

  if (/\bLoi\b/i.test(normalized)) return { kind: 'loi' };
  if (/\bD[ée]cret\b/i.test(normalized)) return { kind: 'decret' };
  if (/\bArr[êe]t[ée]\b/i.test(normalized)) return { kind: 'arrete' };
  if (/\bCirculaire\b/i.test(normalized)) return { kind: 'circulaire' };

  return { kind: 'unknown' };
}

function buildId(kind: DiscoveredKind, number: string | undefined, fallback: string): string {
  const kindPart = kind === 'unknown' ? 'texte' : kind;
  const core = number && number.length > 0
    ? normalizeLegalNumber(number).toLowerCase()
    : slugify(fallback).slice(0, 60);
  return `ma-${kindPart}-${core}`;
}

function kindLabel(kind: DiscoveredKind): string {
  if (kind === 'decret') return 'Décret';
  if (kind === 'arrete') return 'Arrêté';
  if (kind === 'circulaire') return 'Circulaire';
  return 'Loi';
}

function scorePdfCandidate(title: string, meta: DerivedMeta, url: string): number {
  const lowered = decodeURIComponent(url).toLowerCase();
  let score = 0;

  if (meta.kind === 'loi' && lowered.includes('loi')) score += 50;
  if (meta.kind === 'decret' && lowered.includes('decret')) score += 50;
  if (meta.kind === 'arrete' && lowered.includes('arrete')) score += 50;
  if (meta.kind === 'circulaire' && lowered.includes('circulaire')) score += 50;

  if (meta.number) {
    const condensed = meta.number.replace(/-/g, '');
    const loweredCondensed = lowered.replace(/[^a-z0-9]/g, '');
    if (loweredCondensed.includes(condensed.toLowerCase())) score += 40;
  }

  if (/note|presentation|english|faq|foire|guide|referentiel/.test(lowered)) score -= 300;
  if (/brochure/.test(lowered)) score += 5;
  if (normalizeWhitespace(title).length > 0) score += 1;

  return score;
}

function choosePrimaryPdfLink(title: string, meta: DerivedMeta, candidates: string[]): string | undefined {
  if (candidates.length === 0) return undefined;

  const ranked = candidates
    .map(url => ({ url, score: scorePdfCandidate(title, meta, url) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.url;
}

function nextSeedFile(index: number, id: string): string {
  const n = String(index).padStart(2, '0');
  const base = id.replace(/^ma-/, '');
  return `${n}-${base}.json`;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await downloadWithRateLimit(url);
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.bytes.toString('utf8');
}

async function discoverDgssiDocuments(): Promise<SourceDocument[]> {
  const indexHtml = await fetchHtml(DGSSI_INDEX_URL);
  const links = [...new Set(
    Array.from(indexHtml.matchAll(/https:\/\/www\.dgssi\.gov\.ma\/fr\/[^"'<> \t\r\n]+/g)).map(m => m[0]),
  )].filter(link => /\/fr\/(loi|decret|arrete|circulaire|reglementations\/)/i.test(link));

  links.sort((a, b) => a.localeCompare(b));

  const discovered: SourceDocument[] = [];
  for (const pageUrl of links) {
    try {
      const html = await fetchHtml(pageUrl);
      const title = extractH1Title(html);
      if (!title) continue;

      const meta = deriveMetaFromTitle(title);
      if (meta.kind === 'unknown') continue;

      const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g)).map(m => m[1]);
      const pdfCandidates = [...new Set(
        hrefs
          .map(h => absoluteUrl(pageUrl, h))
          .filter(h => /dgssi\.gov\.ma/i.test(h) && /\.pdf(?:$|[?#])/i.test(h)),
      )];

      const sourceUrl = choosePrimaryPdfLink(title, meta, pdfCandidates);
      if (!sourceUrl) continue;

      const id = buildId(meta.kind, meta.number, pageUrl);
      const shortName = meta.number ? `${kindLabel(meta.kind)} ${meta.number}` : undefined;

      discovered.push({
        seed_file: '',
        id,
        type: 'statute',
        title,
        short_name: shortName,
        status: 'in_force',
        url: pageUrl,
        source_url: sourceUrl,
        source_authority: 'DGSSI',
        source_encoding: meta.kind === 'loi' && meta.number && OBFUSCATED_LAW_NUMBERS.has(meta.number)
          ? 'obfuscated'
          : 'plain',
        law_number: meta.kind === 'loi' ? meta.number : undefined,
        description: 'Discovered from DGSSI legal/regulatory portal.',
      });
    } catch {
      // Discovery should be resilient; inaccessible entries are ignored.
      continue;
    }
  }

  return discovered;
}

function shouldKeepOmpicAnchor(text: string, href: string): boolean {
  const loweredText = text.toLowerCase();
  const loweredHref = href.toLowerCase();

  if (!/\.(pdf|docx?)(?:$|[?#])/i.test(loweredHref)) return false;
  if (!/(loi|décret|decret|dahir|arrêté|arrete|circulaire)/i.test(loweredText)) return false;
  if (/(instrument|tableau|avis du comit|faq|foire)/i.test(loweredText)) return false;

  return true;
}

async function discoverOmpicDocuments(): Promise<SourceDocument[]> {
  const discovered: SourceDocument[] = [];

  for (const pageUrl of OMPIC_INDEX_URLS) {
    try {
      const html = await fetchHtml(pageUrl);
      const anchors = Array.from(html.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi));

      for (const anchor of anchors) {
        const rawHref = anchor[1];
        const rawText = normalizeWhitespace(decodeHtmlEntities(stripTags(anchor[2])));
        if (!rawHref || !rawText) continue;

        const absolute = absoluteUrl(pageUrl, rawHref);
        if (!shouldKeepOmpicAnchor(rawText, absolute)) continue;

        const meta = deriveMetaFromTitle(rawText);
        if (meta.kind === 'unknown') continue;

        const id = buildId(meta.kind, meta.number, rawText);
        const shortName = meta.number ? `${kindLabel(meta.kind)} ${meta.number}` : undefined;

        discovered.push({
          seed_file: '',
          id,
          type: 'statute',
          title: rawText,
          short_name: shortName,
          status: 'in_force',
          url: pageUrl,
          source_url: absolute,
          source_authority: 'OMPIC',
          source_encoding: 'plain',
          law_number: meta.kind === 'loi' ? meta.number : undefined,
          description: 'Discovered from OMPIC legal references.',
        });
      }
    } catch {
      continue;
    }
  }

  return discovered;
}

export async function discoverSourceDocuments(): Promise<SourceDocument[]> {
  const baseDocs = SOURCE_DOCUMENTS.map(doc => ({ ...doc }));
  const discoveredDocs = [
    ...(await discoverDgssiDocuments()),
    ...(await discoverOmpicDocuments()),
  ];

  const byId = new Map<string, SourceDocument>();
  const sourceUrls = new Set<string>();

  for (const base of baseDocs) {
    byId.set(base.id, base);
    sourceUrls.add(base.source_url);
  }

  const additional: SourceDocument[] = [];
  for (const candidate of discoveredDocs) {
    if (byId.has(candidate.id)) continue;
    if (sourceUrls.has(candidate.source_url)) continue;

    let uniqueId = candidate.id;
    let suffix = 2;
    while (byId.has(uniqueId)) {
      uniqueId = `${candidate.id}-${suffix}`;
      suffix++;
    }

    const withUniqueId: SourceDocument = { ...candidate, id: uniqueId };
    byId.set(withUniqueId.id, withUniqueId);
    sourceUrls.add(withUniqueId.source_url);
    additional.push(withUniqueId);
  }

  additional.sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < additional.length; i++) {
    const seq = baseDocs.length + i + 1;
    additional[i].seed_file = nextSeedFile(seq, additional[i].id);
  }

  return [...baseDocs, ...additional];
}

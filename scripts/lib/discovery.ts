/**
 * Source discovery for broader Moroccan legal ingestion.
 *
 * Discovers machine-downloadable legal texts from reachable official portals:
 * - DGSSI legal/regulatory index
 * - OMPIC legal references pages
 * - Adala (Ministry of Justice) -- Next.js app with 3,858 PDFs across 36+ folders
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

// --- Adala (Ministry of Justice) configuration ---
const ADALA_BASE_URL = 'https://adala.justice.gov.ma';

/** Priority folder IDs on the Adala portal with their legal domain labels. */
const ADALA_FOLDERS: Array<{ id: number; domain: string; domainAr: string }> = [
  { id: 19,  domain: 'civil',          domainAr: 'القانون المدني' },
  { id: 20,  domain: 'commercial',     domainAr: 'القانون التجاري' },
  { id: 21,  domain: 'criminal',       domainAr: 'القانون الجنائي' },
  { id: 22,  domain: 'family',         domainAr: 'قانون الأسرة' },
  { id: 26,  domain: 'administrative', domainAr: 'القانون الإداري' },
  { id: 37,  domain: 'electronic',     domainAr: 'القانون الإلكتروني' },
  { id: 57,  domain: 'labor',          domainAr: 'قانون الشغل' },
  { id: 568, domain: 'constitutional', domainAr: 'القانون الدستوري' },
  { id: 896, domain: 'organic-laws',   domainAr: 'القوانين التنظيمية' },
];

/** Shape of a file entry inside Adala __NEXT_DATA__ pageProps.content.files[]. */
interface AdalaFileEntry {
  id?: number;
  /** Document title (Arabic). */
  name?: string;
  /** Relative path to the PDF, e.g. "uploads/2025/03/14/filename-1741952873602.pdf". */
  path?: string;
  language?: string;
  type?: string;
  folderId?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

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

// ---------------------------------------------------------------------------
// Adala (Ministry of Justice) discovery
// ---------------------------------------------------------------------------

/**
 * Extracts the __NEXT_DATA__ JSON blob from an Adala page's HTML.
 * Returns the parsed pageProps object or undefined if not found.
 */
function extractNextData(html: string): Record<string, unknown> | undefined {
  const match = /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  if (!match?.[1]) return undefined;
  try {
    const parsed = JSON.parse(match[1]) as { props?: { pageProps?: Record<string, unknown> } };
    return parsed?.props?.pageProps ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts PDF file entries from the pageProps structure.
 *
 * Primary path: pageProps.content.files[] -- each entry has `path`, `name`, `id`.
 * Fallback: recursively searches for any object with a `path` field ending in .pdf
 * in case the Adala page structure changes.
 */
function collectPdfEntries(pageProps: Record<string, unknown>): AdalaFileEntry[] {
  // Try the known structure first: pageProps.content.files
  const content = pageProps['content'] as Record<string, unknown> | undefined;
  if (content && Array.isArray(content['files'])) {
    const files = content['files'] as AdalaFileEntry[];
    return files.filter(f => {
      const p = typeof f.path === 'string' ? f.path : '';
      return /\.pdf(?:$|[?#])/i.test(p);
    });
  }

  // Fallback: recursive search for objects with a PDF `path` field.
  const collected: AdalaFileEntry[] = [];
  function walk(data: unknown): void {
    if (Array.isArray(data)) {
      for (const item of data) walk(item);
      return;
    }
    if (data !== null && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      const pathVal = typeof record['path'] === 'string' ? record['path'] : undefined;
      if (pathVal && /\.pdf(?:$|[?#])/i.test(pathVal)) {
        collected.push(record as AdalaFileEntry);
      }
      for (const value of Object.values(record)) {
        if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
          walk(value);
        }
      }
    }
  }
  walk(pageProps);
  return collected;
}

/**
 * Builds a clean title from an Arabic PDF filename.
 * Strips the timestamp suffix and .pdf extension, replaces hyphens with spaces.
 */
function titleFromAdalaFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    // Strip trailing timestamp pattern like -1704067200000 or -17040672
    .replace(/-\d{8,}$/, '')
    // Replace hyphens between Arabic words with spaces
    .replace(/-/g, ' ')
    .trim();
}

/**
 * Builds a stable ID from an Adala file entry.
 * Uses the numeric id if present, otherwise slugifies the filename.
 */
function adalaEntryId(entry: AdalaFileEntry, domain: string): string {
  if (entry.id && typeof entry.id === 'number') {
    return `ma-adala-${domain}-${entry.id}`;
  }
  const name = entry.name ?? entry.path ?? 'unknown';
  const slug = slugify(titleFromAdalaFilename(name)).slice(0, 60);
  return `ma-adala-${domain}-${slug || 'unnamed'}`;
}

/**
 * Resolves the full download URL for an Adala PDF.
 * The `path` field contains relative paths like "uploads/2025/03/14/filename.pdf".
 * The download URL is: https://adala.justice.gov.ma/api/uploads/YYYY/MM/DD/[filename].pdf
 */
function resolveAdalaUrl(entry: AdalaFileEntry): string | undefined {
  const raw = entry.path;
  if (!raw || typeof raw !== 'string') return undefined;

  // Already absolute
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  // Relative path starting with /
  if (raw.startsWith('/')) return `${ADALA_BASE_URL}${raw}`;

  // Bare path like "uploads/2025/03/14/..." -- prepend /api/
  if (raw.startsWith('uploads/')) return `${ADALA_BASE_URL}/api/${raw}`;

  // Any other relative path
  return `${ADALA_BASE_URL}/${raw}`;
}

/**
 * Discovers PDF documents from the Adala (Ministry of Justice) portal.
 * Fetches each priority folder page and extracts file metadata from
 * the embedded __NEXT_DATA__ JSON props.
 */
async function discoverAdalaDocuments(): Promise<SourceDocument[]> {
  const discovered: SourceDocument[] = [];

  for (const folder of ADALA_FOLDERS) {
    const folderUrl = `${ADALA_BASE_URL}/resources/${folder.id}`;
    try {
      const html = await fetchHtml(folderUrl);
      const pageProps = extractNextData(html);
      if (!pageProps) {
        console.log(`  [adala] folder ${folder.id} (${folder.domain}): no __NEXT_DATA__ found, skipping`);
        continue;
      }

      const pdfEntries = collectPdfEntries(pageProps);
      console.log(`  [adala] folder ${folder.id} (${folder.domain}): ${pdfEntries.length} PDFs found`);

      for (const entry of pdfEntries) {
        const sourceUrl = resolveAdalaUrl(entry);
        if (!sourceUrl) continue;

        // entry.name is the document title (Arabic), entry.path is the file path.
        const title = (entry.name && entry.name.length >= 2)
          ? entry.name.trim()
          : titleFromAdalaFilename(entry.path ?? sourceUrl.split('/').pop() ?? 'unknown');
        if (!title || title.length < 2) continue;

        const id = adalaEntryId(entry, folder.domain);

        discovered.push({
          seed_file: '',
          id,
          type: 'statute',
          title,
          status: 'in_force',
          url: folderUrl,
          source_url: sourceUrl,
          source_authority: 'Adala (Ministère de la Justice)',
          source_encoding: 'plain',
          description: `Discovered from Adala portal, folder: ${folder.domain} (${folder.domainAr}).`,
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  [adala] folder ${folder.id} (${folder.domain}): discovery failed (${msg}), skipping`);
      continue;
    }
  }

  return discovered;
}

export async function discoverSourceDocuments(): Promise<SourceDocument[]> {
  const baseDocs = SOURCE_DOCUMENTS.map(doc => ({ ...doc }));
  // Each discovery source is wrapped individually so a single unreachable portal
  // does not prevent the rest of the pipeline from running.
  const discoveredDocs: SourceDocument[] = [];

  for (const [label, fn] of [
    ['DGSSI', discoverDgssiDocuments],
    ['OMPIC', discoverOmpicDocuments],
    ['Adala', discoverAdalaDocuments],
  ] as const) {
    try {
      const docs = await (fn as () => Promise<SourceDocument[]>)();
      discoveredDocs.push(...docs);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  [discovery] ${label} source unreachable (${msg}), continuing with other sources.`);
    }
  }

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

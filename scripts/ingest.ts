#!/usr/bin/env tsx
/**
 * Moroccan Law MCP -- Real-data ingestion pipeline.
 *
 * Fetches official documents from Moroccan government sources,
 * parses article-level provisions, and writes seed JSON files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { downloadWithRateLimit, extractDocxText, extractPdfText } from './lib/fetcher.js';
import { parseOfficialDocument, type SourceDocument } from './lib/parser.js';
import { discoverSourceDocuments } from './lib/discovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SOURCE_RAW_DIR = path.resolve(SOURCE_DIR, 'raw');
const SOURCE_TEXT_DIR = path.resolve(SOURCE_DIR, 'text');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const REPORT_PATH = path.join(SEED_DIR, '_ingestion-report.json');

interface IngestionReportItem {
  id: string;
  title: string;
  source_url: string;
  source_authority: string;
  status: 'ingested' | 'skipped' | 'failed';
  provisions: number;
  definitions: number;
  notes?: string;
}

function parseArgs(): { limit: number | null; skipFetch: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipFetch = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = Number.parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-fetch') {
      skipFetch = true;
    }
  }

  return { limit, skipFetch };
}

function ensureDirs(): void {
  fs.mkdirSync(SOURCE_RAW_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_TEXT_DIR, { recursive: true });
  fs.mkdirSync(SEED_DIR, { recursive: true });
}

function cleanSeedDirectory(): void {
  const entries = fs.readdirSync(SEED_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  for (const entry of entries) {
    fs.unlinkSync(path.join(SEED_DIR, entry));
  }
}

function cleanSourceTextDirectory(): void {
  const entries = fs.readdirSync(SOURCE_TEXT_DIR)
    .filter(f => f.endsWith('.txt'));

  for (const entry of entries) {
    fs.unlinkSync(path.join(SOURCE_TEXT_DIR, entry));
  }
}

function sourceExtension(url: string): '.pdf' | '.docx' | '.doc' | '.html' | '.bin' {
  if (/\.pdf(?:$|\?)/i.test(url)) return '.pdf';
  if (/\.docx(?:$|\?)/i.test(url)) return '.docx';
  if (/\.doc(?:$|\?)/i.test(url)) return '.doc';
  if (/\.html?(?:$|\?)/i.test(url)) return '.html';
  return '.bin';
}

async function fetchSource(document: SourceDocument, skipFetch: boolean): Promise<{ rawPath: string; rawText: string }> {
  const ext = sourceExtension(document.source_url);
  const rawPath = path.join(SOURCE_RAW_DIR, `${document.id}${ext}`);

  if (skipFetch && fs.existsSync(rawPath)) {
    if (ext === '.pdf') {
      return { rawPath, rawText: await extractPdfText(rawPath) };
    }
    if (ext === '.docx') {
      return { rawPath, rawText: await extractDocxText(rawPath) };
    }
    return { rawPath, rawText: fs.readFileSync(rawPath, 'utf8') };
  }

  const response = await downloadWithRateLimit(document.source_url);
  if (response.status !== 200) {
    throw new Error(`HTTP ${response.status}`);
  }

  fs.writeFileSync(rawPath, response.bytes);

  if (ext === '.pdf') {
    return { rawPath, rawText: await extractPdfText(rawPath) };
  }

  if (ext === '.docx') {
    return { rawPath, rawText: await extractDocxText(rawPath) };
  }

  const rawText = response.bytes.toString('utf8');
  return { rawPath, rawText };
}

function writeSeed(document: SourceDocument, parsed: ReturnType<typeof parseOfficialDocument>['parsed']): string {
  const outputPath = path.join(SEED_DIR, document.seed_file);
  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
  return outputPath;
}

async function ingestDocuments(documents: SourceDocument[], skipFetch: boolean): Promise<void> {
  ensureDirs();
  cleanSeedDirectory();
  cleanSourceTextDirectory();

  const report: IngestionReportItem[] = [];

  let ingestedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;

  for (const document of documents) {
    process.stdout.write(`  ${document.id}: fetching source...`);

    try {
      const { rawText } = await fetchSource(document, skipFetch);
      console.log(' OK');

      const parse = parseOfficialDocument(document, rawText);

      const sourceTextPath = path.join(SOURCE_TEXT_DIR, `${document.id}.txt`);
      fs.writeFileSync(sourceTextPath, parse.normalized_source_text, 'utf8');

      if (parse.skip_reason) {
        parse.parsed.ingestion_notes = parse.skip_reason;
        writeSeed(document, parse.parsed);
        console.log(`    -> skipped: ${parse.skip_reason}`);

        report.push({
          id: document.id,
          title: document.title,
          source_url: document.source_url,
          source_authority: document.source_authority,
          status: 'skipped',
          provisions: 0,
          definitions: 0,
          notes: parse.skip_reason,
        });

        skippedCount++;
        continue;
      }

      writeSeed(document, parse.parsed);

      const provisions = parse.parsed.provisions.length;
      const definitions = parse.parsed.definitions.length;

      totalProvisions += provisions;
      totalDefinitions += definitions;
      ingestedCount++;

      console.log(`    -> ${provisions} provisions, ${definitions} definitions`);

      report.push({
        id: document.id,
        title: document.title,
        source_url: document.source_url,
        source_authority: document.source_authority,
        status: 'ingested',
        provisions,
        definitions,
      });
    } catch (error) {
      const note = error instanceof Error ? error.message : String(error);
      console.log(` FAILED (${note})`);

      const fallback = {
        id: document.id,
        type: document.type,
        title: document.title,
        title_en: document.title_en,
        short_name: document.short_name,
        status: document.status,
        issued_date: document.issued_date,
        in_force_date: document.in_force_date,
        url: document.url,
        description: document.description,
        provisions: [],
        definitions: [],
        ingestion_status: 'skipped' as const,
        ingestion_notes: `Source fetch failed: ${note}`,
      };

      writeSeed(document, fallback);

      report.push({
        id: document.id,
        title: document.title,
        source_url: document.source_url,
        source_authority: document.source_authority,
        status: 'failed',
        provisions: 0,
        definitions: 0,
        notes: note,
      });

      failedCount++;
    }
  }

  const reportBody = {
    generated_at: new Date().toISOString(),
    summary: {
      processed: documents.length,
      ingested: ingestedCount,
      skipped: skippedCount,
      failed: failedCount,
      total_provisions: totalProvisions,
      total_definitions: totalDefinitions,
    },
    documents: report,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(reportBody, null, 2), 'utf8');

  console.log('\nIngestion report');
  console.log('================');
  console.log(`  Processed: ${documents.length}`);
  console.log(`  Ingested:  ${ingestedCount}`);
  console.log(`  Skipped:   ${skippedCount}`);
  console.log(`  Failed:    ${failedCount}`);
  console.log(`  Provisions:${totalProvisions}`);
  console.log(`  Definitions:${totalDefinitions}`);
  console.log(`\n  Report file: ${REPORT_PATH}`);
}

async function main(): Promise<void> {
  const { limit, skipFetch } = parseArgs();
  const discoveredDocuments = await discoverSourceDocuments();

  console.log('Moroccan Law MCP -- Real Data Ingestion');
  console.log('========================================');
  console.log('Sources: DGSSI / OMPIC (official Moroccan portals)');
  console.log('Rate limiting: 1200ms between requests\n');
  console.log(`Discovered source documents: ${discoveredDocuments.length}`);
  console.log('OCR mode: disabled (image-only sources are skipped and documented)\n');

  const documents = limit ? discoveredDocuments.slice(0, limit) : discoveredDocuments;
  await ingestDocuments(documents, skipFetch);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

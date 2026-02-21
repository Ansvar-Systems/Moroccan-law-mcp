#!/usr/bin/env tsx
/**
 * Verifies seeded provisions against locally extracted official-source text.
 *
 * The check is character-by-character for the stored provision content:
 * each provision content must appear verbatim in the corresponding
 * normalized source text file generated during ingestion.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const SOURCE_TEXT_DIR = path.resolve(__dirname, '../data/source/text');

interface ProvisionCheck {
  document_id: string;
  section: string;
}

interface SeedDocument {
  id: string;
  provisions?: Array<{
    section: string;
    content: string;
  }>;
}

const CHECKS: ProvisionCheck[] = [
  { document_id: 'ma-loi-05-20', section: '1' },
  { document_id: 'ma-loi-43-20', section: '1' },
  { document_id: 'ma-decret-2-24-921', section: '1' },
];

function loadSeedById(id: string): SeedDocument {
  const files = fs.readdirSync(SEED_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('_'));

  for (const file of files) {
    const fullPath = path.join(SEED_DIR, file);
    const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as SeedDocument;
    if (parsed.id === id) {
      return parsed;
    }
  }

  throw new Error(`No seed file found for document: ${id}`);
}

function main(): void {
  console.log('Provision verification (character-by-character)');
  console.log('==============================================\n');

  let passed = 0;

  for (const check of CHECKS) {
    const seed = loadSeedById(check.document_id);
    const provision = (seed.provisions ?? []).find(p => p.section === check.section);

    if (!provision) {
      throw new Error(`Provision not found in seed: ${check.document_id} section ${check.section}`);
    }

    const sourceTextPath = path.join(SOURCE_TEXT_DIR, `${check.document_id}.txt`);
    if (!fs.existsSync(sourceTextPath)) {
      throw new Error(`Source text not found: ${sourceTextPath}`);
    }

    const sourceText = fs.readFileSync(sourceTextPath, 'utf8');
    const exactMatch = sourceText.includes(provision.content);

    if (!exactMatch) {
      throw new Error(`Exact text mismatch: ${check.document_id} section ${check.section}`);
    }

    console.log(`PASS ${check.document_id} section ${check.section}`);
    passed++;
  }

  console.log(`\nVerified ${passed}/${CHECKS.length} provisions.`);
}

main();

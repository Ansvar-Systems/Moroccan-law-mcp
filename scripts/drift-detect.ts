#!/usr/bin/env tsx
/**
 * Drift detection for Moroccan Law MCP.
 *
 * Checks selected upstream Moroccan source pages/PDF text for expected snippets.
 * Uses fixtures/golden-hashes.json.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import { extractPdfText } from './lib/fetcher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const hashesPath = join(__dirname, '../fixtures/golden-hashes.json');

interface GoldenHash {
  id: string;
  description: string;
  upstream_url: string;
  expected_sha256: string;
  expected_snippet: string;
}

interface HashFixture {
  version: string;
  provisions: GoldenHash[];
}

async function main(): Promise<void> {
  console.log('Moroccan Law MCP — Drift Detection');
  console.log('=====================================\n');

  const fixture: HashFixture = JSON.parse(readFileSync(hashesPath, 'utf-8'));
  console.log(`Checking ${fixture.provisions.length} provisions...\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const hash of fixture.provisions) {
    if (hash.expected_sha256 === 'COMPUTE_ON_FIRST_INGEST') {
      console.log(`  SKIP ${hash.id}: Not yet ingested`);
      skipped++;
      continue;
    }

    try {
      const response = await fetch(hash.upstream_url, {
        headers: { 'User-Agent': 'Moroccan-Law-MCP/1.0 drift-detect' },
      });

      if (response.status !== 200) {
        console.log(`  WARN ${hash.id}: HTTP ${response.status}`);
        failed++;
        continue;
      }

      let body: string;
      if (hash.upstream_url.toLowerCase().includes('.pdf')) {
        const bytes = Buffer.from(await response.arrayBuffer());
        const tempPdf = join(tmpdir(), `moroccan-law-mcp-${randomUUID()}.pdf`);
        writeFileSync(tempPdf, bytes);
        try {
          body = await extractPdfText(tempPdf);
        } finally {
          unlinkSync(tempPdf);
        }
      } else {
        body = await response.text();
      }

      if (hash.expected_snippet && body.toLowerCase().includes(hash.expected_snippet.toLowerCase())) {
        console.log(`  OK   ${hash.id}: Snippet found`);
        passed++;
      } else {
        console.log(`  DRIFT ${hash.id}: Expected snippet "${hash.expected_snippet}" not found`);
        failed++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR ${hash.id}: ${msg}`);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.log('\nDrift detected! Data may need re-ingestion.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

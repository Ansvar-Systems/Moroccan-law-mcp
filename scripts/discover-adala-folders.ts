#!/usr/bin/env tsx
/**
 * Enumerate all available folders on the Adala (Ministry of Justice) portal.
 *
 * Run this script via VPN if the portal is geo-blocked:
 *   ./scripts/vpn-ingest.sh --country Morocco --mcp Moroccan-law-mcp \
 *     --flags "-- npx tsx scripts/discover-adala-folders.ts"
 *
 * Or directly if accessible:
 *   npx tsx scripts/discover-adala-folders.ts
 *
 * Probes folder IDs 1-1000 and reports which ones exist with PDF counts.
 */

const ADALA_BASE_URL = 'https://adala.justice.gov.ma';
const MIN_DELAY_MS = 200;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

interface FolderInfo {
  id: number;
  name: string;
  nameAr: string;
  pdfCount: number;
}

async function probeFolder(id: number): Promise<FolderInfo | null> {
  await rateLimit();

  try {
    const resp = await fetch(`${ADALA_BASE_URL}/resources/${id}`, {
      headers: { 'User-Agent': 'MoroccanLawMCP/1.0 (hello@ansvar.ai)' },
      signal: AbortSignal.timeout(15000),
    });

    if (resp.status !== 200) return null;

    const html = await resp.text();

    // Extract __NEXT_DATA__
    const match = /<script\s+id="__NEXT_DATA__"\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!match?.[1]) return null;

    const data = JSON.parse(match[1]) as { props?: { pageProps?: Record<string, unknown> } };
    const pageProps = data?.props?.pageProps;
    if (!pageProps) return null;

    // Extract folder name
    const content = pageProps['content'] as Record<string, unknown> | undefined;
    const name = (content?.['name'] as string) ?? '';
    const nameAr = (content?.['nameAr'] as string) ?? name;

    // Count PDFs
    const files = (content?.['files'] as Array<{ path?: string }>) ?? [];
    const pdfCount = files.filter(f => /\.pdf/i.test(f.path ?? '')).length;

    return { id, name, nameAr, pdfCount };
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  console.log('Adala Portal — Folder Discovery');
  console.log('================================\n');

  // First check if portal is accessible
  try {
    const test = await fetch(`${ADALA_BASE_URL}/resources/19`, {
      headers: { 'User-Agent': 'MoroccanLawMCP/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (test.status !== 200) {
      console.log(`Portal returned HTTP ${test.status}. May need VPN.`);
      process.exit(1);
    }
  } catch (e) {
    console.log(`Portal unreachable: ${e}. Run this script via VPN.`);
    process.exit(1);
  }

  console.log('Portal accessible. Probing folder IDs...\n');

  const found: FolderInfo[] = [];

  // Probe IDs 1-100 (most folders are in low range)
  for (let id = 1; id <= 100; id++) {
    const info = await probeFolder(id);
    if (info) {
      found.push(info);
      console.log(`  ID ${id}: ${info.nameAr || info.name} — ${info.pdfCount} PDFs`);
    }
    if (id % 10 === 0) {
      process.stdout.write(`  (probed ${id}/1000)\r`);
    }
  }

  // Probe higher ranges where we know folders exist
  const highRanges = [
    [500, 600],
    [800, 1000],
  ];

  for (const [start, end] of highRanges) {
    for (let id = start; id <= end; id++) {
      const info = await probeFolder(id);
      if (info) {
        found.push(info);
        console.log(`  ID ${id}: ${info.nameAr || info.name} — ${info.pdfCount} PDFs`);
      }
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`Found ${found.length} folders:\n`);

  // Output as TypeScript constant
  console.log('const ADALA_FOLDERS: Array<{ id: number; domain: string; domainAr: string }> = [');
  for (const f of found.sort((a, b) => a.id - b.id)) {
    const domain = f.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 30) || `folder-${f.id}`;
    console.log(`  { id: ${f.id}, domain: '${domain}', domainAr: '${f.nameAr}' },  // ${f.pdfCount} PDFs`);
  }
  console.log('];');

  // Summary
  const totalPdfs = found.reduce((sum, f) => sum + f.pdfCount, 0);
  console.log(`\nTotal PDFs across all folders: ${totalPdfs}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

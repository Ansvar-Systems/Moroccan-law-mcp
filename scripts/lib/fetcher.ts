/**
 * Rate-limited fetch/extraction utilities for official Moroccan legal sources.
 *
 * - 1200ms minimum delay between requests (government-friendly rate)
 * - User-Agent identifying this MCP
 * - Retry on 429/5xx with exponential backoff
 * - PDF text extraction via pdftotext
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const USER_AGENT = 'Moroccan-Law-MCP/1.0 (+https://github.com/Ansvar-Systems/Moroccan-law-mcp)';
const MIN_DELAY_MS = 1200;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface DownloadResult {
  status: number;
  bytes: Buffer;
  contentType: string;
  url: string;
}

export async function downloadWithRateLimit(url: string, maxRetries = 3): Promise<DownloadResult> {
  await rateLimit();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/pdf,text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });

    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      const backoff = Math.pow(2, attempt + 1) * 1000;
      console.log(`  HTTP ${response.status} for ${url}, retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      continue;
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      status: response.status,
      bytes: Buffer.from(arrayBuffer),
      contentType: response.headers.get('content-type') ?? '',
      url: response.url,
    };
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

export async function extractPdfText(pdfPath: string): Promise<string> {
  const { stdout } = await execFileAsync('pdftotext', [pdfPath, '-'], {
    maxBuffer: 64 * 1024 * 1024,
  });
  return stdout;
}

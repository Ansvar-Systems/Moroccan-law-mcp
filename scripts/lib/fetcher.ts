/**
 * Rate-limited fetch/extraction utilities for official Moroccan legal sources.
 *
 * - 1200ms minimum delay between requests (government-friendly rate)
 * - User-Agent identifying this MCP
 * - Retry on 429/5xx with exponential backoff
 * - PDF text extraction via pdftotext
 */

import * as fs from 'fs';
import * as path from 'path';
import { tmpdir } from 'os';
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

interface OcrOptions {
  startPage?: number;
  endPage?: number;
}

async function getPdfPageCount(pdfPath: string): Promise<number> {
  const { stdout } = await execFileAsync('pdfinfo', [pdfPath], {
    maxBuffer: 8 * 1024 * 1024,
  });
  const match = stdout.match(/Pages:\s+(\d+)/);
  if (!match) {
    throw new Error(`Unable to determine page count for: ${pdfPath}`);
  }
  return Number.parseInt(match[1], 10);
}

export async function extractPdfTextWithOcr(pdfPath: string, options: OcrOptions = {}): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const totalPages = await getPdfPageCount(pdfPath);
  const startPage = Math.max(1, options.startPage ?? 1);
  const endPage = Math.min(totalPages, options.endPage ?? totalPages);

  if (endPage < startPage) {
    throw new Error(`Invalid OCR page range: ${startPage}-${endPage}`);
  }

  const tmpRoot = fs.mkdtempSync(path.join(tmpdir(), 'moroccan-law-mcp-ocr-'));
  const worker = await createWorker('fra', 1);
  const pages: string[] = [];

  try {
    for (let page = startPage; page <= endPage; page++) {
      const imageBase = path.join(tmpRoot, `page-${String(page).padStart(4, '0')}`);
      await execFileAsync('pdftoppm', [
        '-f', String(page),
        '-l', String(page),
        '-singlefile',
        '-png',
        pdfPath,
        imageBase,
      ]);

      const imagePath = `${imageBase}.png`;
      const { data } = await worker.recognize(imagePath);
      pages.push(`\n\n[[PAGE ${page}]]\n\n${data.text ?? ''}`);
    }
  } finally {
    await worker.terminate();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }

  return pages.join('\n');
}

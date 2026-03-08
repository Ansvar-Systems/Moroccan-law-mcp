/**
 * Golden contract tests for Moroccan Law MCP.
 * Validates core tool functionality against seed data.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../data/database.db');

const DB_EXISTS = fs.existsSync(DB_PATH) && (() => {
  try {
    const _db = new Database(DB_PATH, { readonly: true });
    const _row = _db.prepare("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name='legal_documents'").get() as { cnt: number } | undefined;
    _db.close();
    return (_row?.cnt ?? 0) > 0;
  } catch { return false; }
})();

let db: InstanceType<typeof Database>;

beforeAll(() => {
  if (!DB_EXISTS) return;
  db = new Database(DB_PATH, { readonly: true });
  db.pragma('journal_mode = DELETE');
});

describe.skipIf(!DB_EXISTS)('Database integrity', () => {
  it('should have at least 10 legal documents', () => {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM legal_documents').get() as { cnt: number };
    expect(row.cnt).toBeGreaterThanOrEqual(10);
  });

  it('should have at least 300 provisions', () => {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM legal_provisions').get() as { cnt: number };
    expect(row.cnt).toBeGreaterThanOrEqual(300);
  });

  it('should have FTS index', () => {
    const row = db.prepare(
      "SELECT COUNT(*) as cnt FROM provisions_fts WHERE provisions_fts MATCH 'data'"
    ).get() as { cnt: number };
    expect(row.cnt).toBeGreaterThanOrEqual(0);
  });
});

describe.skipIf(!DB_EXISTS)('Article retrieval', () => {
  it('should retrieve a provision by document_id and section', () => {
    const row = db.prepare(
      "SELECT content FROM legal_provisions WHERE document_id = 'ma-loi-05-20' AND section = '1'"
    ).get() as { content: string } | undefined;
    expect(row).toBeDefined();
    expect(row!.content.length).toBeGreaterThan(50);
  });
});

describe.skipIf(!DB_EXISTS)('Search', () => {
  it('should find results via FTS search', () => {
    const rows = db.prepare(
      "SELECT COUNT(*) as cnt FROM provisions_fts WHERE provisions_fts MATCH 'cybersécurité'"
    ).get() as { cnt: number };
    expect(rows.cnt).toBeGreaterThan(0);
  });
});

describe.skipIf(!DB_EXISTS)('Negative tests', () => {
  it('should return no results for fictional document', () => {
    const row = db.prepare(
      "SELECT COUNT(*) as cnt FROM legal_provisions WHERE document_id = 'fictional-law-2099'"
    ).get() as { cnt: number };
    expect(row.cnt).toBe(0);
  });

  it('should return no results for invalid section', () => {
    const row = db.prepare(
      "SELECT COUNT(*) as cnt FROM legal_provisions WHERE document_id = 'ma-loi-05-20' AND section = '999ZZZ-INVALID'"
    ).get() as { cnt: number };
    expect(row.cnt).toBe(0);
  });
});

describe.skipIf(!DB_EXISTS)('Baseline laws are present', () => {
  const expectedDocs = [
    'ma-decret-2-22-687',
    'ma-decret-2-24-921',
    'ma-loi-05-20',
    'ma-loi-07-03',
    'ma-loi-09-08',
    'ma-loi-17-97',
    'ma-loi-24-96',
    'ma-loi-31-08',
    'ma-loi-43-20',
    'ma-loi-53-05',
  ];

  for (const docId of expectedDocs) {
    it(`should contain document: ${docId}`, () => {
      const row = db.prepare(
        'SELECT id FROM legal_documents WHERE id = ?'
      ).get(docId) as { id: string } | undefined;
      expect(row).toBeDefined();
      expect(row!.id).toBe(docId);
    });
  }
});

describe.skipIf(!DB_EXISTS)('list_sources', () => {
  it('should have db_metadata table', () => {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM db_metadata').get() as { cnt: number };
    expect(row.cnt).toBeGreaterThan(0);
  });
});

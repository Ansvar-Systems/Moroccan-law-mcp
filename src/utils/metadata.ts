/**
 * Response metadata utilities for Moroccan Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Official Moroccan government legal publications (DGSSI / SGG / OMPIC)',
    jurisdiction: 'MA',
    disclaimer:
      'This dataset is derived from official Moroccan government publications. ' +
      'Always verify current legal effect against the official source portals listed by list_sources.',
    freshness,
  };
}

# Moroccan Law MCP

Moroccan law database for cybersecurity compliance via Model Context Protocol (MCP).

## Features

- **Full-text search** across legislation provisions (FTS5 with BM25 ranking)
- **Article-level retrieval** for specific legal provisions
- **Citation validation** to prevent hallucinated references
- **Currency checks** to verify if laws are still in force

## Quick Start

### Claude Code (Remote)
```bash
claude mcp add moroccan-law --transport http https://moroccan-law-mcp.vercel.app/mcp
```

### Local (npm)
```bash
npx @ansvar/moroccan-law-mcp
```

## Data Sources

Official Moroccan government publications:
- DGSSI legal/regulatory portal: https://www.dgssi.gov.ma/fr/textes-legislatifs-et-reglementaires
- SGG Bulletin Officiel portal: https://www.sgg.gov.ma/BulletinOfficiel.aspx
- OMPIC references: https://www.ompic.ma

Seed generation is performed by `npm run ingest` and writes real-source extraction output to `data/seed/` plus ingestion diagnostics in `data/seed/_ingestion-report.json`.

## License

Apache-2.0

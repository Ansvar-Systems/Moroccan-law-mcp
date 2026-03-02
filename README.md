# Moroccan Law MCP Server

**The Official Gazette (Al Jarida Al Rasmiya) alternative for the AI age.**
**البديل لعصر الذكاء الاصطناعي للجريدة الرسمية**

[![npm version](https://badge.fury.io/js/@ansvar%2Fmoroccan-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/moroccan-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Moroccan-law-mcp?style=social)](https://github.com/Ansvar-Systems/Moroccan-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/EU_INTEGRATION_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-61%2C351-blue)](docs/EU_INTEGRATION_GUIDE.md)

Query **3,946 Moroccan statutes** -- from la loi 09-08 sur la protection des données personnelles, le Code pénal marocain, and le Code du travail to le Code des sociétés, le Code de commerce, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Moroccan legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Moroccan legal research means navigating the Secrétariat Général du Gouvernement portal, the Bulletin Officiel, and Arabic-French bilingual texts that are rarely digitized or cross-linked. Whether you're:
- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking loi 09-08 obligations or ANPR requirements
- A **legal tech developer** building tools on Moroccan law
- A **researcher** tracing legislative provisions across 3,946 statutes in Arabic and French

...you shouldn't need dozens of browser tabs and manual bilingual cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Moroccan law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://moroccan-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add moroccan-law --transport http https://moroccan-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "moroccan-law": {
      "type": "url",
      "url": "https://moroccan-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "moroccan-law": {
      "type": "http",
      "url": "https://moroccan-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/moroccan-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "moroccan-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/moroccan-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "moroccan-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/moroccan-law-mcp"]
    }
  }
}
```

---

## Example Queries

Once connected, just ask naturally:

- *"ما هي أحكام القانون 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي؟"* (What does Law 09-08 say about personal data protection?)
- *"البحث عن 'حماية البيانات الشخصية' في القانون المغربي"* (Search for personal data protection in Moroccan law)
- *"Recherche 'protection des données personnelles' dans le droit marocain (loi 09-08)"*
- *"Quelles dispositions du Code pénal marocain concernent la cybercriminalité ?"*
- *"Recherche 'droit du travail marocain' dans le Code du travail"*
- *"ابحث عن أحكام الإجراءات الجنائية في قانون المسطرة الجنائية"* (Search criminal procedure provisions)
- *"What is Morocco's EU Association Agreement status for data protection?"*
- *"Validate the citation 'Loi 09-08, article 3'"*
- *"Find provisions about commercial companies in the Code des sociétés marocain"*
- *"Recherche les obligations de notification de la CNDP pour les entreprises françaises opérant au Maroc"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Statutes** | 3,946 statutes | Moroccan legislation from SGG and Bulletin Officiel |
| **Provisions** | 61,351 articles | Full-text searchable with FTS5 |
| **Case Law** | 0 (free tier) | Reserved for future ingestion |
| **Preparatory Works** | 0 (free tier) | Reserved for future ingestion |
| **Agency Guidance** | 0 (free tier) | Reserved for future ingestion |
| **Database Size** | ~101 MB | Optimized SQLite, portable |
| **Daily Updates** | Automated | Freshness checks against SGG/legislation.gov.ma |

**Verified data only** -- every citation is validated against official sources (sgg.gov.ma, legislation.gov.ma). Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from the Secrétariat Général du Gouvernement (sgg.gov.ma) and legislation.gov.ma
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains regulation text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law number + article
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
SGG / legislation.gov.ma --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                               ^                        ^
                        Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search SGG by law number | Search by plain Arabic or French: *"حماية البيانات"* / *"protection données"* |
| Navigate bilingual Arabic-French texts manually | Get the exact article with context |
| Manual cross-referencing between codes | `build_legal_stance` aggregates across sources |
| "Est-ce que cette loi est en vigueur ?" -> check manually | `check_currency` tool -> answer in seconds |
| Find EU association framework -> dig through EUR-Lex | `get_eu_basis` -> linked EU agreements instantly |
| Check SGG, Bulletin Officiel separately | Daily automated freshness checks |
| No API, no integration | MCP protocol -> AI-native |

**Traditional:** Search SGG -> Download Bulletin Officiel PDF -> OCR Arabic text -> Cross-reference with EU agreement -> Repeat

**This MCP:** *"What are Morocco's data protection obligations under the EU-Morocco Association Agreement?"* -> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 61,351 provisions with BM25 ranking (Arabic and French) |
| `get_provision` | Retrieve specific provision by law number + article |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes across Arabic and French sources |
| `format_citation` | Format citations per Moroccan conventions (full/short/pinpoint) |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `list_sources` | List all available statutes with metadata and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU/International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU agreements and frameworks related to Moroccan statutes |
| `get_moroccan_implementations` | Find Moroccan laws implementing or aligning with EU frameworks |
| `search_eu_implementations` | Search EU documents with Moroccan alignment counts |
| `get_provision_eu_basis` | Get EU law references for a specific provision |
| `validate_eu_compliance` | Check alignment status against EU Association Agreement obligations |

---

## EU Association & International Law Alignment

Morocco is not an EU member state, but holds one of the closest third-country relationships with the EU through the **Euro-Mediterranean Association Agreement** (in force since 2000) and the **Advanced Status** partnership (2008).

| Metric | Value |
|--------|-------|
| **EU Relationship** | Euro-Mediterranean Association Agreement (2000) + Advanced Status (2008) |
| **Data Protection** | Loi 09-08 (aligned with EU Directive 95/46/EC, pre-GDPR standard) |
| **CNDP** | Commission Nationale de contrôle de la protection des Données à caractère Personnel |
| **Trade Framework** | EU-Morocco Deep and Comprehensive Free Trade Area (DCFTA, under negotiation) |
| **Digital Partnership** | EU-Morocco Digital Partnership (2022) |

### Key EU-Aligned Moroccan Legislation

1. **Loi 09-08** -- Protection des données personnelles (aligned with EU Directive 95/46/EC, CNDP oversight)
2. **Loi 53-05** -- Échanges électroniques (e-commerce, aligned with EU e-Commerce Directive)
3. **Loi 07-03** -- Lutte contre la cybercriminalité (cybercrime, aligned with Budapest Convention)
4. **Code du travail (Loi 65-99)** -- Labour standards aligned with ILO conventions
5. **Code des sociétés** -- Company law aligned with EU corporate governance frameworks

> **Note:** Morocco's data protection regime (Loi 09-08) predates GDPR and does not currently hold an EU adequacy decision. Transfers of personal data from EU to Morocco require Standard Contractual Clauses or other GDPR Art. 46 safeguards. The EU-Morocco Digital Partnership (2022) includes discussions on data governance alignment.

See [EU_INTEGRATION_GUIDE.md](docs/EU_INTEGRATION_GUIDE.md) for detailed documentation.

---

## Data Sources & Freshness

All content is sourced from authoritative Moroccan legal databases:

- **[Secrétariat Général du Gouvernement](https://www.sgg.gov.ma/)** -- Official Moroccan government legal portal
- **[legislation.gov.ma](https://legislation.gov.ma/)** -- Moroccan legislation database (DGLAI)
- **[Bulletin Officiel](https://www.sgg.gov.ma/Bulletins.aspx)** -- Official gazette (Dahirs, Lois, Décrets)

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Secrétariat Général du Gouvernement (SGG) / Direction Générale des Lois et des Affaires Islamiques |
| **Retrieval method** | SGG portal and legislation.gov.ma |
| **Languages** | Arabic (official) and French (administrative) |
| **License** | Public domain (Moroccan official publications) |
| **Coverage** | 3,946 consolidated statutes |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks (Daily)

A [daily GitHub Actions workflow](.github/workflows/check-updates.yml) monitors all data sources:

| Source | Check | Method |
|--------|-------|--------|
| **Statute amendments** | SGG portal date comparison | All 3,946 statutes checked |
| **New statutes** | Bulletin Officiel publications (90-day window) | Diffed against database |
| **EU reference staleness** | Git commit timestamps | Flagged if >90 days old |

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Docker Security** | Container image scanning + SBOM generation | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **OSSF Scorecard** | OpenSSF best practices scoring | Weekly |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official SGG and legislation.gov.ma publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **Bilingual system** -- Moroccan law is official in Arabic; French versions are administrative translations. Verify Arabic text against the Bulletin Officiel for authoritative versions
> - **EU cross-references** reflect association and alignment relationships, not direct transposition

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [PRIVACY.md](PRIVACY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. For guidance on professional obligations, consult the Ordre National des Avocats du Maroc (Barreaux du Maroc / باروم). See [PRIVACY.md](PRIVACY.md) for compliance guidance.

---

## Documentation

- **[EU Integration Guide](docs/EU_INTEGRATION_GUIDE.md)** -- EU association framework documentation
- **[Security Policy](SECURITY.md)** -- Vulnerability reporting and scanning details
- **[Disclaimer](DISCLAIMER.md)** -- Legal disclaimers and professional use notices
- **[Privacy](PRIVACY.md)** -- Client confidentiality and data handling

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Moroccan-law-mcp
cd Moroccan-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                    # Ingest statutes from SGG / legislation.gov.ma
npm run build:db                  # Rebuild SQLite database
npm run drift:detect              # Run drift detection against anchors
npm run check-updates             # Check for amendments and new statutes
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~101 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 3,946 statutes

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### @ansvar/moroccan-law-mcp (This Project)
**Query 3,946 Moroccan statutes directly from Claude** -- Loi 09-08, Code pénal, Code du travail, Code des sociétés, and more. Full provision text in Arabic and French. `npx @ansvar/moroccan-law-mcp`

### [@ansvar/french-law-mcp](https://github.com/Ansvar-Systems/France-law-mcp)
**Query 3,958 French statutes** -- Code civil, Code pénal, loi Informatique et Libertés, and more. `npx @ansvar/french-law-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Cour de Cassation marocaine, tribunaux administratifs)
- CNDP decisions and guidance ingestion
- Historical statute versions and amendment tracking
- Arabic-language full-text search improvements

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (3,946 statutes, 61,351 provisions)
- [x] EU association law integration tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Cour de Cassation case law coverage
- [ ] CNDP guidance documents
- [ ] Historical statute versions (amendment tracking)
- [ ] Arabic-language search improvements

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{moroccan_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Moroccan Law MCP Server: Production-Grade Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Moroccan-law-mcp},
  note = {3,946 Moroccan statutes with 61,351 provisions in Arabic and French}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Secrétariat Général du Gouvernement du Maroc (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool for Moroccan law -- turns out everyone building compliance tools for North Africa and the MENA region has the same research frustrations.

So we're open-sourcing it. Navigating 3,946 statutes in Arabic and French shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>

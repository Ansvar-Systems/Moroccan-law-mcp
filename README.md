# Moroccan Law MCP Server

**The Adala alternative for the AI age.**

[![npm version](https://badge.fury.io/js/%40ansvar/moroccan-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/moroccan-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Moroccan-law-mcp?style=social)](https://github.com/Ansvar-Systems/Moroccan-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Moroccan-law-mcp/actions/workflows/ci.yml)

Query **3,946 Moroccan laws** with **61,351 provisions** -- from Loi 09-08 (data protection) and Loi 05-20 (cybersecurity) to the Code de Commerce and the Constitution -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Moroccan legal research, this is your verified reference database. Arabic + French bilingual.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Moroccan legal research means navigating the Adala portal, the Bulletin Officiel, DGSSI publications, and OMPIC registers -- across 53 legal domains, in Arabic and French. Whether you're:

- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking if a statute is still in force
- A **legal tech developer** building tools on Moroccan law
- A **researcher** tracing legislative history across legal domains

...you shouldn't need dozens of browser tabs and manual cross-referencing. Ask Claude. Get the exact provision. With context.

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

Once connected, just ask naturally (French or English):

- *"Que dit la Loi 09-08 sur la protection des donnees personnelles?"*
- *"What does Article 3 of the Cybersecurity Law (Loi 05-20) say?"*
- *"Search for provisions about commerce electronique"*
- *"Is the Code du Travail still in force?"*
- *"Which Moroccan laws implement EU data protection standards?"*
- *"Validate this legal citation"*
- *"Build a legal stance on cybersecurity obligations in Morocco"*
- *"Quelles sont les sanctions prevues par le Code Penal pour la fraude informatique?"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Laws** | 3,946 laws | Moroccan legislation across 53 legal domains |
| **Provisions** | 61,351 provisions | Full-text searchable with FTS5 |
| **Definitions** | 106 definitions | Legal term definitions extracted from statutes |
| **EU Cross-References** | Yes | EU integration tools for directive mappings |
| **Database Size** | ~101 MB | Optimized SQLite, portable |

**Verified data only** -- every citation is validated against official sources (Adala/Ministry of Justice, DGSSI, OMPIC). Zero LLM-generated content.

---

## Key Legislation Covered

| Law | Significance |
|-----|-------------|
| **Loi 09-08** | Data protection (modeled on EU Directive 95/46/EC); establishes the CNDP |
| **Loi 05-20** | Cybersecurity framework; critical infrastructure protection |
| **Constitution 2011** | Supreme law; fundamental rights and freedoms |
| **Code de Commerce** | Commercial law framework |
| **Code Penal** | Criminal law including computer crime offences |
| **Code du Travail** | Labour law and employment regulations |
| **Moudawana (Code de la Famille)** | Family law |
| **Loi 31-08** | Consumer protection |
| **Loi 53-05** | Electronic exchange of legal data |

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across all provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by statute + article |
| `check_currency` | Check if statute is in force, amended, or repealed |
| `validate_citation` | Validate citation against database (zero-hallucination check) |
| `build_legal_stance` | Aggregate citations from statutes for a legal topic |
| `format_citation` | Format citations per Moroccan conventions (full/short/pinpoint) |
| `list_sources` | List all available statutes with metadata |
| `about` | Server info, capabilities, and coverage summary |

### EU/International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations for Moroccan statute |
| `get_moroccan_implementations` | Find Moroccan laws implementing EU act |
| `search_eu_implementations` | Search EU documents with Moroccan implementation counts |
| `get_provision_eu_basis` | Get EU law references for specific provision |
| `validate_eu_compliance` | Check implementation status of EU directives |

---

## EU Law Integration

Morocco has an advanced status agreement with the EU and has aligned parts of its legal framework with EU standards. The EU integration tools let you:

- Trace which EU directives a Moroccan law implements (e.g., Loi 09-08 implements Directive 95/46/EC)
- Find all Moroccan laws that implement a specific EU regulation
- Check implementation completeness for EU directives
- Get provision-level EU law references

---

## Data Sources & Freshness

All content is sourced from authoritative Moroccan legal databases:

- **[Adala (Ministry of Justice)](https://adala.justice.gov.ma)** -- Official Moroccan legal database, 53 legal domains
- **[DGSSI](https://www.dgssi.gov.ma)** -- Cybersecurity legislation and regulatory texts
- **[OMPIC](https://www.ompic.ma)** -- Intellectual property and commercial regulations

A daily automated check workflow (`check-updates.yml`) monitors source portals for new legislation and amendments.

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Drift Detection** | Monitors source data for upstream changes | Scheduled |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/automotive-cybersecurity-mcp](https://github.com/Ansvar-Systems/Automotive-MCP)
**Query UNECE R155/R156 and ISO 21434** -- Automotive cybersecurity compliance. `npx @ansvar/automotive-cybersecurity-mcp`

**75+ national law MCPs** covering Australia, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Iceland, India, Ireland, Israel, Italy, Japan, Kenya, Netherlands, Nigeria, Norway, Singapore, Slovenia, South Korea, Sweden, Switzerland, Thailand, UAE, UK, and more.

---

## Contributing

Contributions welcome. Priority areas:

- Additional statutory instruments and ministerial decrees
- Court case law expansion
- EU cross-reference improvements
- Historical statute versions and amendment tracking
- Arabic/French translation quality improvements

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

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{moroccan_law_mcp_2025,
  author = {Ansvar Systems AB},
  title = {Moroccan Law MCP Server: AI-Powered Legal Research Tool},
  year = {2025},
  url = {https://github.com/Ansvar-Systems/Moroccan-law-mcp},
  note = {Moroccan legal database with full-text search and EU cross-references}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Moroccan Government (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Moroccan government publications. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is limited** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **EU cross-references** are extracted from statute text, not EUR-Lex full text

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building compliance tools has the same research frustrations.

So we're open-sourcing it.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>

# Privacy & Client Confidentiality / Confidentialité et vie privée

**IMPORTANT READING FOR LEGAL PROFESSIONALS**
**LECTURE IMPORTANTE POUR LES PROFESSIONNELS DU DROIT**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Moroccan bar association rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- Association des Barreaux du Maroc and Ordre des Avocats rules require strict confidentiality controls

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/moroccan-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/moroccan-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://moroccan-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text, provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Morocco)

### Moroccan Bar Association Rules

Moroccan lawyers (avocats) are bound by strict confidentiality rules under the Law No. 28-08 on the Legal Profession (Loi organisant la profession d'avocat) and the professional codes of conduct of the Association des Barreaux du Maroc.

#### Secret professionnel / السر المهني

- All client communications are privileged under Moroccan law
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected
- Information that could identify clients or matters must be safeguarded
- Breach of professional secrecy is a criminal offense under the Moroccan Penal Code (Article 446)

### Law 09-08 on Protection of Personal Data and Client Data Processing

Under **Law 09-08 on Protection of Individuals with regard to Processing of Personal Data**, when using services that process client data:

- You are the **Data Controller** (responsable du traitement)
- AI service providers (Anthropic, Vercel) may be **Data Processors** (sous-traitants)
- Processing must be declared to or authorized by the **CNDP** (Commission Nationale de contrôle de la protection des Données à caractère Personnel)
- Ensure adequate technical and organizational measures
- Cross-border data transfers require CNDP authorization if the recipient country does not provide adequate protection

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does the Moroccan Commercial Code say about company formation requirements?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties for customs fraud under Moroccan law?"
```

- Query pattern may reveal you are working on a customs fraud matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases with proper data processing declarations

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (Artemis / Lexis MA, Juris Maroc)

### For Large Firms / Corporate Legal

1. File necessary CNDP declarations for AI data processing
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns

### For Government / Public Sector

1. Use self-hosted deployment, no external APIs
2. Follow Moroccan government data security requirements (DGSSI guidelines)
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/Moroccan-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **Moroccan Bar Guidance**: Consult the Association des Barreaux du Maroc or your local Ordre des Avocats ethics guidance
- **CNDP**: Contact the Commission Nationale de contrôle de la protection des Données à caractère Personnel

---

**Last Updated**: 2026-02-22
**Tool Version**: 1.0.0

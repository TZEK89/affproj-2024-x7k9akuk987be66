# DECISION LOG
## Affiliate Marketing AI System - Architectural Decision Records

---

## ADR-001: MCP over Direct API Calls

**Date:** December 27, 2025  
**Status:** Accepted

### Context
The system needs to integrate Claude and Perplexity AI services. Options were:
1. Direct API calls from backend
2. MCP servers as intermediaries
3. Hybrid approach

### Decision
Use MCP servers deployed as Cloudflare Workers for all AI integrations.

### Rationale
- **Consistency:** Same interface for all AI tools
- **Orchestration:** Manus can chain tools seamlessly
- **Reliability:** Cloudflare Workers provide 99.99% uptime
- **Cost:** Free tier covers expected usage (100K requests/day)
- **Flexibility:** Easy to add new AI providers

### Consequences
- Slight latency overhead (negligible)
- Need to maintain Worker code
- API keys stored in Cloudflare secrets

---

## ADR-002: Cloudflare Workers for MCP Hosting

**Date:** December 27, 2025  
**Status:** Accepted

### Context
MCP servers need to be accessible from Manus (cloud). Options were:
1. Local servers with Cloudflare Tunnel
2. Cloudflare Workers (serverless)
3. Railway/Vercel deployment
4. AWS Lambda

### Decision
Deploy MCP servers as Cloudflare Workers.

### Rationale
- **Always On:** No local machine required
- **Global Edge:** Low latency worldwide
- **Free Tier:** 100,000 requests/day free
- **Simple:** No infrastructure management
- **Existing Account:** Already using Cloudflare for domain

### Consequences
- Limited to 10ms CPU time per request (sufficient for API proxying)
- 128MB memory limit (sufficient)
- Must use fetch API (not Node.js native modules)

---

## ADR-003: File-Based Context Retention System

**Date:** December 27, 2025  
**Status:** Accepted

### Context
AI agents (including Manus) lose context during long sessions, leading to:
- Repeated mistakes
- Forgotten decisions
- Inconsistent implementations

### Decision
Implement a file-based context system with mandatory read/write protocols:
- `SOURCE_OF_TRUTH.md` - Master architecture reference
- `CURRENT_STATUS.md` - Active work tracker
- `DECISION_LOG.md` - This file
- `ERROR_LOG.md` - Past errors and solutions

### Rationale
- **Persistence:** Files survive session boundaries
- **Verifiable:** Can always check what was decided
- **Shareable:** Human and AI can both read/write
- **Git-tracked:** Full history of changes

### Consequences
- Overhead of reading files at session start
- Discipline required to update files
- Files must be kept in sync with reality

---

## ADR-004: SOP-Driven Development

**Date:** December 27, 2025  
**Status:** Accepted

### Context
Code quality and dashboard reliability have been inconsistent. Need to enforce standards.

### Decision
Create comprehensive SOPs based on industry best practices (Cursor, Devin, Lovable, v0, etc.) and enforce them through project instructions.

### Rationale
- **Consistency:** Same quality standards every time
- **Prevention:** Catch issues before they happen
- **Learning:** Incorporate best practices from successful AI tools
- **Accountability:** Clear expectations for all work

### Consequences
- Initial time investment to create SOPs
- Must update SOPs as we learn
- May slow down initial development (but prevents rework)

---

## Template for New Decisions

```markdown
## ADR-XXX: [Decision Title]

**Date:** [Date]  
**Status:** [Proposed | Accepted | Deprecated | Superseded]

### Context
[Why is this decision needed?]

### Decision
[What was decided?]

### Rationale
[Why this option over alternatives?]

### Consequences
[What are the implications?]
```

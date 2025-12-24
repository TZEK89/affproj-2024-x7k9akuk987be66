# Current Context - AI Affiliate Marketing System

**Last Updated:** December 24, 2025  
**Author:** Manus AI  
**Status:** Active Development

---

## Current State Summary

The AI Affiliate Marketing System is in active development with Core #1 (Offer Intelligence Engine) at 65% completion. Both frontend and backend are deployed and operational on Railway. **NEW:** Self-hosted MCP infrastructure is now operational on the user's Windows PC, providing centralized access to AI tools from any machine.

---

## What's Working ✅

### Self-Hosted MCP Infrastructure (NEW - Dec 24, 2025)

- **Host:** Windows PC (64GB RAM, 1TB NVMe) with WSL2
- **Status:** ✅ Fully operational
- **Access:** SSH via localhost:2222 (local) or Cloudflare Tunnel (remote)

**Running MCP Servers:**
- **Manus Bridge:** Send tasks to Manus AI from Claude Desktop
- **Perplexity:** Real-time AI-powered web research
- **Railway:** Deployment management (local)
- **Affiliate Browser:** Custom affiliate system (local)
- **BrightData:** Web scraping (local)

**Infrastructure Components:**
- Docker Compose with Cloudflare Tunnel
- SSH Server (linuxserver/openssh-server)
- Secure SSH key authentication
- Auto-restart on failure

### Frontend (Fully Deployed)

- **URL:** `https://affiliate-marketing-dashboard-production.up.railway.app`
- **Status:** ✅ Healthy and responding
- **Latest Deployment:** 53a1f4a7-3c82-4a98-8063-e2fff58ba44b (SUCCESS)

**Working Features:**
- Dashboard with 8-core navigation
- Platform Connections page (reorganized to Core #1)
- Hotmart connection modal with Local Connect instructions
- Offers page with product listings
- Discovery page
- All pages branded with Core #1 identity

### Backend (Fully Deployed)

- **URL:** `https://affiliate-backend-production-df21.up.railway.app/api`
- **Status:** ✅ Healthy and responding
- **Latest Deployment:** 03e18f75-d53c-4abe-8d99-5a780c793a74 (SUCCESS)
- **Database:** Supabase PostgreSQL connected
- **Redis:** BullMQ connected
- **Authentication:** Disabled (mock user mode for personal use)

**Working APIs:**
- `/api/discovery/*` - Product discovery and scraping
- `/api/platform-connections/*` - Platform connection management
- `/api/browser-session/*` - Browser session management
- `/api/llm-config/*` - LLM configuration with encryption
- `/api/agentic-scraper/*` - Intelligent scraping missions
- `/api/agent-analytics/*` - AI agent performance metrics
- `/api/command-center/*` - AI chat interface
- `/api/local-connect/hotmart/status` - Hotmart connection status
- `/api/local-connect/hotmart/upload` - Session upload endpoint

**Working Features:**
- Platform connection system with AES-256-GCM encryption
- Agentic scraping with dynamic tool selection
- LLM configuration with encrypted API key storage
- AI agent performance tracking
- 152 products already scraped from Hotmart
- Local Connect system for Hotmart (session fingerprinting)

---

## Recent Work (December 24, 2025)

### Self-Hosted MCP Infrastructure Setup

1. **Docker Infrastructure Created**
   - Docker Compose with Cloudflare Tunnel and SSH server
   - Secure SSH key authentication (ed25519)
   - Volume mounts for MCP servers

2. **Manus Bridge MCP Installed**
   - Custom MCP server for Manus AI task delegation
   - 4 tools: send_task, check_status, list_tasks, cancel_task
   - API key configured and working

3. **Perplexity MCP Installed**
   - 5 tools: search, pro_search, reasoning, deep_research, chat
   - Real-time web research capabilities
   - API key configured and working

4. **Claude Desktop Configured**
   - Both MCPs accessible via WSL SSH
   - Tested and verified working
   - Can be used from any machine with SSH key

5. **Documentation Created**
   - Session Report: `docs/session-summaries/2025-12-24_MCP_Infrastructure_Session.md`
   - Remote Access Guide: `docs/MCP_REMOTE_ACCESS_GUIDE.md`
   - Integrations Report: `docs/MCP_INTEGRATIONS_REPORT.md`

---

## MCP Infrastructure Details

### Host Machine Requirements
- Windows PC must be powered on
- Docker Desktop running
- WSL2 available
- Internet connection for Cloudflare Tunnel

### Starting the Infrastructure
```bash
cd ~/mcp-infrastructure
docker-compose up -d
docker-compose ps  # Verify running
```

### Claude Desktop Configuration (Local)
```json
{
  "mcpServers": {
    "manus-bridge": {
      "command": "wsl",
      "args": [
        "ssh", "-i", "/home/mk/.ssh/mcp_key", "-p", "2222",
        "linuxserver.io@localhost",
        "cd /mcp-servers/manus-bridge && MANUS_API_KEY=<key> node index.js"
      ]
    },
    "perplexity": {
      "command": "wsl",
      "args": [
        "ssh", "-i", "/home/mk/.ssh/mcp_key", "-p", "2222",
        "linuxserver.io@localhost",
        "cd /mcp-servers/perplexity && PERPLEXITY_API_KEY=<key> node index.js"
      ]
    }
  }
}
```

### Remote Access (From Other Machines)
See `docs/MCP_REMOTE_ACCESS_GUIDE.md` for complete instructions.

---

## What's Blocked 🚧

**None currently.** All deployment issues resolved.

---

## What's Missing 🔴

### Core Features Not Yet Implemented

1. **AI Profitability Scoring** (Core #1)
   - No scoring algorithm for discovered products
   - Manual review required

2. **Content Generation** (Core #2)
   - LLM integration exists for chat, not for content
   - No ad copy generation
   - No landing page content generation

3. **Ad Platform APIs** (Core #3)
   - No Facebook Ads integration
   - No Google Ads integration
   - Cannot launch actual campaigns

4. **Landing Page Generation** (Core #5)
   - No template library
   - No page generation engine
   - No Vercel deployment automation

5. **Email Automation** (Core #7)
   - No email sequences
   - No list management
   - No nurture workflows

6. **Compliance Checking** (Core #8)
   - Entire core not started
   - No automated compliance

---

## Technical Architecture

### Stack

- **Frontend:** Next.js 14 + TypeScript + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** Supabase PostgreSQL
- **Queue:** Redis + BullMQ
- **Deployment:** Railway (both services)
- **Encryption:** AES-256-GCM for sessions and API keys
- **MCP Infrastructure:** Docker + Cloudflare Tunnel + SSH (NEW)

### Key Technologies

- **Playwright MCP:** Browser automation for platform connections
- **Firecrawl MCP:** Web scraping
- **Supabase MCP:** Database operations
- **Vercel MCP:** Deployment automation
- **Railway MCP:** Deployment management
- **OpenAI GPT-4o:** AI agents and chat
- **Manus Bridge MCP:** Task delegation to Manus AI (NEW)
- **Perplexity MCP:** Real-time web research (NEW)

---

## Next Steps (Priority Order)

### Immediate (Next Session)

1. **Set Up Remote Access**
   - Configure Cloudflare Access for SSH
   - Install cloudflared on other machines
   - Test remote MCP access

2. **Add More MCP Servers**
   - Memory MCP (persistent context)
   - Filesystem MCP (file operations)
   - GitHub MCP (repository management)

3. **Test Hotmart Local Connect**
   - Run Local Connector on local machine
   - Authenticate with Hotmart
   - Verify session upload

### Short-Term (This Week)

4. **Implement AI Profitability Scoring**
   - Design scoring algorithm
   - Integrate with LLM
   - Test on existing products

5. **Add Content Generation**
   - Create prompt templates
   - Integrate LLM for ad copy
   - Build content generation UI

### Medium-Term (Next 2 Weeks)

6. **Start Ad Platform Integration**
   - Research Facebook Ads API
   - Create developer account
   - Implement basic campaign creation

7. **Build Landing Page Factory**
   - Create template library
   - Implement page generation
   - Integrate Vercel deployment

---

## Known Issues

**None currently.** All critical issues resolved in latest session.

---

## Resources

### Documentation
- `OPERATIONAL_MANUAL.md` - Complete operational guide
- `FEATURE_STATUS.md` - Current status of all features
- `AI_OPERATING_SYSTEM_STRATEGY.md` - Vision and roadmap
- `TECHNICAL_SPECIFICATIONS.md` - Technical details
- `MCP_REMOTE_ACCESS_GUIDE.md` - Remote access setup (NEW)
- `MCP_INTEGRATIONS_REPORT.md` - Potential integrations (NEW)
- `docs/session-summaries/2025-12-24_MCP_Infrastructure_Session.md` - Latest session

### Deployment
- Frontend: https://affiliate-marketing-dashboard-production.up.railway.app
- Backend: https://affiliate-backend-production-df21.up.railway.app/api
- Database: Supabase dashboard
- GitHub: https://github.com/TZEK89/affiliate-marketing-system
- MCP Infrastructure: localhost:2222 (SSH) or mcp.mkaxonet.com (Cloudflare)

### Recent Commits
- `<pending>` - MCP Infrastructure documentation (latest)
- `b053e2d` - Integration flow fixes
- `6f80534` - Railway deployment fixes
- `175ff6c` - Dashboard reorganization

---

**End of Current Context**

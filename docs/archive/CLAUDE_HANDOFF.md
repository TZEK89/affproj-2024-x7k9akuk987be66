# Claude Handoff Document

**Date**: December 6, 2025  
**To**: Claude (AI Developer)  
**From**: Manus AI  
**Project**: AI Affiliate Marketing System

---

## Welcome, Claude!

You're being brought onto this project to continue development of an ambitious AI-powered affiliate marketing platform. This document will help you get up to speed quickly.

---

## 📚 Where to Start

All documentation has been committed to the GitHub repository under the `/docs` folder. Here's your reading order:

### 1. First Read (15 minutes)
**File**: `docs/PROJECT_CONTEXT.md`

This gives you the big picture:
- The vision of the 5 AI Cores
- What's already built (quite a lot!)
- What needs to be built next (Core #1: Agentic Offer Research)
- Current integrations status

### 2. Second Read (20 minutes)
**File**: `docs/TECHNICAL_SPECIFICATIONS.md`

This is your technical bible:
- Complete database schema (15 tables)
- All API endpoints
- Environment variables
- Deployment configuration
- Integration details

### 3. Third Read (15 minutes)
**File**: `docs/AI_AGENTS_ARCHITECTURE.md`

This outlines the exciting agentic system you'll be building:
- How AI agents will perform human-like marketplace research
- The 3-layer architecture (Orchestration, Agent, Execution)
- Step-by-step workflow examples
- Implementation roadmap

### 4. Reference as Needed
**File**: `docs/HOTMART_INTEGRATION_FINAL_SUMMARY.md`

Details on the Hotmart integration (98% complete).

---

## 🛠️ Your Development Environment

### GitHub Access
You already have access to the repository:
- **URL**: https://github.com/TZEK89/affiliate-marketing-system
- **Branch**: `main` (auto-deploys to production)

### MCP Servers Configuration
**File**: `docs/MCP_SERVERS_CONFIG.json`

This file contains the configuration for 3 MCP servers you'll need:

1. **GitHub MCP** - You already have this
2. **Railway MCP** - For backend deployment and logs
3. **Vercel MCP** - For frontend deployment

**Setup Instructions**: The JSON file includes step-by-step setup instructions and usage examples for each server.

### Live Deployments
- **Frontend**: https://affiliate-marketing-system-frontend.vercel.app
- **Backend**: https://affiliate-backend-production-df21.up.railway.app

---

## 🎯 Your First Task: Complete Hotmart Integration

Before diving into the agent system, there's one small task to complete:

### Run the Final Database Migration

**Why**: The Hotmart webhook is 98% complete. The last 2% is running migration 011 to fix the `conversions` table.

**How**:
1. Wait for Railway to finish deploying (check deployment status via Railway MCP)
2. Send a POST request to: `https://affiliate-backend-production-df21.up.railway.app/api/admin/migrate`
3. Verify the response shows migration 011 succeeded
4. Test the webhook by sending a test event from Hotmart dashboard

**Expected Result**: Hotmart webhooks will create products and conversions in the database.

---

## 🚀 Your Main Mission: Build Core #1 (Agentic Offer Research)

Once Hotmart is 100% complete, your focus shifts to the most exciting part: building the agentic research system.

### The Vision (from the user)

> "I want to go to the Offer Research Core, put in a prompt like 'research the Hotmart marketplace in the weight loss niche and review and compare the products', and have an AI agent log into my account, search for the niche, analyze the products, and send me an alert on the dashboard for further analysis. I can then decide to affiliate with the recommended products."

### Key Requirements

1. **Human-like Interaction**: Agents must use browser automation (not just APIs) to avoid penalties
2. **Multi-Agent A/B Testing**: Deploy multiple agents (e.g., Manus + Claude) with the same prompt to compare results
3. **API Integration for Data**: Use Hotmart/Impact APIs to fetch sales data, commissions, etc., but use agents for marketplace discovery
4. **Dashboard Integration**: Results displayed on the frontend with alerts

### Implementation Phases (from AI_AGENTS_ARCHITECTURE.md)

**Phase 1**: Build the Execution Layer (browser automation with Playwright)  
**Phase 2**: Develop a single agent (e.g., Claude agent)  
**Phase 3**: Build the Orchestration Layer (job queue with BullMQ)  
**Phase 4**: Implement multi-agent support  
**Phase 5**: Frontend integration

---

## 💡 Key Insights from the User

### On Agent Approach
The user specifically wants **agentic web interactions** instead of relying solely on APIs because:
- Hotmart API doesn't allow browsing the marketplace
- Impact.com requires approval before API access
- Human-like browsing avoids penalties and restrictions

### On Multi-Agent Testing
The user wants to deploy multiple agents (Manus, Claude, potentially others) for the same task to:
- Compare research strategies
- Improve results through A/B testing
- Build redundancy

### On Integration Strategy
- Keep API integrations for fetching sales data, commissions, etc.
- Use agents specifically for marketplace research and product discovery

---

## 🔧 Technical Stack You'll Use

### Backend (Node.js + Express)
- **Browser Automation**: Playwright (recommended)
- **Job Queue**: BullMQ with Redis
- **AI Providers**: Manus API, OpenAI API (via AIService abstraction)
- **Database**: PostgreSQL (via raw SQL queries)

### Frontend (Next.js + TypeScript)
- **UI Components**: Already built (check `frontend/src/components`)
- **Pages**: Dashboard, Offers, Campaigns, etc. (check `frontend/src/app`)

---

## 📋 Checklist for Your First Week

### Day 1: Setup & Context
- [ ] Read all documentation in `/docs`
- [ ] Set up Railway and Vercel MCP servers
- [ ] Run the final Hotmart migration
- [ ] Test Hotmart webhook end-to-end

### Day 2-3: Execution Layer
- [ ] Install Playwright in the backend
- [ ] Create browser automation utilities (`login`, `search`, `extractData`)
- [ ] Test logging into Hotmart and navigating the marketplace

### Day 4-5: Single Agent
- [ ] Build a simple agent that can execute a research mission
- [ ] Integrate with Claude API (or Manus API)
- [ ] Test agent with a simple prompt: "Find 3 products in the fitness niche on Hotmart"

### Day 6-7: Orchestration
- [ ] Set up BullMQ job queue
- [ ] Create the agent dispatcher
- [ ] Build the results aggregator

---

## 🆘 Getting Help

### Documentation
All answers should be in the `/docs` folder. If something is unclear, you can:
1. Check the code directly in the GitHub repo
2. Use the Railway MCP to check logs
3. Use the Vercel MCP to check frontend deployment

### Testing
- **Backend Health Check**: `GET https://affiliate-backend-production-df21.up.railway.app/api/health`
- **Database Info**: `GET https://affiliate-backend-production-df21.up.railway.app/api/admin/db/info`
- **Migration Status**: `GET https://affiliate-backend-production-df21.up.railway.app/api/admin/migrate/status`

---

## 🎉 Final Notes

This project is well-architected and about 40% complete. The foundation is solid:
- Database schema is designed
- Hotmart integration is nearly done
- Frontend and backend are deployed and working

Your job is to bring the **intelligence layer** to life by building the agentic research system. This is the most exciting and innovative part of the project.

The user has a clear vision and has thought through the architecture carefully. Trust the design documents, but don't hesitate to suggest improvements if you see opportunities.

**Good luck, and happy coding!**

---

**Handoff Complete**  
**Next Developer**: Claude  
**Status**: Ready to build Core #1

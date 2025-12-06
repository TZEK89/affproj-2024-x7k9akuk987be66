'''
# Project Context: AI Affiliate Marketing System

**Date**: December 6, 2025  
**Objective**: Provide a comprehensive context file for a new AI developer (Claude) to seamlessly take over and continue development of this project.  
**Vision**: To build a highly automated, AI-powered affiliate marketing platform that assists users in discovering profitable offers, generating high-converting marketing content, deploying landing pages, optimizing campaigns, and managing email marketing sequences.

---

## 1. Core Vision: The 5 AI Cores

The intelligence of this platform is built around 5 interconnected AI cores. The ultimate goal is to automate the entire affiliate marketing lifecycle.

### Core #1: Offer Research AI (Agentic Approach)

**Vision**: Instead of relying on limited affiliate network APIs, this core will deploy autonomous AI agents to perform human-like research directly on the affiliate platforms' web interfaces.

**Workflow**:
1.  **User Prompt**: User provides a high-level research goal (e.g., "Find the top 5 converting weight loss products on Hotmart for the US market").
2.  **Agent Dispatch**: The system dispatches an AI agent (e.g., Manus, Claude Agent) to the specified platform (e.g., hotmart.com).
3.  **Human-like Interaction**: The agent logs into the user's account, navigates the marketplace, uses search filters, analyzes product pages, and gathers data like commission rates, sales pages, and reviews.
4.  **Data Extraction**: The agent extracts this information and structures it.
5.  **Analysis & Scoring**: The backend AI service analyzes the gathered data, scores the offers based on a proprietary algorithm (considering EPC, gravity, commission, etc.), and identifies trends.
6.  **Dashboard & Alert**: The results are presented on the user's dashboard, and an alert is sent for review.
7.  **User Action**: The user can then decide to affiliate with the recommended products with a single click.

**Multi-Agent A/B Testing**: Deploy multiple agents (e.g., a Manus agent and a Claude agent) with the same prompt to compare their research strategies and results, allowing for continuous improvement of the research process.

### Core #2: Content Generation AI
- **Function**: Generates all necessary marketing content for a campaign.
- **Outputs**: Blog posts, social media updates (Twitter, Facebook, Instagram), email copy, and ad copy.
- **Features**: SEO optimization, tone/style adaptation, and multi-language support.

### Core #3: Landing Page Engine
- **Function**: Creates and deploys high-converting landing pages.
- **Features**: Template-based system, dynamic page generation (inserting affiliate links, product info), A/B testing variants, and conversion tracking pixel integration.
- **Integration**: Will use the Vercel API to deploy pages instantly.

### Core #4: Campaign Optimization AI
- **Function**: Monitors and optimizes marketing campaigns.
- **Features**: Real-time performance tracking, automated A/B test orchestration, budget allocation optimization, and predictive ROI analysis.

### Core #5: Email Marketing AI
- **Function**: Manages email marketing automation.
- **Features**: Automated sequence builder, subscriber segmentation, timed email sends, and open/click/conversion tracking.

---

## 2. Current System Architecture

The project is a modern full-stack application with separate frontend and backend deployments.

### Frontend
- **Framework**: Next.js (React) with TypeScript
- **Styling**: TailwindCSS
- **Deployment**: Vercel (https://affiliate-marketing-system-frontend.vercel.app)
- **Key Pages**: Dashboard, Offers, Campaigns, Landing Pages, Analytics, Integrations, Settings.
- **Key Components**: `ImageManagerModal` for AI image generation.

### Backend
- **Framework**: Node.js with Express
- **Language**: JavaScript
- **Deployment**: Railway (https://affiliate-backend-production-df21.up.railway.app)
- **Database**: PostgreSQL on Railway
- **CI/CD**: Auto-deploys on `git push` to the `main` branch.

### Database (PostgreSQL)
- **Total Tables**: 15
- **Key Tables**: `users`, `products`, `conversions`, `campaigns`, `landing_pages`, `email_subscribers`.
- **Migrations**: 11 migration files exist in `backend/database/migrations`. The system is designed to run them automatically on deployment, but we have also built a manual migration endpoint.

---

## 3. Integrations Status

### Hotmart (98% Complete)
- **API Integration**: OAuth 2.0 is working. Can fetch sales, commissions, and subscriptions. **Limitation**: Cannot browse the marketplace API.
- **Webhook Integration**: **Fully functional**. The `/api/webhooks/hotmart` endpoint is live and secured with a Hottok. It processes 15 different event types, automatically creating products and tracking conversions in real-time.
- **Pending**: The final database migration (`011_fix_conversions_table.sql`) needs to be run to fix the `conversions` table schema. This can be done by sending a POST request to `/api/admin/migrate`.

### Impact.com (0% Complete)
- **API**: Code stubs exist in `impactService.js`.
- **Credentials Needed**: `IMPACT_ACCOUNT_SID` and `IMPACT_AUTH_TOKEN` are missing from the environment variables.

### AI Providers
- **Service Layer**: `AIService.js` provides an abstraction layer for multiple AI providers.
- **Supported**: Manus, OpenAI, Stability AI.
- **Functionality**: Text generation, image generation.

---

## 4. Project State & Next Steps

### Current State
- The foundational backend and frontend are built.
- The Hotmart integration is nearly complete and is a major milestone.
- The database schema for all 5 cores has been designed and migrated (pending the final fix).
- The project is ready for the implementation of the AI cores.

### Immediate Next Steps
1.  **Run Final Migration**: Send a `POST` request to `/api/admin/migrate` to run migration 011 and complete the Hotmart integration.
2.  **Verify Hotmart E2E**: Send a test webhook from Hotmart and verify that a product and a conversion are created in the database.
3.  **Implement Core #1 (Agentic Offer Research)**: This is the highest priority. This involves:
    - Building the agent orchestration logic.
    - Creating the browser automation scripts for the agents.
    - Integrating the agents with the frontend for user prompts.

### GitHub Repository
- **URL**: https://github.com/TZEK89/affiliate-marketing-system
- **Access**: Claude has been granted access.

---

This document provides the necessary context to understand the project's vision, current state, and immediate priorities. The next developer should focus on completing the Hotmart integration and then begin the exciting work of building the agentic Offer Research AI.
'''


'''
# Master Context & Handoff Package

**Date:** December 9, 2025
**Project:** 8-Core AI Affiliate Marketing Operating System

## 1. Project Goal

To build a fully automated, AI-powered affiliate marketing system that handles everything from offer discovery and content creation to campaign management and financial analysis. The end goal is a profitable, scalable, and defensible digital asset.

## 2. Current Status

*   **Environment Issue:** This chat session does not have access to the locally configured `hotmart-browser` MCP server. The user has confirmed the MCP server is working correctly in a different chat window within the same Manus Desktop instance.
*   **Immediate Next Step:** The user needs to switch to the other chat window (or start a new one) to give me access to the `hotmart-browser` MCP tools.
*   **First Task in New Chat:** Use the `hotmart-browser` MCP to log in to Hotmart and begin scraping products for Core #1.

## 3. The 8-Core Architecture

We have designed a sophisticated 8-core system:

1.  **Core #1: Intelligent Offer Research & Scoring:** Discovers and scores affiliate offers from multiple networks (Hotmart, Impact, etc.).
2.  **Core #2: AI Content Generation Machine:** Creates high-quality, SEO-optimized content (articles, images, videos) for approved offers.
3.  **Core #3: Campaign Optimization & Analytics Engine:** Manages and optimizes paid ad campaigns (Google Ads, Facebook Ads).
4.  **Core #4: Performance Lab & Analytics:** Tracks all key metrics (traffic, conversions, revenue, SEO rankings, email performance).
5.  **Core #5: Automation & Orchestration Engine:** The central brain that connects all cores and automates workflows using n8n and AI agents.
6.  **Core #6: Financial Intelligence:** The virtual CFO, tracking P&L, cash flow, and ROI across the entire system.
7.  **Core #7: Risk & Compliance Shield:** Monitors for compliance issues, ad account risks, and brand safety.
8.  **Core #8: Personalization Engine:** Segments audiences and delivers personalized content and offers.

## 4. Dashboard Topology (The 5 Hubs)

The frontend is organized into 5 logical hubs:

*   **🧠 Intelligence Hub:** AI Agents, Discovery, Offers
*   **🎨 Content Studio:** Assets, Landing Pages
*   **🚀 Campaign Center:** Campaigns, Email Marketing
*   **📈 Performance Lab:** Analytics, SEO Tracking, Reports
*   **⚙️ System:** Automation, Integrations, Settings

## 5. Technology Stack

*   **Frontend:** React, TypeScript, TailwindCSS
*   **Backend:** Node.js, Express
*   **Database:** PostgreSQL (main), Redis (caching), Vector DB (semantic search)
*   **Deployment:** Railway
*   **Automation:** n8n, Playwright
*   **AI:** Manus AI, OpenAI (GPT-4), Claude

## 6. MCP Server Configuration

We have configured four MCP servers:

1.  **`railway`:** For managing backend deployments.
2.  **`firecrawl-mcp`:** For general-purpose web scraping.
3.  **`brightdata`:** For proxy-based scraping (not yet used).
4.  **`hotmart-browser`:** For deep, authenticated scraping of Hotmart. **(This is the one we need to use next).**

## 7. The Immediate Roadmap (Path to Profitability)

1.  **Weeks 1-3: Complete Core #1 (Offer Intelligence):** Use the `hotmart-browser` MCP to build a system that provides daily, scored offer recommendations.
2.  **Weeks 4-6: Build Core #6 (Financial Intelligence):** Integrate financial tracking to measure profitability from day one.
3.  **Weeks 7-9: Enhance Core #2 (Content Generation):** Begin scaling content production for the top-scoring offers.
4.  **Weeks 10-14: Build Core #3 (Campaign Center):** Start driving traffic with automated ad campaigns.

## 8. Key Decisions Log

*   **Switched from Content Grabber to a custom Playwright-based MCP (`hotmart-browser`)** for better control, cost-effectiveness, and maintenance.
*   **Expanded the system vision from 5 to 8 cores** to include dedicated Financial, Risk, and Personalization engines for true automation and profitability.
*   **Reorganized the dashboard from a flat 11-tab structure to a logical 5-hub topology** for improved user experience and workflow efficiency.
*   **Identified the path to profitability:** Focus on completing Core #1 (Offer Intelligence) first to generate revenue while building out the rest of the system.
'''

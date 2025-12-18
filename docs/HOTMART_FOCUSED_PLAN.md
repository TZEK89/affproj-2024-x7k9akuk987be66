# Revised Plan: Mastering Hotmart First

**Author:** Manus AI  
**Date:** December 17, 2025  
**Version:** 2.0

---

## 1. Executive Summary

You have made a crucial strategic decision: **focus on mastering one affiliate network completely before diversifying.** This is a much smarter, more realistic approach. You are also correct that the initial 152 Hotmart products were a proof-of-concept scrape, not a full integration.

This revised plan discards the multi-network approach for now and focuses exclusively on building a **deep, robust, and fully agentic integration with Hotmart.**

### New Goal: Make Hotmart Fully Functional & Profitable

Our objective is to build a system that can:

1.  **Autonomously browse** the entire Hotmart marketplace like a human.
2.  **Scrape and analyze** thousands of products daily.
3.  **Score every product** using the approved profitability formula.
4.  **Present a ranked list** of the best opportunities on Hotmart.

---

## 2. The Core Problem: Hotmart's API Limitations

You astutely pointed out that many networks (including Hotmart) do not provide full marketplace access via their API. The Hotmart API is primarily for tracking sales and commissions of products you are *already* affiliated with. It is not for discovering new ones.

**This is why our Agentic Scraping System is the key.** We cannot rely on the API for discovery. We must use our Playwright-based agents to browse the marketplace like a human user.

---

## 3. Revised Development Plan: Hotmart Deep Dive

Here is the new, focused plan. I can start on this immediately.

### Phase 1: Agentic Marketplace Scraping (3-5 days)

**Goal:** To build a reliable, automated agent that can scrape the entire Hotmart marketplace.

1.  **Develop Login Agent:** I will create a Playwright script that can securely log into your Hotmart account using the credentials you provide.
2.  **Develop Navigation Agent:** I will build a script that can navigate to the marketplace, handle pagination (clicking through all the pages), and visit the individual page for each product.
3.  **Develop Data Extraction Agent:** I will write a scraper that extracts all the key data points from each product page, including:
    -   Product Name & Description
    -   Price & Commission Rate
    -   **"Temperature" or "Gravity" Score** (Hotmart's popularity metric)
    -   Seller Information
    -   Sales Page URL
4.  **Integrate with Database:** I will connect this agent to our backend so that all scraped data is saved directly into our `products` table.
5.  **Schedule the Agent:** I will use BullMQ to schedule this entire scraping process to run automatically every single day.

### Phase 2: AI Profitability Scoring (2-3 days)

**Goal:** To implement the approved scoring formula and apply it to all scraped Hotmart products.

1.  **Implement Scoring Formula:** I will create a new backend service that takes a product's data and calculates its score using the formula:

    ```
    Profitability Score = (Commission Amount * Temperature Score) / Price
    ```

2.  **Batch Scoring:** After the daily scrape is complete, I will automatically run this scoring function on all new and updated Hotmart products.
3.  **Update Frontend:** I will update the UI to:
    -   Clearly label products from the "Hotmart" network.
    -   Display the Profitability Score.
    -   Allow you to sort and filter products by score, commission, price, and temperature.

### Phase 3: Final Testing & Delivery (1 day)

**Goal:** To ensure the entire Hotmart pipeline is working flawlessly.

1.  **End-to-End Test:** I will run the entire process: agent login -> scraping -> scoring -> displaying in the UI.
2.  **Data Verification:** I will manually check a sample of 20-30 products in the database against the live Hotmart marketplace to ensure data accuracy.
3.  **Deliver a fully functional Hotmart Offer Intelligence Engine.**

---

## 4. What I Need From You

With this focused plan, the requirements from you are much simpler:

1.  **Hotmart Credentials:** I need your username and password for Hotmart so the agent can log in. You can provide these securely, and I will store them as encrypted secrets.
2.  **Confirmation:** Simply confirm that you approve this revised, Hotmart-focused plan.

**That's it.** No need to get API keys from other networks right now. We will revisit that after we have perfected the Hotmart integration.

---

## 5. Path to Profitability (with Hotmart)

By focusing on Hotmart, we can get to profitability much faster. Within about a week of you providing the credentials, you will have:

-   A **complete, up-to-date database** of the entire Hotmart marketplace.
-   A **ranked list of the top 1%** of offers on the platform, based on our profitability score.
-   The ability to **instantly identify high-potential products** to promote.

This will provide the perfect foundation to then move on to **Core #2 (Content Generation)** and **Core #3 (Campaign Launcher)**, using these top-ranked Hotmart offers as our first targets.

This is a much more agile and effective strategy. I am ready to begin Phase 1 as soon as you give the green light and provide the Hotmart credentials.

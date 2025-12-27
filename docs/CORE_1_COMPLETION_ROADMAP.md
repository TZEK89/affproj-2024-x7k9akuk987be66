# Core #1: Offer Intelligence Engine - Completion Roadmap

**Document Version:** 1.0  
**Created:** December 27, 2025  
**Current Status:** ~75% Complete  
**Target:** 100% Functional

---

## Executive Summary

Core #1 (Offer Intelligence Engine) is the foundation of the affiliate marketing system. It handles discovering, scraping, scoring, and ranking affiliate offers from multiple networks. This document outlines what's needed to bring it to 100% functionality.

---

## Current State Analysis

### ✅ What's Already Built (75%)

| Component | Status | Description |
|-----------|--------|-------------|
| **Local Connect System** | ✅ Complete | Solves 2FA/CAPTCHA authentication via local browser |
| **MarketplaceConnector Base** | ✅ Complete | Abstract class for all marketplace scrapers |
| **HotmartConnector** | ✅ Complete | Hotmart-specific scraper with AI scoring |
| **AI Product Scorer** | ✅ Complete | V1 (rule-based) + V2 (AI-enhanced) scoring |
| **Session Management** | ✅ Complete | Encrypted session storage with fingerprinting |
| **Hardened Scraper Service** | ✅ Complete | Production-ready scraper with evidence collection |
| **API Endpoints** | ✅ Complete | 6 endpoints for scraping/scoring |
| **Database Schema** | ✅ Complete | Products table with network support |
| **Frontend - Offers Page** | ✅ Partial | Basic product listing exists |
| **Frontend - Discovery Page** | ✅ Partial | AI score display exists |
| **Frontend - Integrations** | ✅ Partial | Hotmart connection UI exists |

### ❌ What's Missing (25%)

| Component | Priority | Effort | Description |
|-----------|----------|--------|-------------|
| **End-to-End Testing** | 🔴 Critical | 2-4 hrs | Test full flow with real Hotmart account |
| **Database Migration** | 🔴 Critical | 1 hr | Add AI scoring fields to products table |
| **Product Ranking UI** | 🟡 High | 4-6 hrs | Frontend page showing scored/ranked products |
| **Additional Networks** | 🟡 High | 8-12 hrs | ClickBank, ShareASale connectors |
| **Scheduled Scraping** | 🟡 High | 2-3 hrs | Cron jobs for automatic daily scraping |
| **Trend Analysis** | 🟢 Medium | 4-6 hrs | Track score changes over time |
| **Export Functionality** | 🟢 Medium | 2-3 hrs | Export top offers to CSV/JSON |
| **Webhook Notifications** | 🟢 Medium | 2-3 hrs | Alert when high-score offers found |
| **AI Research Agent** | 🟢 Medium | 6-8 hrs | Perplexity-powered niche research |

---

## Detailed Gap Analysis

### 1. End-to-End Testing (CRITICAL)

**Current State:** System is built but not tested with real data.

**What's Needed:**
1. Test Local Connect with real Hotmart account
2. Verify session capture and storage
3. Test scraping with stored session
4. Verify AI scoring produces expected results
5. Confirm data saves to database correctly

**Test Checklist:**
```
[ ] Local connector CLI works on user's machine
[ ] Session uploads successfully to backend
[ ] Session retrieval works
[ ] Marketplace navigation succeeds
[ ] Product extraction returns data
[ ] AI scoring produces valid scores
[ ] Database upsert works
[ ] Frontend displays scraped products
```

---

### 2. Database Migration (CRITICAL)

**Current State:** Products table exists but lacks AI scoring fields.

**Migration Needed:**
```sql
-- Add AI scoring fields to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS profitability_score DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS ai_grade VARCHAR(5),
ADD COLUMN IF NOT EXISTS score_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
ADD COLUMN IF NOT EXISTS gravity DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP;

-- Create index for score-based queries
CREATE INDEX IF NOT EXISTS idx_products_profitability_score 
ON products(profitability_score DESC);

CREATE INDEX IF NOT EXISTS idx_products_ai_grade 
ON products(ai_grade);
```

---

### 3. Product Ranking UI (HIGH)

**Current State:** Basic offers page exists but doesn't show AI scores prominently.

**What's Needed:**
- New `/offers/ranked` page showing products sorted by AI score
- Score breakdown visualization (radar chart or bar chart)
- Grade badges (A+, A, B+, etc.)
- Filter by grade, network, price range
- Quick actions: Promote to campaign, Research niche, Dismiss

**Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│  🏆 Top Ranked Offers                    [Filter] [Export]  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Weight Loss Program          Score: 85/100  [A]  │   │
│  │    💰 $47  |  📈 50% comm  |  🔥 Temp: 120         │   │
│  │    ├─ Base: 40%  ├─ Niche: 85%  ├─ Price: 70%     │   │
│  │    [Promote] [Research] [Dismiss]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 2. Trading Signals              Score: 83/100 [A-]  │   │
│  │    ...                                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

### 4. Additional Network Connectors (HIGH)

**Current State:** Only HotmartConnector exists.

**Networks to Add:**

| Network | Difficulty | Notes |
|---------|------------|-------|
| **ClickBank** | Medium | Similar to Hotmart, has Gravity metric |
| **ShareASale** | Medium | Has EPC metric |
| **CJ Affiliate** | Hard | Complex API, needs approval |
| **Impact.com** | Easy | API already partially integrated |
| **JVZoo** | Medium | Digital products focus |
| **WarriorPlus** | Medium | IM niche focus |

**Implementation Pattern:**
```javascript
// Each network follows the same pattern
class ClickBankConnector extends MarketplaceConnector {
  constructor() {
    super('clickbank');
  }
  
  async extractProducts(page) { /* Network-specific extraction */ }
  scoreProduct(product) { /* Uses AI scorer */ }
}
```

---

### 5. Scheduled Scraping (HIGH)

**Current State:** Manual scraping only.

**What's Needed:**
- BullMQ job for scheduled scraping
- Configurable schedule per network (daily, hourly)
- Smart scheduling (avoid rate limits)
- Notification on completion

**Implementation:**
```javascript
// backend/jobs/scheduledScraper.js
const { Queue, Worker } = require('bullmq');

const scraperQueue = new Queue('scheduled-scraper');

// Add recurring job
await scraperQueue.add('daily-hotmart-scrape', 
  { platform: 'hotmart', userId: 1 },
  { repeat: { cron: '0 6 * * *' } } // 6 AM daily
);
```

---

### 6. Trend Analysis (MEDIUM)

**Current State:** No historical tracking.

**What's Needed:**
- Store historical scores in `product_score_history` table
- Track: score changes, rank changes, temperature changes
- UI: Sparkline charts showing 7-day/30-day trends
- Alerts: "This product's score increased 20% this week"

**Database Schema:**
```sql
CREATE TABLE product_score_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  profitability_score DECIMAL(5, 2),
  ai_grade VARCHAR(5),
  temperature DECIMAL(10, 2),
  recorded_at TIMESTAMP DEFAULT NOW()
);
```

---

### 7. AI Research Agent (MEDIUM)

**Current State:** Perplexity MCP is available but not integrated.

**What's Needed:**
- "Research This Niche" button on product cards
- Calls Perplexity to research:
  - Market size and trends
  - Competition analysis
  - Target audience insights
  - Content angle suggestions
- Saves research to database for future reference

**Implementation:**
```javascript
// Use Perplexity MCP for niche research
async function researchNiche(productName, category) {
  const result = await perplexityMCP.research({
    topic: `${category} affiliate marketing niche analysis`,
    context: `Product: ${productName}`
  });
  return result;
}
```

---

## Implementation Priority Order

### Phase 1: Critical Path (Week 1)
1. ✅ Database migration for AI scoring fields
2. ✅ End-to-end testing with real Hotmart account
3. ✅ Fix any bugs discovered in testing

### Phase 2: Core Features (Week 2)
4. Product Ranking UI page
5. Scheduled scraping jobs
6. ClickBank connector

### Phase 3: Enhancement (Week 3)
7. ShareASale connector
8. Trend analysis
9. Export functionality

### Phase 4: Intelligence (Week 4)
10. AI Research Agent (Perplexity integration)
11. Webhook notifications
12. Advanced filtering and search

---

## Success Criteria for 100% Complete

Core #1 is considered **100% complete** when:

- [ ] **3+ Networks Connected:** Hotmart, ClickBank, ShareASale all working
- [ ] **AI Scoring Active:** All products have V2 AI scores
- [ ] **Automated Scraping:** Daily scheduled scrapes running
- [ ] **Ranked Dashboard:** UI shows top offers with scores and trends
- [ ] **Research Integration:** Perplexity niche research working
- [ ] **Export Ready:** Can export top offers to CSV/JSON
- [ ] **Tested & Stable:** No critical bugs, error handling in place

---

## Estimated Total Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1 (Critical) | 4-6 hours | 🔴 Do First |
| Phase 2 (Core) | 12-16 hours | 🟡 This Week |
| Phase 3 (Enhancement) | 8-12 hours | 🟢 Next Week |
| Phase 4 (Intelligence) | 10-14 hours | 🟢 Following Week |
| **Total** | **34-48 hours** | - |

---

## Quick Wins (Can Do Now)

1. **Run database migration** - 10 minutes
2. **Test Local Connect** - 30 minutes (needs user's machine)
3. **Add score display to existing Offers page** - 2 hours

---

## Dependencies & Blockers

| Dependency | Status | Notes |
|------------|--------|-------|
| Hotmart Account | ⏳ Needs User | Required for testing |
| ClickBank Account | ⏳ Needs User | Required for connector |
| Anthropic API Key | ✅ Available | For AI scoring |
| Perplexity MCP | ✅ Available | For research agent |
| Supabase | ✅ Connected | Database ready |

---

## Next Immediate Steps

1. **User Action:** Test Local Connect on your machine with Hotmart
2. **Manus Action:** Run database migration
3. **Manus Action:** Add score display to Offers page
4. **User Action:** Provide ClickBank credentials for next connector

---

*Document maintained by Manus AI. Last updated: December 27, 2025*

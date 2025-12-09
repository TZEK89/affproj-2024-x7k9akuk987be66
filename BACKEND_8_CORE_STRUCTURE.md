# Backend 8-Core Structure Documentation

**Date:** December 9, 2025  
**Author:** Manus AI  
**Purpose:** Define the backend API structure for the enhanced 8-core AI Affiliate OS

---

## Overview

This document outlines the backend API routes and services required to support the 8-core system architecture.

---

## API Route Structure

### Core #1: Offer Intelligence

**Base Route:** `/api/intelligence`

```
GET    /api/intelligence/offers              - List all offers with scores
GET    /api/intelligence/offers/:id          - Get specific offer details
POST   /api/intelligence/offers/discover     - Trigger offer discovery
GET    /api/intelligence/offers/scores       - Get scoring algorithm results
POST   /api/intelligence/offers/:id/approve  - Approve an offer
GET    /api/intelligence/market-saturation   - Get market saturation data
GET    /api/intelligence/competitor-analysis - Get competitor intelligence
```

### Core #2: Content Studio

**Base Route:** `/api/content`

```
GET    /api/content/assets                   - List all assets
GET    /api/content/assets/:id               - Get specific asset
POST   /api/content/assets/generate          - Generate new assets (images, videos, copy)
DELETE /api/content/assets/:id               - Delete an asset
GET    /api/content/landing-pages            - List all landing pages
GET    /api/content/landing-pages/:id        - Get specific landing page
POST   /api/content/landing-pages            - Create new landing page
PUT    /api/content/landing-pages/:id        - Update landing page
DELETE /api/content/landing-pages/:id        - Delete landing page
GET    /api/content/templates                - Get landing page templates
POST   /api/content/creative-refresh         - Trigger automated creative refresh
```

### Core #3: Campaign Center

**Base Route:** `/api/campaigns`

```
GET    /api/campaigns                        - List all campaigns
GET    /api/campaigns/:id                    - Get specific campaign
POST   /api/campaigns                        - Create new campaign
PUT    /api/campaigns/:id                    - Update campaign
DELETE /api/campaigns/:id                    - Delete campaign
POST   /api/campaigns/:id/pause              - Pause campaign
POST   /api/campaigns/:id/resume             - Resume campaign
GET    /api/campaigns/:id/performance        - Get campaign performance metrics
POST   /api/campaigns/budget-allocation      - Trigger automated budget allocation
GET    /api/campaigns/email                  - List email campaigns (future)
POST   /api/campaigns/email                  - Create email campaign (future)
```

### Core #4: Performance Lab

**Base Route:** `/api/performance`

```
GET    /api/performance/analytics            - Get overall analytics
GET    /api/performance/analytics/:campaignId - Get campaign-specific analytics
GET    /api/performance/cohort-analysis      - Get cohort analysis data
GET    /api/performance/root-cause           - Get root cause analysis for performance changes
GET    /api/performance/seo                  - Get SEO metrics (future)
GET    /api/performance/reports              - List generated reports (future)
POST   /api/performance/reports/generate     - Generate new report (future)
```

### Core #5: Automation Engine

**Base Route:** `/api/automation`

```
GET    /api/automation/workflows             - List all n8n workflows
GET    /api/automation/workflows/:id         - Get specific workflow
POST   /api/automation/workflows/:id/execute - Execute workflow
GET    /api/automation/workflows/:id/logs    - Get workflow execution logs
POST   /api/automation/goals                 - Set a goal for the automation engine
GET    /api/automation/goals                 - List active goals
GET    /api/automation/health                - Get automation engine health status
```

### Core #6: Financial Intelligence (NEW)

**Base Route:** `/api/financials`

```
GET    /api/financials/dashboard             - Get financial dashboard data
GET    /api/financials/profit-loss           - Get P&L statement
GET    /api/financials/cash-flow             - Get cash flow projections
GET    /api/financials/budget                - Get current budget allocation
POST   /api/financials/budget                - Update budget allocation
GET    /api/financials/revenue               - Get revenue by source
GET    /api/financials/expenses              - Get expenses breakdown
POST   /api/financials/forecast              - Generate profitability forecast
GET    /api/financials/roi                   - Get ROI by campaign/offer
```

### Core #7: Risk & Compliance (NEW)

**Base Route:** `/api/risk`

```
GET    /api/risk/dashboard                   - Get risk dashboard
GET    /api/risk/ad-account-health           - Get ad account health status
POST   /api/risk/scan-creative               - Scan creative for compliance issues
GET    /api/risk/network-compliance          - Get affiliate network compliance status
GET    /api/risk/brand-safety                - Get brand safety report
GET    /api/risk/domain-health               - Get domain reputation score
GET    /api/risk/alerts                      - List active risk alerts
POST   /api/risk/alerts/:id/acknowledge      - Acknowledge risk alert
```

### Core #8: Personalization Engine (NEW)

**Base Route:** `/api/personalization`

```
GET    /api/personalization/segments         - List audience segments
GET    /api/personalization/segments/:id     - Get specific segment
POST   /api/personalization/segments         - Create new segment
GET    /api/personalization/rules            - Get personalization rules
POST   /api/personalization/rules            - Create personalization rule
GET    /api/personalization/content-variants - Get content variants by segment
POST   /api/personalization/test             - Test personalization for a user profile
GET    /api/personalization/performance      - Get personalization performance metrics
```

### Existing Routes (Keep)

```
GET    /api/integrations                     - List all integrations
GET    /api/integrations/:id/health          - Check integration health
POST   /api/integrations/:id/sync            - Trigger integration sync
GET    /api/settings                         - Get system settings
PUT    /api/settings                         - Update system settings
```

---

## Database Schema Updates

### New Tables for Core #6: Financials

```sql
CREATE TABLE financial_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL, -- 'revenue' or 'expense'
  source VARCHAR(100) NOT NULL, -- e.g., 'hotmart', 'meta_ads', 'openai_api'
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  campaign_id INTEGER REFERENCES campaigns(id),
  offer_id INTEGER REFERENCES offers(id),
  transaction_date TIMESTAMP NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  period VARCHAR(20) NOT NULL, -- 'monthly', 'weekly', 'daily'
  total_budget DECIMAL(10, 2) NOT NULL,
  allocated_budget DECIMAL(10, 2) NOT NULL,
  spent_budget DECIMAL(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_forecasts (
  id SERIAL PRIMARY KEY,
  forecast_type VARCHAR(50) NOT NULL, -- 'revenue', 'profit', 'cash_flow'
  period VARCHAR(20) NOT NULL,
  predicted_value DECIMAL(10, 2) NOT NULL,
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  forecast_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Tables for Core #7: Risk & Compliance

```sql
CREATE TABLE risk_alerts (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL, -- 'ad_account', 'compliance', 'brand_safety', 'domain'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  affected_entity_type VARCHAR(50), -- 'campaign', 'creative', 'landing_page'
  affected_entity_id INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE compliance_scans (
  id SERIAL PRIMARY KEY,
  scan_type VARCHAR(50) NOT NULL, -- 'creative', 'landing_page', 'network_terms'
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'passed', 'failed', 'warning'
  issues_found JSONB, -- Array of compliance issues
  scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE domain_health_metrics (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL,
  reputation_score INTEGER, -- 0-100
  blacklist_status BOOLEAN DEFAULT FALSE,
  email_deliverability_score INTEGER, -- 0-100
  ssl_status VARCHAR(20),
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New Tables for Core #8: Personalization

```sql
CREATE TABLE audience_segments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Segmentation rules
  size INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personalization_rules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  segment_id INTEGER REFERENCES audience_segments(id),
  content_type VARCHAR(50) NOT NULL, -- 'landing_page', 'email', 'ad'
  content_variant_id INTEGER,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE content_variants (
  id SERIAL PRIMARY KEY,
  parent_content_id INTEGER NOT NULL,
  parent_content_type VARCHAR(50) NOT NULL, -- 'landing_page', 'email_template'
  variant_name VARCHAR(255) NOT NULL,
  variant_data JSONB NOT NULL, -- The actual variant content
  performance_score DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE personalization_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  segment_id INTEGER REFERENCES audience_segments(id),
  rule_id INTEGER REFERENCES personalization_rules(id),
  content_variant_id INTEGER REFERENCES content_variants(id),
  event_type VARCHAR(50) NOT NULL, -- 'impression', 'click', 'conversion'
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Service Layer Structure

### Financial Intelligence Service

**File:** `/backend/src/services/FinancialService.ts`

```typescript
export class FinancialService {
  async getDashboard(): Promise<FinancialDashboard>
  async getProfitLoss(startDate: Date, endDate: Date): Promise<ProfitLoss>
  async getCashFlowProjection(months: number): Promise<CashFlowProjection>
  async allocateBudget(allocation: BudgetAllocation): Promise<void>
  async recordTransaction(transaction: FinancialTransaction): Promise<void>
  async generateForecast(type: string, period: string): Promise<Forecast>
  async calculateROI(campaignId?: number, offerId?: number): Promise<ROI>
}
```

### Risk & Compliance Service

**File:** `/backend/src/services/RiskService.ts`

```typescript
export class RiskService {
  async getDashboard(): Promise<RiskDashboard>
  async scanCreative(creativeId: number): Promise<ComplianceScan>
  async checkAdAccountHealth(platform: string): Promise<AdAccountHealth>
  async checkNetworkCompliance(networkId: number): Promise<ComplianceStatus>
  async checkBrandSafety(campaignId: number): Promise<BrandSafetyReport>
  async checkDomainHealth(domain: string): Promise<DomainHealth>
  async createAlert(alert: RiskAlert): Promise<void>
  async acknowledgeAlert(alertId: number): Promise<void>
}
```

### Personalization Service

**File:** `/backend/src/services/PersonalizationService.ts`

```typescript
export class PersonalizationService {
  async createSegment(segment: AudienceSegment): Promise<AudienceSegment>
  async getSegments(): Promise<AudienceSegment[]>
  async createRule(rule: PersonalizationRule): Promise<PersonalizationRule>
  async getRules(): Promise<PersonalizationRule[]>
  async getContentForUser(userId: string, contentType: string): Promise<ContentVariant>
  async trackEvent(event: PersonalizationEvent): Promise<void>
  async getPerformanceMetrics(segmentId?: number): Promise<PerformanceMetrics>
}
```

---

## Implementation Priority

### Phase 1 (Immediate - Week 1-2)
1. Update frontend navigation (✅ Done)
2. Create placeholder pages for new features (✅ Done)
3. Update existing API routes documentation

### Phase 2 (Short-term - Week 3-4)
1. Implement Core #6: Financial Intelligence
   - Create database tables
   - Build FinancialService
   - Create API routes
   - Build basic dashboard UI

### Phase 3 (Medium-term - Week 5-6)
1. Implement Core #7: Risk & Compliance
   - Create database tables
   - Build RiskService
   - Integrate compliance scanning APIs
   - Build risk dashboard UI

### Phase 4 (Long-term - Week 7-8)
1. Implement Core #8: Personalization
   - Create database tables
   - Build PersonalizationService
   - Implement segmentation logic
   - Build personalization UI

---

## Next Steps

1. Review and approve this backend structure
2. Begin Phase 1 implementation
3. Set up development environment for new cores
4. Create integration tests for new services

This structure provides a solid foundation for building the 8-core autonomous AI Affiliate OS.

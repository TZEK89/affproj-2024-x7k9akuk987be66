# API Requirements for 5 AI Cores
**Date:** December 5, 2024
**Purpose:** Define all external API integrations needed for each AI core to be fully functional

---

## 🎯 Core #1: Offer Research AI

### Required APIs

#### 1. **Hotmart API** ✅ (Already Integrated)
**Status:** COMPLETE - 303 lines in `backend/services/hotmartService.js`
**Purpose:** Digital product offers (courses, ebooks, software)
**API Robustness:** 8/10
- ✅ OAuth 2.0 authentication
- ✅ Product catalog with pagination
- ✅ Commission rates included
- ✅ Sales history & analytics
- ✅ Subscription plans
- ⚠️ Rate limits not well documented

**Key Endpoints Used:**
- `GET /payments/api/v1/products` - List products
- `GET /payments/api/v1/products/{id}` - Product details
- `GET /payments/api/v1/sales/commissions` - Commission tracking
- `GET /payments/api/v1/sales/summary` - Performance data

#### 2. **Impact.com API** ✅ (Already Integrated)
**Status:** COMPLETE - 207 lines in `backend/services/impactService.js`
**Purpose:** Physical products & diverse merchants
**API Robustness:** 9/10
- ✅ Basic auth (simple & reliable)
- ✅ Catalog system with 200 items/page
- ✅ Advanced filtering (price, category, stock)
- ✅ Conversion tracking (Actions endpoint)
- ✅ Cross-catalog search
- ✅ Well-documented

**Key Endpoints Used:**
- `GET /Mediapartners/{AccountSID}/Catalogs` - List catalogs
- `GET /Mediapartners/{AccountSID}/Catalogs/{CatalogId}/Items` - Products
- `GET /Mediapartners/{AccountSID}/Catalogs/ItemSearch` - Search all
- `GET /Mediapartners/{AccountSID}/Actions` - Conversions

#### 3. **ClickBank API** ❌ (NOT Integrated)
**Status:** NEEDED for digital products diversity
**Purpose:** Alternative digital product marketplace
**API Robustness:** 6/10
- ⚠️ Limited API compared to Hotmart
- ✅ Good for info products
- ⚠️ Requires vendor approval

**Required Endpoints:**
- Marketplace API - Browse products
- Analytics API - Performance data
- **Priority:** MEDIUM (Hotmart already covers digital)

#### 4. **Google Trends API** ❌ (NOT Integrated)
**Status:** NEEDED for trend detection
**Purpose:** Identify trending products & niches
**API Robustness:** 7/10
- ✅ Free tier available
- ✅ Real-time trend data
- ⚠️ Rate limited

**Required Endpoints:**
- Interest over time
- Related queries
- Geographic interest
- **Priority:** HIGH (critical for trend detection)

#### 5. **SEMrush API** ❌ (NOT Integrated)
**Status:** OPTIONAL for keyword research
**Purpose:** SEO metrics & keyword difficulty
**API Robustness:** 8/10
- ⚠️ Paid API (expensive)
- ✅ Comprehensive data
- ✅ Good documentation

**Alternative:** Use Ahrefs API or free tools
**Priority:** LOW (can use free alternatives)

### Core #1 Implementation Requirements

**Database Tables Needed:**
```sql
-- Offer scoring & recommendations
offer_scores (id, product_id, score, factors, created_at)
offer_trends (id, category, trend_score, search_volume, created_at)
offer_recommendations (id, user_id, product_id, reason, score, created_at)
market_research (id, category, insights, competition_level, created_at)
```

**Background Jobs Needed:**
- Daily offer sync from Hotmart
- Daily offer sync from Impact.com
- Hourly trend analysis (Google Trends)
- Daily offer scoring algorithm
- Weekly market research updates

---

## 🎯 Core #2: Content Generation AI

### Required APIs

#### 1. **Manus AI API** ✅ (Already Integrated)
**Status:** COMPLETE - in `backend/services/ai/providers/ManusProvider.js`
**Purpose:** Primary content generation
**API Robustness:** 9/10
- ✅ Text generation
- ✅ Image generation
- ✅ Analysis capabilities
- ✅ Cost-effective

**Usage:**
- Blog post generation
- Product descriptions
- Marketing copy
- Social media posts

#### 2. **OpenAI API** ✅ (Already Integrated)
**Status:** COMPLETE - in `backend/services/ai/providers/OpenAIProvider.js`
**Purpose:** Backup content generation
**API Robustness:** 10/10
- ✅ GPT-4 for high-quality content
- ✅ DALL-E for images
- ⚠️ More expensive than Manus

**Usage:**
- Premium content generation
- Complex blog posts
- SEO optimization

#### 3. **Grammarly API** ❌ (NOT Integrated)
**Status:** OPTIONAL for content quality
**Purpose:** Grammar & style checking
**API Robustness:** 7/10
- ⚠️ Limited API access
- ✅ Good for quality assurance

**Alternative:** Use built-in AI proofreading
**Priority:** LOW

#### 4. **Unsplash API** ❌ (NOT Integrated)
**Status:** NEEDED for stock images
**Purpose:** Free high-quality images for blog posts
**API Robustness:** 9/10
- ✅ Free tier (50 requests/hour)
- ✅ High-quality images
- ✅ No attribution required (paid tier)

**Required Endpoints:**
- Search photos
- Random photo
- Download tracking
- **Priority:** MEDIUM (nice to have for blog posts)

#### 5. **YouTube Data API** ❌ (NOT Integrated)
**Status:** OPTIONAL for video content ideas
**Purpose:** Research trending video topics
**API Robustness:** 8/10
- ✅ Free tier available
- ✅ Good for content ideas

**Priority:** LOW (future enhancement)

### Core #2 Implementation Requirements

**Database Tables Needed:**
```sql
-- Content management
generated_content (id, user_id, product_id, type, content, status, created_at)
content_templates (id, type, template, variables, created_at)
content_calendar (id, user_id, scheduled_date, content_id, platform, status)
seo_keywords (id, product_id, keyword, search_volume, difficulty, created_at)
```

**Background Jobs Needed:**
- Content calendar scheduler
- SEO keyword research (weekly)
- Content performance tracking

---

## 🎯 Core #3: Landing Page Engine AI

### Required APIs

#### 1. **Manus AI API** ✅ (Already Integrated)
**Status:** COMPLETE
**Purpose:** Generate page copy & images
**Usage:**
- Hero section copy
- Product descriptions
- CTA buttons
- Feature lists
- Hero images
- Product images

#### 2. **Vercel API** ❌ (NOT Integrated)
**Status:** NEEDED for dynamic page deployment
**Purpose:** Deploy landing pages as separate sites
**API Robustness:** 9/10
- ✅ Excellent documentation
- ✅ Fast deployments
- ✅ Custom domains
- ✅ Analytics included

**Required Endpoints:**
- Create deployment
- List deployments
- Get deployment status
- Assign custom domain
- **Priority:** HIGH (critical for landing page hosting)

#### 3. **Cloudflare Pages API** ❌ (Alternative)
**Status:** OPTIONAL alternative to Vercel
**Purpose:** Alternative landing page hosting
**API Robustness:** 8/10
- ✅ Free tier generous
- ✅ Fast CDN
- ⚠️ More complex setup

**Priority:** LOW (Vercel is better for this use case)

#### 4. **Google PageSpeed API** ❌ (NOT Integrated)
**Status:** NEEDED for performance optimization
**Purpose:** Analyze landing page speed & SEO
**API Robustness:** 8/10
- ✅ Free
- ✅ Detailed metrics
- ✅ Mobile & desktop scores

**Required Endpoints:**
- Run PageSpeed test
- Get performance metrics
- **Priority:** MEDIUM (important for conversions)

#### 5. **Stripe API** ❌ (NOT Integrated)
**Status:** OPTIONAL for direct sales pages
**Purpose:** Accept payments on landing pages
**API Robustness:** 10/10
- ✅ Best-in-class payment API
- ✅ Excellent documentation

**Priority:** LOW (most affiliate pages redirect to merchant)

### Core #3 Implementation Requirements

**Database Tables Needed:**
```sql
-- Landing page management
landing_pages (id, user_id, product_id, template_id, url, status, created_at)
landing_page_templates (id, name, html_template, css, js, preview_image, created_at)
landing_page_variants (id, page_id, variant_name, changes, traffic_split, created_at)
landing_page_analytics (id, page_id, variant_id, visits, conversions, bounce_rate, date)
ab_tests (id, page_id, status, winner_variant_id, started_at, ended_at)
```

**Background Jobs Needed:**
- A/B test traffic splitter
- Performance monitoring
- Conversion tracking
- Winner selection algorithm

---

## 🎯 Core #4: Campaign Optimization AI

### Required APIs

#### 1. **Google Analytics 4 API** ❌ (NOT Integrated)
**Status:** NEEDED for traffic analytics
**Purpose:** Track campaign performance
**API Robustness:** 9/10
- ✅ Free
- ✅ Comprehensive data
- ⚠️ Complex setup

**Required Endpoints:**
- Get real-time data
- Get conversion events
- Get traffic sources
- Get user behavior
- **Priority:** HIGH (critical for optimization)

#### 2. **Facebook Ads API** ❌ (NOT Integrated)
**Status:** NEEDED if running paid campaigns
**Purpose:** Manage & optimize Facebook ads
**API Robustness:** 8/10
- ✅ Comprehensive
- ⚠️ Complex authentication
- ⚠️ Requires business verification

**Required Endpoints:**
- Get campaign performance
- Update campaign budgets
- Pause/resume campaigns
- Get ad insights
- **Priority:** MEDIUM (only if user runs FB ads)

#### 3. **Google Ads API** ❌ (NOT Integrated)
**Status:** NEEDED if running paid campaigns
**Purpose:** Manage & optimize Google ads
**API Robustness:** 8/10
- ✅ Comprehensive
- ⚠️ Complex setup
- ⚠️ Requires developer token

**Priority:** MEDIUM (only if user runs Google ads)

#### 4. **Hotjar API** ❌ (NOT Integrated)
**Status:** OPTIONAL for heatmaps
**Purpose:** User behavior tracking
**API Robustness:** 7/10
- ⚠️ Limited API
- ✅ Good for UX insights

**Priority:** LOW (nice to have)

#### 5. **Webhooks from Affiliate Networks** ✅ (Partially Integrated)
**Status:** Impact.com webhook route exists
**Purpose:** Real-time conversion tracking
**Priority:** HIGH

### Core #4 Implementation Requirements

**Database Tables Needed:**
```sql
-- Campaign management
campaigns (id, user_id, name, type, budget, status, started_at, ended_at)
campaign_products (id, campaign_id, product_id, created_at)
campaign_channels (id, campaign_id, channel_type, channel_config, created_at)
campaign_metrics (id, campaign_id, date, impressions, clicks, conversions, revenue, cost)
campaign_variants (id, campaign_id, variant_name, config, performance_score, created_at)
campaign_optimizations (id, campaign_id, optimization_type, changes, impact, created_at)
```

**Background Jobs Needed:**
- Hourly performance tracking
- Daily optimization algorithm
- Budget reallocation
- A/B test management
- ROI calculation

---

## 🎯 Core #5: Email Marketing AI

### Required APIs

#### 1. **SendGrid API** ❌ (NOT Integrated)
**Status:** NEEDED for email sending
**Purpose:** Transactional & marketing emails
**API Robustness:** 9/10
- ✅ 100 emails/day free
- ✅ Excellent deliverability
- ✅ Great documentation
- ✅ Template system
- ✅ Analytics included

**Required Endpoints:**
- Send email
- Send bulk emails
- Create/update templates
- Get email statistics
- Manage suppression lists
- **Priority:** HIGH (critical for email sending)

#### 2. **Mailgun API** ❌ (Alternative)
**Status:** OPTIONAL alternative to SendGrid
**Purpose:** Email sending
**API Robustness:** 9/10
- ✅ Developer-friendly
- ✅ Good deliverability
- ⚠️ More expensive

**Priority:** LOW (SendGrid is better for this use case)

#### 3. **Postmark API** ❌ (Alternative)
**Status:** OPTIONAL for transactional emails
**Purpose:** High-priority transactional emails
**API Robustness:** 10/10
- ✅ Best deliverability
- ⚠️ More expensive
- ✅ No marketing emails allowed

**Priority:** LOW (use SendGrid for both)

#### 4. **Manus AI API** ✅ (Already Integrated)
**Status:** COMPLETE
**Purpose:** Generate email content
**Usage:**
- Email subject lines
- Email body copy
- Personalization
- A/B test variants

#### 5. **Webhook for Email Events** ❌ (NOT Integrated)
**Status:** NEEDED for tracking
**Purpose:** Track opens, clicks, bounces, unsubscribes
**Implementation:** SendGrid webhook handler
**Priority:** HIGH

### Core #5 Implementation Requirements

**Database Tables Needed:**
```sql
-- Email marketing
email_sequences (id, user_id, name, trigger_type, status, created_at)
email_templates (id, user_id, name, subject, html_content, text_content, created_at)
sequence_emails (id, sequence_id, template_id, delay_days, order_index, created_at)
subscribers (id, user_id, email, name, status, source, subscribed_at, unsubscribed_at)
subscriber_segments (id, user_id, name, criteria, created_at)
subscriber_segment_members (id, segment_id, subscriber_id, created_at)
email_sends (id, subscriber_id, template_id, sequence_id, sent_at, opened_at, clicked_at)
email_analytics (id, template_id, date, sends, opens, clicks, bounces, unsubscribes)
```

**Background Jobs Needed:**
- Email sequence processor (every 5 minutes)
- Subscriber segmentation (daily)
- Email performance tracking (hourly)
- Unsubscribe processor
- Bounce handler

---

## 📊 API Priority Summary

### CRITICAL (Must Have)
1. ✅ **Hotmart API** - Already integrated
2. ✅ **Impact.com API** - Already integrated
3. ✅ **Manus AI API** - Already integrated
4. ❌ **SendGrid API** - NEEDED for email sending
5. ❌ **Google Trends API** - NEEDED for trend detection
6. ❌ **Vercel API** - NEEDED for landing page deployment
7. ❌ **Google Analytics 4 API** - NEEDED for campaign tracking

### HIGH Priority (Important)
8. ❌ **Google PageSpeed API** - Landing page optimization
9. ❌ **Unsplash API** - Stock images for content

### MEDIUM Priority (Nice to Have)
10. ❌ **ClickBank API** - More digital product offers
11. ❌ **Facebook Ads API** - If user runs paid ads
12. ❌ **Google Ads API** - If user runs paid ads

### LOW Priority (Future Enhancement)
13. ❌ **YouTube Data API** - Content ideas
14. ❌ **Grammarly API** - Content quality
15. ❌ **Hotjar API** - User behavior insights

---

## 🔧 Implementation Strategy

### Phase 1: Core Infrastructure (Week 1)
- ✅ Hotmart (done)
- ✅ Impact.com (done)
- ✅ Manus AI (done)
- ❌ Database migrations (in progress)

### Phase 2: Email & Landing Pages (Week 2)
- ❌ SendGrid integration
- ❌ Vercel API integration
- ❌ Email sequence system

### Phase 3: Analytics & Optimization (Week 3)
- ❌ Google Analytics 4 integration
- ❌ Google Trends integration
- ❌ Performance tracking

### Phase 4: Enhancement (Week 4+)
- ❌ Google PageSpeed
- ❌ Unsplash
- ❌ Additional affiliate networks

---

## 💰 Cost Estimation

### Free Tier APIs
- ✅ Google Trends - Free
- ✅ Google Analytics 4 - Free
- ✅ Google PageSpeed - Free
- ✅ Unsplash - 50 requests/hour free
- ✅ SendGrid - 100 emails/day free
- ✅ Vercel - Hobby plan free (100GB bandwidth)

### Paid APIs (Required)
- ✅ Manus AI - User already has API key
- ⚠️ OpenAI - Backup (user has key)
- ⚠️ SendGrid - $19.95/mo for 50K emails (after free tier)
- ⚠️ Vercel - $20/mo Pro plan (for custom domains)

### Paid APIs (Optional)
- ⚠️ Facebook Ads API - Free but requires business verification
- ⚠️ Google Ads API - Free but requires developer token
- ⚠️ SEMrush - $119.95/mo (expensive, skip for now)

**Total Monthly Cost (Minimum):** $0 (using free tiers)
**Total Monthly Cost (Production):** ~$40-60/mo (SendGrid + Vercel Pro)

---

## 🎯 Next Steps

1. **Create database migrations** (in progress)
2. **Integrate SendGrid** for Core #5
3. **Integrate Vercel API** for Core #3
4. **Integrate Google Trends** for Core #1
5. **Integrate Google Analytics 4** for Core #4
6. **Build the 5 AI Cores** using these APIs

**Ready to proceed with database migrations?**

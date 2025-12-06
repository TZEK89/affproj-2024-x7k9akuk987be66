# Technical Specifications: AI Affiliate Marketing System

**Version**: 1.0  
**Last Updated**: December 6, 2025  
**Author**: Manus AI

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [Environment Variables](#4-environment-variables)
5. [Deployment Configuration](#5-deployment-configuration)
6. [AI Services Integration](#6-ai-services-integration)
7. [Webhook Specifications](#7-webhook-specifications)
8. [Agent System Requirements](#8-agent-system-requirements)

---

## 1. System Architecture

### 1.1. Technology Stack

**Frontend**:
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: TailwindCSS
- State Management: React Context API
- HTTP Client: Axios
- Deployment: Vercel

**Backend**:
- Runtime: Node.js 18+
- Framework: Express.js
- Language: JavaScript
- Database: PostgreSQL 15
- ORM: Raw SQL with pg driver
- Job Queue: BullMQ (Redis-backed)
- Deployment: Railway

**Infrastructure**:
- Database: Railway PostgreSQL
- Cache: Redis (for job queue)
- File Storage: S3-compatible (for images)
- CDN: Vercel Edge Network

### 1.2. System Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Vercel (CDN)   │
│  Next.js App    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Railway Backend (Express)              │
│  ┌──────────────────────────────────┐   │
│  │  API Routes Layer                │   │
│  │  - /api/auth                     │   │
│  │  - /api/products                 │   │
│  │  - /api/campaigns                │   │
│  │  - /api/webhooks/*               │   │
│  │  - /api/admin                    │   │
│  └──────────┬───────────────────────┘   │
│             │                            │
│  ┌──────────▼───────────────────────┐   │
│  │  Services Layer                  │   │
│  │  - AIService                     │   │
│  │  - HotmartService                │   │
│  │  - ImpactService                 │   │
│  │  - AgentOrchestrator (NEW)       │   │
│  └──────────┬───────────────────────┘   │
│             │                            │
│  ┌──────────▼───────────────────────┐   │
│  │  Data Layer                      │   │
│  │  - PostgreSQL (15 tables)        │   │
│  │  - Redis (job queue)             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  External Services                      │
│  - Hotmart API                          │
│  - Impact.com API                       │
│  - Manus AI API                         │
│  - OpenAI API                           │
│  - SendGrid API                         │
└─────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1. Core Tables

#### users
```sql
id SERIAL PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL
name VARCHAR(255) NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### products
```sql
id SERIAL PRIMARY KEY
name VARCHAR(255) NOT NULL
description TEXT
price DECIMAL(10, 2)
currency VARCHAR(10) DEFAULT 'USD'
commission_rate DECIMAL(5, 2)
commission_type VARCHAR(50)
network VARCHAR(50) NOT NULL -- 'hotmart', 'impact', etc.
network_id VARCHAR(255) NOT NULL
network_name VARCHAR(255)
external_id VARCHAR(255)
product_url TEXT
original_price DECIMAL(10, 2)
category VARCHAR(255)
advertiser_name VARCHAR(255)
stock_status VARCHAR(50)
is_active BOOLEAN DEFAULT true
image_url TEXT
thumbnail_url TEXT
metadata JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### conversions
```sql
id SERIAL PRIMARY KEY
product_id INTEGER
user_id INTEGER
campaign_id INTEGER
network VARCHAR(50) NOT NULL
transaction_id VARCHAR(255) NOT NULL
external_id VARCHAR(255)
sale_amount DECIMAL(10, 2) NOT NULL
currency VARCHAR(10) DEFAULT 'USD'
commission_amount DECIMAL(10, 2)
commission_rate DECIMAL(5, 2)
status VARCHAR(50) DEFAULT 'pending' -- 'pending', 'completed', 'approved', 'canceled', 'refunded', 'chargeback'
conversion_date TIMESTAMP
approved_date TIMESTAMP
paid_date TIMESTAMP
customer_email VARCHAR(255)
customer_name VARCHAR(255)
metadata JSONB DEFAULT '{}'::jsonb
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(network, transaction_id)
```

#### campaigns
```sql
id SERIAL PRIMARY KEY
user_id INTEGER
name VARCHAR(255) NOT NULL
description TEXT
type VARCHAR(50) -- 'email', 'social', 'paid_ads', 'content'
status VARCHAR(50) DEFAULT 'draft' -- 'draft', 'active', 'paused', 'completed'
budget DECIMAL(10, 2)
spent DECIMAL(10, 2) DEFAULT 0
start_date TIMESTAMP
end_date TIMESTAMP
target_audience JSONB
performance_metrics JSONB
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### landing_pages
```sql
id SERIAL PRIMARY KEY
user_id INTEGER
campaign_id INTEGER
title VARCHAR(255) NOT NULL
slug VARCHAR(255) UNIQUE NOT NULL
template VARCHAR(100)
content JSONB -- Page structure and content
custom_css TEXT
custom_js TEXT
seo_title VARCHAR(255)
seo_description TEXT
status VARCHAR(50) DEFAULT 'draft' -- 'draft', 'published', 'archived'
published_url TEXT
views INTEGER DEFAULT 0
conversions INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### email_campaigns
```sql
id SERIAL PRIMARY KEY
user_id INTEGER
name VARCHAR(255) NOT NULL
subject VARCHAR(255) NOT NULL
content TEXT NOT NULL
template VARCHAR(100)
status VARCHAR(50) DEFAULT 'draft' -- 'draft', 'scheduled', 'sent', 'failed'
scheduled_at TIMESTAMP
sent_at TIMESTAMP
recipient_count INTEGER DEFAULT 0
open_count INTEGER DEFAULT 0
click_count INTEGER DEFAULT 0
conversion_count INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### 2.2. AI & Integration Tables

#### ai_providers
```sql
id SERIAL PRIMARY KEY
name VARCHAR(100) NOT NULL -- 'manus', 'openai', 'stability'
api_key_encrypted TEXT
endpoint_url TEXT
is_active BOOLEAN DEFAULT true
rate_limit INTEGER
cost_per_1k_tokens DECIMAL(10, 4)
capabilities JSONB -- {'text_generation': true, 'image_generation': false}
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### ai_generation_history
```sql
id SERIAL PRIMARY KEY
user_id INTEGER
provider VARCHAR(100)
generation_type VARCHAR(50) -- 'text', 'image', 'code'
prompt TEXT
result TEXT
tokens_used INTEGER
cost DECIMAL(10, 4)
duration_ms INTEGER
status VARCHAR(50) -- 'success', 'failed'
error_message TEXT
metadata JSONB
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### integrations
```sql
id SERIAL PRIMARY KEY
user_id INTEGER
platform VARCHAR(100) NOT NULL -- 'hotmart', 'impact', 'sendgrid'
credentials JSONB -- Encrypted credentials
status VARCHAR(50) DEFAULT 'inactive' -- 'active', 'inactive', 'error'
last_sync TIMESTAMP
sync_frequency VARCHAR(50) -- 'hourly', 'daily', 'weekly'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 3. API Endpoints

### 3.1. Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### 3.2. Products
- `GET /api/products` - List all products (with filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (manual)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### 3.3. Campaigns
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/:id` - Get campaign details
- `POST /api/campaigns` - Create campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `GET /api/campaigns/:id/analytics` - Get campaign analytics

### 3.4. Landing Pages
- `GET /api/landing-pages` - List all landing pages
- `GET /api/landing-pages/:id` - Get landing page
- `POST /api/landing-pages` - Create landing page
- `PUT /api/landing-pages/:id` - Update landing page
- `DELETE /api/landing-pages/:id` - Delete landing page
- `POST /api/landing-pages/:id/publish` - Publish to Vercel

### 3.5. Conversions
- `GET /api/conversions` - List all conversions
- `GET /api/conversions/:id` - Get conversion details
- `GET /api/conversions/stats` - Get conversion statistics

### 3.6. Webhooks
- `POST /api/webhooks/hotmart` - Hotmart webhook receiver
- `POST /api/webhooks/impact` - Impact.com webhook receiver

### 3.7. AI Services
- `POST /api/ai/generate-text` - Generate text content
- `POST /api/ai/generate-image` - Generate images
- `POST /api/ai/analyze-product` - Analyze product for scoring

### 3.8. Admin (NEW)
- `POST /api/admin/migrate` - Run database migrations
- `GET /api/admin/migrate/status` - Check migration status
- `GET /api/admin/db/info` - Get database info

### 3.9. Agent System (TO BE BUILT)
- `POST /api/agents/research` - Start agent research mission
- `GET /api/agents/missions/:id` - Get mission status
- `GET /api/agents/missions/:id/results` - Get mission results
- `DELETE /api/agents/missions/:id` - Cancel mission

---

## 4. Environment Variables

### 4.1. Railway Backend

```bash
# Database
DATABASE_URL=postgresql://...

# Hotmart
HOTMART_CLIENT_ID=4246e76b-5509-4910-b17c-873d08329ec0
HOTMART_CLIENT_SECRET=75fb8430-ab8d-4d1c-8f75-f4af16ad61fe
HOTMART_SANDBOX=false
HOTMART_HOTTOK=uFNCkuhVokeYC44fPIHNmInUaN1p3a940bcbab-447c-4a20-94fd-af1257e3c3ee

# Impact.com (TO BE ADDED)
IMPACT_ACCOUNT_SID=
IMPACT_AUTH_TOKEN=

# AI Providers
MANUS_API_KEY=<your_manus_key>
OPENAI_API_KEY=<your_openai_key>

# Email
SENDGRID_API_KEY=<your_sendgrid_key>

# Redis (for job queue)
REDIS_URL=redis://...

# JWT
JWT_SECRET=<your_jwt_secret>

# Node
NODE_ENV=production
PORT=3000
```

### 4.2. Vercel Frontend

```bash
# Backend API
NEXT_PUBLIC_API_URL=https://affiliate-backend-production-df21.up.railway.app

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

---

## 5. Deployment Configuration

### 5.1. Railway (Backend)

**Build Command**: `npm install`  
**Start Command**: `node server.js`  
**Auto-deploy**: Enabled on `main` branch push

**Health Check**:
- Endpoint: `/api/health`
- Expected Response: `{"status": "ok", "timestamp": "..."}`

### 5.2. Vercel (Frontend)

**Framework**: Next.js  
**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Install Command**: `npm install`  
**Auto-deploy**: Enabled on `main` branch push

---

## 6. AI Services Integration

### 6.1. Manus AI

**Endpoint**: https://api.manus.im/v1  
**Supported Models**: `gpt-4.1-mini`, `gpt-4.1-nano`, `gemini-2.5-flash`  
**Use Cases**: Text generation, code generation, agent orchestration

### 6.2. OpenAI

**Endpoint**: https://api.openai.com/v1  
**Supported Models**: `gpt-4`, `gpt-3.5-turbo`  
**Use Cases**: Fallback for text generation, embeddings

### 6.3. Stability AI

**Endpoint**: https://api.stability.ai  
**Use Cases**: Image generation for landing pages and social media

---

## 7. Webhook Specifications

### 7.1. Hotmart Webhook

**URL**: `https://affiliate-backend-production-df21.up.railway.app/api/webhooks/hotmart`  
**Method**: POST  
**Security**: Hottok header verification  
**Header**: `X-Hotmart-Hottok: uFNCkuhVokeYC44fPIHNmInUaN1p3a940bcbab-447c-4a20-94fd-af1257e3c3ee`

**Supported Events**:
- PURCHASE_COMPLETE
- PURCHASE_APPROVED
- PURCHASE_CANCELED
- PURCHASE_REFUNDED
- PURCHASE_CHARGEBACK
- SUBSCRIPTION_CANCELLATION
- SUBSCRIPTION_RENEWAL
- SUBSCRIPTION_RENEWAL_DATE_UPDATE
- PLAN_CHANGE
- FIRST_ACCESS
- MODULE_COMPLETED
- CART_ABANDONMENT
- AWAITING_PAYMENT
- PURCHASE_OVERDUE
- EXPIRED_PURCHASE

**Response**: `{"success": true, "message": "Webhook received"}`

---

## 8. Agent System Requirements

### 8.1. Browser Automation

**Library**: Playwright  
**Browsers**: Chromium (headless and headed modes)  
**Features Required**:
- Cookie persistence (for login state)
- Screenshot capture
- Network request interception
- JavaScript execution
- Form filling and submission

### 8.2. Agent Capabilities

**Core Functions**:
- `login(platform, credentials)` - Authenticate with affiliate platform
- `searchMarketplace(keywords, filters)` - Search for products
- `getProductDetails(url)` - Extract product information
- `analyzeCompetitors(productId)` - Analyze competing products
- `extractReviews(productUrl)` - Scrape product reviews
- `checkAvailability(productId)` - Verify product is accepting affiliates

### 8.3. Job Queue System

**Technology**: BullMQ with Redis  
**Queue Types**:
- `agent-missions` - High priority research missions
- `data-sync` - Regular data synchronization with affiliate networks
- `content-generation` - AI content generation tasks
- `email-sending` - Email campaign delivery

**Job Retry Policy**:
- Max Attempts: 3
- Backoff: Exponential (1min, 5min, 15min)

---

This technical specification provides a comprehensive overview of the system architecture, database schema, API endpoints, and integration requirements. It serves as the authoritative reference for all development work on this project.

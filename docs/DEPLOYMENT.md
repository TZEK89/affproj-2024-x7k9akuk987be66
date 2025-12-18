# Deployment Guide - AI Affiliate Marketing System

**Author:** Manus AI  
**Last Updated:** December 18, 2025  
**Status:** ✅ Active

---

## Overview

This document is the single source of truth for all deployment-related information for the AI Affiliate Marketing System.

---

## Production Deployment

### Frontend

**Platform:** Railway  
**URL:** https://affiliate-frontend-production.up.railway.app  
**Repository:** `TZEK89/affiliate-marketing-system`  
**Branch:** `main`  
**Auto-Deploy:** ✅ Enabled  
**Build Command:** `pnpm build`  
**Output Directory:** `.next`  
**Framework:** Next.js 14

**Environment Variables (Railway - Frontend Service):**

```bash
NEXT_PUBLIC_API_URL=https://affiliate-backend-production-df21.up.railway.app/api
```

**Deployment Process:**

1.  Push to `main` branch on GitHub
2.  Railway automatically detects the push
3.  Railway runs Nixpacks build
4.  Railway deploys to production (typically 2-3 minutes)

### Backend

**Platform:** Railway  
**URL:** https://affiliate-backend-production-df21.up.railway.app/api  
**Repository:** `TZEK89/affiliate-marketing-system`  
**Branch:** `main`  
**Auto-Deploy:** ✅ Enabled  
**Start Command:** `node server.js`  
**Builder:** Nixpacks

**Environment Variables (Railway):**

```bash
# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Encryption
ENCRYPTION_KEY=64-character-hex-string
SESSION_ENCRYPTION_KEY=64-character-hex-string
LLM_ENCRYPTION_KEY=64-character-hex-string

# AI Services
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...

# Hotmart Integration
HOTMART_EMAIL=your_email@example.com
HOTMART_PASSWORD=your_password
HOTMART_CLIENT_ID=your_client_id
HOTMART_CLIENT_SECRET=your_client_secret
HOTMART_HOTTOK=your_hottok

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://affiliate-marketing-system-frontend.vercel.app
CORS_ORIGIN=*
```

**Deployment Process:**

1.  Push to `main` branch on GitHub
2.  Railway automatically detects the push
3.  Railway runs Nixpacks build
4.  Railway deploys to production (typically 2-3 minutes)

---

## Database

**Provider:** Supabase  
**Type:** PostgreSQL  
**Connection:** Via `DATABASE_URL` environment variable

**Tables:**

-   `products` - Affiliate products from all networks
-   `platform_connections` - Encrypted platform sessions
-   `browser_sessions` - Browser automation sessions
-   `discovered_products` - AI-discovered products
-   `llm_configurations` - LLM API keys (encrypted)
-   `scraping_missions` - Agentic scraping tasks
-   `scraping_strategies` - Learned scraping strategies
-   `campaigns` - Marketing campaigns
-   `landing_pages` - Generated landing pages
-   `subscribers` - Email list subscribers
-   `conversions` - Tracked conversions

---

## Queue System

**Provider:** Railway Redis  
**Type:** Redis  
**Connection:** Via `REDIS_URL` environment variable  
**Queue Library:** BullMQ

**Queues:**

-   `scraping-missions` - Agentic scraping jobs
-   `product-sync` - Product synchronization jobs
-   `image-generation` - AI image generation jobs

---

## Monitoring & Health Checks

### Backend Health Check

**Endpoint:** `GET /api/health`

**Response:**

```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2025-12-18T16:00:00.000Z",
  "version": "1.0.0",
  "database": "connected",
  "dbTime": "2025-12-18T16:00:00.000Z",
  "jobSystem": {
    "healthy": true
  }
}
```

### Frontend Health Check

**Method:** Visit the homepage  
**Expected:** Dashboard loads without errors

---

## Deployment Checklist

When deploying new features:

1.  ✅ Run `pnpm build` locally to verify no TypeScript errors
2.  ✅ Test locally with `pnpm dev` (frontend) and `node server.js` (backend)
3.  ✅ Commit and push to `main` branch
4.  ✅ Monitor Vercel deployment logs
5.  ✅ Monitor Railway deployment logs
6.  ✅ Test `/api/health` endpoint
7.  ✅ Test frontend homepage
8.  ✅ Test critical user flows (e.g., Connect button)

---

## Rollback Procedure

If a deployment breaks production:

### Frontend (Vercel):

1.  Go to Vercel dashboard
2.  Find the previous working deployment
3.  Click "Promote to Production"

### Backend (Railway):

1.  Go to Railway dashboard
2.  Find the previous working deployment
3.  Click "Redeploy"

Or, revert the commit on GitHub:

```bash
git revert HEAD
git push origin main
```

---

## Local Development

### Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Runs on: `http://localhost:3000`

### Backend:

```bash
cd backend
pnpm install
node server.js
```

Runs on: `http://localhost:3001`

**Environment Variables:** Create a `.env` file in the `backend` directory with the same variables as Railway.

---

## Troubleshooting

### Frontend not updating after deployment

-   Check Vercel deployment logs for errors
-   Verify build completed successfully
-   Clear browser cache and hard refresh (Ctrl+Shift+R)

### Backend not responding

-   Check Railway logs for errors
-   Verify environment variables are set
-   Check `/api/health` endpoint

### Database connection errors

-   Verify `DATABASE_URL` is correct
-   Check Supabase dashboard for service status
-   Verify IP whitelist (if applicable)

---

## Contact

For deployment issues, check:

1.  Vercel dashboard: https://vercel.com/dashboard
2.  Railway dashboard: https://railway.app/dashboard
3.  GitHub Actions: https://github.com/TZEK89/affiliate-marketing-system/actions

---

**End of Deployment Guide**

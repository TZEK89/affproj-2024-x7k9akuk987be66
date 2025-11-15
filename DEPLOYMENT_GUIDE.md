# 🚀 COMPLETE DEPLOYMENT & SETUP GUIDE

**Your step-by-step manual to take the system from code to live production**

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites & Account Setup](#prerequisites--account-setup)
2. [Database Deployment](#database-deployment)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [MCP Servers Setup](#mcp-servers-setup)
6. [External Integrations](#external-integrations)
7. [Testing & Verification](#testing--verification)
8. [Going Live](#going-live)
9. [Troubleshooting](#troubleshooting)

---

## 📦 PREREQUISITES & ACCOUNT SETUP

### **Step 1: Create Required Accounts (30 minutes)**

#### **Essential Services (Free Tiers Available):**

1. **Supabase** (Database)
   - Visit: https://supabase.com
   - Click "Start your project"
   - Sign up with GitHub (recommended)
   - ✅ Free tier: Unlimited API requests, 500MB database

2. **Railway** (Backend Hosting)
   - Visit: https://railway.app
   - Sign up with GitHub
   - ✅ Free tier: $5 credit/month

3. **Vercel** (Frontend Hosting)
   - Visit: https://vercel.com
   - Sign up with GitHub
   - ✅ Free tier: Unlimited deployments

4. **Upstash** (Redis - Optional but recommended)
   - Visit: https://upstash.com
   - Sign up with GitHub
   - ✅ Free tier: 10,000 commands/day

5. **GitHub** (Code Repository)
   - Visit: https://github.com
   - Create account if you don't have one
   - ✅ Free tier: Unlimited public/private repos

#### **Affiliate Networks (Start with 1-2):**

**Priority 1 - Start Here:**
1. **ClickBank**
   - Visit: https://clickbank.com
   - Sign up as affiliate
   - Apply for API access: https://api.clickbank.com
   - Get: Account nickname, API key

2. **ShareASale**
   - Visit: https://shareasale.com
   - Sign up as affiliate
   - Apply for API access (requires approval)
   - Get: Affiliate ID, API token, API secret

**Priority 2 - Add Later:**
3. **CJ Affiliate** (Commission Junction)
   - Visit: https://cj.com
   - Sign up as publisher
   - Apply for API access
   
4. **Impact**
   - Visit: https://impact.com
   - Sign up as partner

#### **Ad Platforms (Start with 1):**

**Priority 1 - Start Here:**
1. **Meta Ads** (Facebook/Instagram)
   - Visit: https://business.facebook.com
   - Create Business Manager account
   - Create Ad Account
   - Get API access: https://developers.facebook.com
   - Get: App ID, App Secret, Access Token

**Priority 2 - Add Later:**
2. **Google Ads**
   - Visit: https://ads.google.com
   - Create account
   - Enable API: https://developers.google.com/google-ads
   
3. **TikTok Ads**
   - Visit: https://ads.tiktok.com
   - Create account

#### **AI Services:**

**Priority 1 - Essential:**
1. **Anthropic Claude** (Text Generation)
   - Visit: https://anthropic.com
   - Sign up for API access
   - Get: API key
   - Cost: ~$50-200/month

2. **Midjourney** (Image Generation)
   - Visit: https://midjourney.com
   - Subscribe: $30-60/month
   - Get: API access (via Discord bot or API)

**Priority 2 - Add Later:**
3. **Runway** (Video Generation)
   - Visit: https://runwayml.com
   - Subscribe: $95/month
   
4. **ElevenLabs** (Voice Generation)
   - Visit: https://elevenlabs.io
   - Subscribe: $22-99/month

---

### **Step 2: Prepare Your Local Environment (15 minutes)**

#### **Install Required Software:**

**On macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install Git
brew install git

# Install PostgreSQL client (for database operations)
brew install postgresql@15
```

**On Windows:**
```bash
# Install using Chocolatey (https://chocolatey.org)
choco install nodejs-lts
choco install git
choco install postgresql15
```

**On Linux (Ubuntu/Debian):**
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git
sudo apt-get install -y git

# Install PostgreSQL client
sudo apt-get install -y postgresql-client
```

#### **Verify Installations:**
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
git --version   # Should show 2.x.x
psql --version  # Should show 15.x
```

---

### **Step 3: Get the Code (5 minutes)**

#### **Option A: Download from Your System**

If you have the code locally:
```bash
# Navigate to your project
cd /path/to/affiliate_system_build

# Initialize git repository
git init
git add .
git commit -m "Initial commit - Complete affiliate marketing system"
```

#### **Option B: Create GitHub Repository**

1. Go to https://github.com/new
2. Create new repository: `affiliate-marketing-system`
3. Make it private (recommended)
4. Don't initialize with README (we have code already)

```bash
# In your project directory
cd /path/to/affiliate_system_build

git init
git add .
git commit -m "Initial commit - Complete affiliate marketing system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/affiliate-marketing-system.git
git push -u origin main
```

---

## 🗄️ DATABASE DEPLOYMENT

### **Step 1: Create Supabase Project (10 minutes)**

1. **Log in to Supabase**
   - Visit: https://app.supabase.com
   - Click "New project"

2. **Configure Project:**
   - Name: `affiliate-marketing-prod`
   - Database Password: Generate strong password (SAVE THIS!)
   - Region: Choose closest to you
   - Pricing Plan: Free tier (upgrade later if needed)
   - Click "Create new project"

3. **Wait for provisioning** (2-3 minutes)

4. **Get Connection String:**
   - Go to Project Settings → Database
   - Find "Connection string" → "URI"
   - Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`
   - **SAVE THIS - You'll need it!**

---

### **Step 2: Run Database Migrations (5 minutes)**

#### **Option A: Using Supabase SQL Editor (Recommended)**

1. In Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy content from `database/migrations/001_initial_schema.sql`
4. Paste into SQL editor
5. Click "Run"
6. Wait for completion (should see "Success")

7. Repeat for `002_create_views.sql`
8. Repeat for `seeds/001_networks_platforms.sql`

#### **Option B: Using psql Command Line**

```bash
# Set your database URL
export DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Run migrations
psql $DATABASE_URL < database/migrations/001_initial_schema.sql
psql $DATABASE_URL < database/migrations/002_create_views.sql
psql $DATABASE_URL < database/seeds/001_networks_platforms.sql
```

---

### **Step 3: Verify Database Setup (2 minutes)**

In Supabase SQL Editor, run:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: networks, platforms, users, offers, assets, 
-- landing_pages, campaigns, clicks, conversions, settings, automation_logs

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Should show 9 views

-- Check seed data
SELECT * FROM networks;
SELECT * FROM platforms;

-- Should show ClickBank, ShareASale, CJ, Impact, Amazon
-- and Meta Ads, Google Ads, TikTok Ads, Pinterest Ads
```

✅ **Database is ready!**

---

## ⚡ BACKEND DEPLOYMENT

### **Step 1: Prepare Backend for Deployment (10 minutes)**

#### **Generate JWT Secret:**

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Copy the output - you'll need it!
# Example: 8f7d9a6b5c4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a
```

#### **Create .env File:**

Create `backend/.env` with:

```env
# Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=redis://default:[PASSWORD]@[HOST]:6379

# JWT
JWT_SECRET=your_generated_jwt_secret_here

# Environment
NODE_ENV=production
PORT=3000

# API Keys (add as you get them)
CLICKBANK_API_KEY=your_clickbank_api_key
SHAREASALE_API_TOKEN=your_shareasale_token
SHAREASALE_API_SECRET=your_shareasale_secret

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token

ANTHROPIC_API_KEY=your_claude_api_key
MIDJOURNEY_API_KEY=your_midjourney_key
```

---

### **Step 2: Deploy to Railway (15 minutes)**

1. **Log in to Railway**
   - Visit: https://railway.app
   - Click "New Project"

2. **Deploy from GitHub:**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Select `main` branch

3. **Configure Build:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add Environment Variables:**
   - Click on your service
   - Go to "Variables" tab
   - Click "Raw Editor"
   - Paste all variables from your `.env` file
   - Click "Save"

5. **Deploy:**
   - Railway will automatically deploy
   - Wait for deployment (3-5 minutes)
   - Once deployed, you'll see "Active" status

6. **Get Backend URL:**
   - Click "Settings" tab
   - Find "Domains" section
   - Click "Generate Domain"
   - Copy the URL (e.g., `https://your-app.up.railway.app`)
   - **SAVE THIS - You'll need it for frontend!**

---

### **Step 3: Test Backend API (5 minutes)**

```bash
# Set your backend URL
export API_URL="https://your-app.up.railway.app"

# Test health endpoint
curl $API_URL/health

# Should return: {"status":"ok","timestamp":"..."}

# Test registration
curl -X POST $API_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourSecurePassword123!",
    "name": "Your Name"
  }'

# Should return user object with token

# Test login
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourSecurePassword123!"
  }'

# Should return token
```

✅ **Backend is live!**

---

## 🎨 FRONTEND DEPLOYMENT

### **Step 1: Configure Frontend (5 minutes)**

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

---

### **Step 2: Deploy to Vercel (10 minutes)**

1. **Log in to Vercel**
   - Visit: https://vercel.com
   - Click "Add New" → "Project"

2. **Import Repository:**
   - Click "Import Git Repository"
   - Select your repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `frontend`
   - Build Command: `npm run build` (auto-filled)
   - Output Directory: `.next` (auto-filled)

4. **Add Environment Variable:**
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-app.up.railway.app`
   - Click "Add"

5. **Deploy:**
   - Click "Deploy"
   - Wait for deployment (2-3 minutes)
   - Once deployed, you'll see "Congratulations!"

6. **Get Frontend URL:**
   - Copy the deployment URL (e.g., `https://your-app.vercel.app`)
   - **This is your dashboard URL!**

---

### **Step 3: Test Frontend (5 minutes)**

1. **Open your dashboard:**
   - Visit: `https://your-app.vercel.app`
   - You should see the login page (if auth is implemented)
   - Or the dashboard (if using mock data)

2. **Test navigation:**
   - Click through all pages
   - Dashboard → Offers → Campaigns → Assets → Analytics → Landing Pages → Automation → Integrations → Settings

3. **Verify data loads:**
   - Check that mock data displays correctly
   - Verify charts render
   - Test filters and sorting

✅ **Frontend is live!**

---

## 🤖 MCP SERVERS SETUP

### **Step 1: Set Up Redis (5 minutes)**

If you haven't already:

1. **Create Upstash Redis:**
   - Visit: https://upstash.com
   - Create new database
   - Copy Redis URL
   - Add to backend environment variables

---

### **Step 2: Deploy MCP Servers (30 minutes)**

#### **Option A: Deploy to Railway (Recommended)**

For each MCP server:

1. **Create New Service:**
   - In Railway, click "New"
   - Select "Empty Service"
   - Name it (e.g., "mcp-operations")

2. **Configure:**
   - Root Directory: `mcp-servers/operations`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Add Environment Variables:**
   ```env
   API_URL=https://your-backend.up.railway.app
   PORT=3001
   ```

4. **Deploy**

5. **Repeat for all 5 servers:**
   - operations (port 3001)
   - content (port 3002)
   - analytics (port 3003)
   - automation (port 3004)
   - integrations (port 3005)

#### **Option B: Run Locally (For Testing)**

```bash
# For each MCP server
cd mcp-servers/operations
npm install
npm run build

# Create .env
echo "API_URL=https://your-backend.up.railway.app" > .env
echo "PORT=3001" >> .env

# Start
npm start
```

---

### **Step 3: Configure Manus AI to Use MCP Servers (10 minutes)**

1. **Get MCP Server URLs:**
   - Operations: `https://mcp-operations.up.railway.app`
   - Content: `https://mcp-content.up.railway.app`
   - Analytics: `https://mcp-analytics.up.railway.app`
   - Automation: `https://mcp-automation.up.railway.app`
   - Integrations: `https://mcp-integrations.up.railway.app`

2. **Configure in Manus:**
   - (Instructions will depend on Manus AI's MCP configuration method)
   - Typically involves adding server URLs to a configuration file

✅ **MCP Servers are ready!**

---

## 🔌 EXTERNAL INTEGRATIONS

### **Step 1: ClickBank Integration (15 minutes)**

1. **Get API Credentials:**
   - Log in to ClickBank
   - Go to Settings → API Settings
   - Generate API key
   - Note your account nickname

2. **Add to Backend:**
   - In Railway, add environment variables:
   ```env
   CLICKBANK_API_KEY=your_api_key
   CLICKBANK_ACCOUNT=your_account_nickname
   ```

3. **Test Integration:**
   ```bash
   # Use MCP or API to sync offers
   curl -X POST $API_URL/api/integrations/clickbank/sync \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

### **Step 2: Meta Ads Integration (20 minutes)**

1. **Create Facebook App:**
   - Visit: https://developers.facebook.com
   - Create new app
   - Add "Marketing API" product

2. **Get Credentials:**
   - App ID
   - App Secret
   - Generate long-lived access token

3. **Add to Backend:**
   ```env
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_ACCESS_TOKEN=your_access_token
   META_AD_ACCOUNT_ID=act_YOUR_ACCOUNT_ID
   ```

4. **Test:**
   ```bash
   curl -X GET $API_URL/api/integrations/meta/campaigns \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

### **Step 3: Claude AI Integration (10 minutes)**

1. **Get API Key:**
   - Visit: https://console.anthropic.com
   - Generate API key

2. **Add to Backend:**
   ```env
   ANTHROPIC_API_KEY=your_api_key
   ```

3. **Test:**
   ```bash
   curl -X POST $API_URL/api/content/generate-copy \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "offer_id": 1,
       "type": "ad_copy",
       "count": 3
     }'
   ```

---

### **Step 4: Additional Integrations (As Needed)**

Repeat similar process for:
- ShareASale
- Google Ads
- Midjourney
- Runway
- ElevenLabs

---

## ✅ TESTING & VERIFICATION

### **Complete System Test (30 minutes)**

#### **1. Database Test:**
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM networks;  -- Should return 5
SELECT COUNT(*) FROM platforms; -- Should return 4
SELECT COUNT(*) FROM users;     -- Should return 1 (default admin)
```

#### **2. Backend API Test:**
```bash
# Health check
curl $API_URL/health

# Auth test
curl -X POST $API_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Get token from response, then:
export TOKEN="your_jwt_token"

# Test offers endpoint
curl $API_URL/api/offers \
  -H "Authorization: Bearer $TOKEN"

# Test campaigns endpoint
curl $API_URL/api/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Test analytics endpoint
curl $API_URL/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

#### **3. Frontend Test:**
- Visit your Vercel URL
- Log in (if auth is implemented)
- Navigate through all 9 pages
- Test filters and sorting
- Verify charts display
- Test buttons and interactions

#### **4. MCP Test:**
- Use Manus AI to query: "How many campaigns do I have?"
- Use Manus AI to command: "List my top 5 offers"
- Verify responses come from your system

#### **5. Integration Test:**
- Sync offers from ClickBank
- Check if they appear in dashboard
- Create a test campaign
- Verify it appears in Meta Ads (if integrated)

---

## 🎯 GOING LIVE

### **Step 1: Create Your First Real Campaign (1 hour)**

1. **Add Real Offer:**
   - Go to Offers page
   - Click "Create Offer"
   - Add offer from ClickBank
   - Fill in details

2. **Generate Creative:**
   - Go to Assets page
   - Click "Generate Asset"
   - Use Claude to generate ad copy
   - Use Midjourney to generate images

3. **Create Landing Page:**
   - Go to Landing Pages
   - Click "Create Landing Page"
   - Select template
   - Configure for your offer

4. **Create Campaign:**
   - Go to Campaigns
   - Click "Create Campaign"
   - Select offer, assets, landing page
   - Set budget ($50-100 for testing)
   - Set target ROAS (2.0x)
   - Launch!

5. **Set Up Tracking:**
   - Add tracking pixel to landing page
   - Configure conversion tracking
   - Test click tracking

6. **Enable Automation:**
   - Go to Automation
   - Enable "Auto-Pause Underperformers"
   - Set threshold: ROAS < 1.5x
   - Enable "Auto-Scale Winners"
   - Set threshold: ROAS > 3.0x

---

### **Step 2: Monitor & Optimize (Daily)**

**Daily Routine (10 minutes):**
1. Check Dashboard for key metrics
2. Review campaign health alerts
3. Check automation execution history
4. Review new high-quality offers

**Weekly Review (30 minutes):**
1. Analyze performance trends
2. Review top performers
3. Adjust automation rules
4. Plan next week's strategy

---

## 🔧 TROUBLESHOOTING

### **Common Issues:**

#### **1. Backend Won't Start:**
```bash
# Check logs in Railway
# Common issues:
- Missing environment variables
- Database connection failed
- Redis connection failed

# Fix:
- Verify all environment variables are set
- Check DATABASE_URL is correct
- Check REDIS_URL is correct
```

#### **2. Frontend Shows API Errors:**
```bash
# Check:
- Is NEXT_PUBLIC_API_URL set correctly?
- Is backend running?
- Check browser console for errors

# Fix:
- Verify environment variable in Vercel
- Test backend URL directly
- Redeploy frontend
```

#### **3. Database Connection Failed:**
```bash
# Check:
- Is Supabase project running?
- Is DATABASE_URL correct?
- Is password correct?

# Fix:
- Go to Supabase dashboard
- Verify project is active
- Reset database password if needed
- Update DATABASE_URL
```

#### **4. MCP Servers Not Responding:**
```bash
# Check:
- Are servers deployed?
- Are they running?
- Check server logs

# Fix:
- Restart services in Railway
- Check environment variables
- Verify API_URL is correct
```

---

## 📞 SUPPORT RESOURCES

### **Documentation:**
- Supabase: https://supabase.com/docs
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs

### **API Documentation:**
- ClickBank: https://api.clickbank.com/docs
- Meta Ads: https://developers.facebook.com/docs/marketing-apis
- Google Ads: https://developers.google.com/google-ads/api
- Anthropic: https://docs.anthropic.com

---

## ✅ DEPLOYMENT CHECKLIST

### **Pre-Deployment:**
- [ ] All accounts created
- [ ] API keys collected
- [ ] Code pushed to GitHub
- [ ] Environment variables prepared

### **Database:**
- [ ] Supabase project created
- [ ] Migrations run successfully
- [ ] Seed data loaded
- [ ] Connection verified

### **Backend:**
- [ ] Deployed to Railway
- [ ] Environment variables set
- [ ] Health check passing
- [ ] API endpoints tested

### **Frontend:**
- [ ] Deployed to Vercel
- [ ] Environment variables set
- [ ] All pages loading
- [ ] Navigation working

### **MCP Servers:**
- [ ] All 5 servers deployed
- [ ] Environment variables set
- [ ] Responding to requests
- [ ] Configured in Manus AI

### **Integrations:**
- [ ] ClickBank connected
- [ ] Meta Ads connected
- [ ] Claude AI connected
- [ ] Offer sync working

### **Testing:**
- [ ] Database queries working
- [ ] API endpoints responding
- [ ] Frontend displaying data
- [ ] MCP servers responding
- [ ] Integrations syncing

### **Go Live:**
- [ ] First offer added
- [ ] First campaign created
- [ ] Tracking configured
- [ ] Automation enabled
- [ ] Monitoring set up

---

## 🎉 YOU'RE LIVE!

**Congratulations! Your AI-Automated Affiliate Marketing System is now fully operational!**

**Next Steps:**
1. Start with small test campaigns ($50-100)
2. Monitor performance daily
3. Optimize based on data
4. Scale gradually (20-30% increases)
5. Add more offers and niches
6. Grow to profitability!

**You've got this!** 💪🚀💰

---

**Need help? Review the documentation or check the troubleshooting section above.**


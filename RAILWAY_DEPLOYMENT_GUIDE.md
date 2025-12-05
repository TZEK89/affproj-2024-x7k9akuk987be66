# Railway Deployment Guide

## Step-by-Step Backend Deployment

### Prerequisites
- GitHub account (already have ✅)
- Railway account (sign up at https://railway.app with GitHub)

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose: `TZEK89/affiliate-marketing-system`
4. Railway will detect it's a Node.js project

### Step 3: Configure Root Directory

Since your backend is in a subdirectory:

1. Go to **Settings** tab
2. Find **Root Directory**
3. Set it to: `backend`
4. Click "Save"

### Step 4: Add PostgreSQL Database

1. In your project, click "New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will automatically provision a database

### Step 5: Set Environment Variables

Go to **Variables** tab and add these:

```env
# Database (Railway will auto-provide DATABASE_URL)
# Just verify it's there

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_railway_2024

# Hotmart API
HOTMART_CLIENT_ID=your_hotmart_client_id
HOTMART_CLIENT_SECRET=your_hotmart_client_secret
HOTMART_SANDBOX=false

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server Config
PORT=5000
NODE_ENV=production

# CORS (your frontend URL)
FRONTEND_URL=https://affiliate-marketing-system-frontend.vercel.app
```

### Step 6: Deploy

1. Railway will automatically deploy after you save variables
2. Wait 2-3 minutes for deployment
3. Check the **Deployments** tab for status

### Step 7: Get Your Backend URL

1. Go to **Settings** tab
2. Find **Public Networking**
3. Click "Generate Domain"
4. Copy the URL (e.g., `https://your-app.up.railway.app`)

### Step 8: Run Database Migrations

You'll need to run migrations manually. Two options:

**Option A: Using Railway CLI**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run psql $DATABASE_URL -f database/migrations/001_create_users_table.sql
railway run psql $DATABASE_URL -f database/migrations/002_create_products_table.sql
railway run psql $DATABASE_URL -f database/migrations/003_create_product_image_history_table.sql
```

**Option B: Using Railway Dashboard**
1. Go to PostgreSQL service
2. Click "Data" tab
3. Click "Query"
4. Copy and paste each migration file content
5. Execute

### Step 9: Update Frontend Environment Variable

Update your Vercel project:

1. Go to https://vercel.com
2. Select `affiliate-marketing-system-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Update `NEXT_PUBLIC_API_URL` to your Railway backend URL
5. Redeploy frontend

### Step 10: Test!

1. Go to your live frontend URL
2. Try to register an account
3. Should work! 🎉

## Troubleshooting

### Build Fails
- Check that Root Directory is set to `backend`
- Verify all dependencies are in package.json
- Check build logs in Railway dashboard

### Database Connection Fails
- Verify DATABASE_URL is set automatically by Railway
- Check that PostgreSQL service is running
- Verify migrations were run

### CORS Errors
- Make sure FRONTEND_URL environment variable is set
- Update CORS configuration in server.js if needed

### API Returns 500 Errors
- Check application logs in Railway dashboard
- Verify all environment variables are set
- Check database connection

## Cost

**Railway Free Tier:**
- $5 free credit per month
- Enough for development/testing
- No credit card required initially

**Estimated Usage:**
- Backend: ~$3-4/month
- PostgreSQL: ~$1-2/month
- Total: ~$5/month (covered by free tier)

## Alternative: Render.com

If Railway doesn't work, you can also use Render.com:

1. Sign up at https://render.com
2. Create "Web Service" from GitHub repo
3. Set Root Directory to `backend`
4. Add PostgreSQL database
5. Set environment variables
6. Deploy

Render also has a free tier!

---

**Ready to deploy?** Follow the steps above and let me know if you hit any issues!

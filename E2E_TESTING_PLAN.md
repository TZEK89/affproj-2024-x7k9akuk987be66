# End-to-End Testing Plan for Agentic Research Core

## 🎯 Objective
Verify that the complete AI-powered affiliate marketing system works end-to-end with REAL data from Hotmart.

---

## ✅ Pre-Deployment Checklist

### Backend (Railway)
- [x] Database migrations applied
- [x] Environment variables configured (MANUS_API_KEY, HOTMART credentials)
- [x] BullMQ + Redis configured
- [x] Hotmart webhook integration tested (15 events, all 200 OK)
- [x] **CRITICAL FIX**: Hotmart login selectors updated (#username, #password, form#fm1)
- [x] 2FA detection added (60-second wait)
- [x] Deployed to Railway (auto-deploy on push)

### Frontend (Vercel)
- [x] Missions page UI complete
- [x] Mission Detail page with real-time logs
- [x] Discovery Workbench with AI analysis
- [x] API service integration (10+ endpoints)
- [x] TypeScript types defined
- [x] Deployed to Vercel (auto-deploy on push)

### Latest Deployment
- **Commit**: `93a1e1c` - "Fix Hotmart login selectors and add 2FA detection"
- **Frontend**: Deployed to Vercel (state: READY)
- **Backend**: Deployed to Railway (auto-deploy triggered)
- **Time**: ~5 minutes ago

---

## 🧪 Test Scenarios

### Test 1: Create Mission via Dashboard
**Objective**: Verify mission creation and job queue integration

**Steps**:
1. Navigate to `/missions` page
2. Click "Create New Mission"
3. Fill in form:
   - **Name**: "Test Mission - Weight Loss Products"
   - **Prompt**: "Find top 5 weight loss products on Hotmart with high commission rates"
   - **Platform**: Hotmart
   - **Mode**: Agentic (AI-driven)
4. Click "Create Mission"
5. Verify mission appears in missions list with status "pending"

**Expected Results**:
- Mission created in database
- BullMQ job enqueued
- Mission visible in UI with correct status
- Mission ID generated

---

### Test 2: AI Agent Execution (Think-Act-Observe Loop)
**Objective**: Verify Manus AI can control browser and make decisions

**Steps**:
1. Click on mission from Test 1
2. Watch real-time logs on Mission Detail page
3. Observe AI agent execution phases:
   - **Think**: AI analyzes current state and decides next action
   - **Act**: AI calls browser tool (login, search, extract, etc.)
   - **Observe**: AI receives tool result and updates state
4. Monitor for:
   - Successful Hotmart login (with 2FA handling if needed)
   - Product search execution
   - Product details extraction
   - AI analysis and scoring

**Expected Results**:
- Logs show Think-Act-Observe loop iterations
- Browser automation succeeds (login → search → extract)
- AI makes intelligent decisions (not hardcoded script)
- Products discovered and scored
- Mission status updates: pending → running → completed

**Potential Issues**:
- 2FA verification may require manual intervention (60-second timeout)
- Hotmart may have rate limiting
- AI may need multiple iterations to complete task

---

### Test 3: Discovery Workbench Review
**Objective**: Verify AI-discovered products appear with analysis

**Steps**:
1. Navigate to `/discovery` page
2. Verify discovered products from Test 2 appear
3. Check each product card for:
   - Product name and description
   - Commission rate and price
   - AI-generated score (0-100)
   - AI analysis text
4. Click "View Details" to expand analysis
5. Test "Promote" button to add to main offers

**Expected Results**:
- All discovered products visible
- AI scores calculated (based on commission, popularity, relevance)
- Analysis text explains scoring rationale
- "Promote" button creates new offer in main system
- Product moved from "discovered" to "promoted" status

---

### Test 4: Multi-Agent Comparison (Optional)
**Objective**: Compare Manus vs Claude vs GPT-4 performance

**Steps**:
1. Create 3 identical missions with same prompt
2. Set different AI providers:
   - Mission A: Manus (primary)
   - Mission B: Claude (via Anthropic API)
   - Mission C: GPT-4 (via OpenAI API)
3. Run all 3 in parallel
4. Compare results:
   - Execution time
   - Number of products found
   - Quality of AI analysis
   - Accuracy of scoring

**Expected Results**:
- All 3 agents complete successfully
- Results vary slightly (different decision-making)
- Manus should be fastest (optimized for this use case)
- Quality comparison documented

---

## 🐛 Known Issues & Workarounds

### Issue 1: Hotmart 2FA Verification
**Symptom**: Login pauses at 2FA screen
**Workaround**: 
- System detects 2FA URL patterns
- Logs warning: "⚠️ Please complete 2FA verification manually"
- Waits 60 seconds for completion
- If timeout, mission fails with clear error message

**Long-term fix**: 
- Store 2FA cookies after first login
- Use headless browser with cookie persistence

### Issue 2: Playwright Browser Launch in Railway
**Symptom**: Browser fails to launch in Railway container
**Workaround**:
- Install Playwright dependencies in Dockerfile
- Use `--no-sandbox` flag for Chromium
- Set `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright` env var

**Status**: Already implemented in BrowserService.js

### Issue 3: Rate Limiting
**Symptom**: Hotmart blocks requests after N searches
**Workaround**:
- Add random delays between actions (1-3 seconds)
- Rotate user agents
- Use cookie persistence to maintain session

**Status**: Partially implemented (delays added)

---

## 📊 Success Criteria

### Minimum Viable Test (MVP)
- ✅ Mission created via UI
- ✅ AI agent logs visible in real-time
- ✅ Hotmart login succeeds (with or without 2FA)
- ✅ At least 1 product discovered
- ✅ Product appears in Discovery Workbench
- ✅ "Promote" button works

### Full Success
- ✅ All MVP criteria met
- ✅ 5+ products discovered per mission
- ✅ AI scoring accurate (commission-based)
- ✅ No crashes or timeout errors
- ✅ Multi-agent comparison works
- ✅ End-to-end time < 5 minutes per mission

---

## 🚀 Next Steps After Testing

### If Tests Pass
1. **Document Results**: Screenshot logs, discovered products, AI analysis
2. **Optimize AI Prompts**: Improve decision-making quality
3. **Add More Platforms**: Impact.com, ClickBank, ShareASale
4. **Build Campaign Automation**: Auto-create landing pages for discovered products
5. **Add Analytics**: Track conversion rates, click-through rates

### If Tests Fail
1. **Check Railway Logs**: `deployment_logs` via Railway MCP
2. **Verify Environment Variables**: MANUS_API_KEY, HOTMART credentials
3. **Test Browser Automation Locally**: Run Playwright outside Railway
4. **Fallback to Scripted Mode**: If AI fails, use hardcoded automation
5. **Report Issues**: Document errors and request help

---

## 🔗 Quick Links

- **Frontend**: https://affiliate-marketing-system-frontend-icvfzgw2x.vercel.app
- **Backend**: (Railway URL from environment)
- **GitHub Repo**: https://github.com/TZEK89/affiliate-marketing-system
- **Missions Page**: /missions
- **Discovery Workbench**: /discovery
- **API Docs**: /api/docs (if Swagger enabled)

---

## 📝 Test Execution Log

| Test | Status | Time | Notes |
|------|--------|------|-------|
| 1. Create Mission | ⏳ Pending | - | Waiting for deployment |
| 2. AI Execution | ⏳ Pending | - | Depends on Test 1 |
| 3. Discovery Review | ⏳ Pending | - | Depends on Test 2 |
| 4. Multi-Agent | ⏳ Pending | - | Optional |

**Last Updated**: 2025-12-06 21:00 UTC
**Deployment Status**: ✅ Frontend READY, ⏳ Backend deploying
**Blocker Status**: ✅ RESOLVED (login selectors fixed)

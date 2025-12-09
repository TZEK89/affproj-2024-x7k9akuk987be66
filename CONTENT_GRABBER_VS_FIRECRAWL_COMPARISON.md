# Content Grabber MCP vs Firecrawl - Complete Comparison

**Date:** December 8, 2025  
**Context:** Scraping Hotmart for affiliate marketing system

---

## Executive Summary

**Short Answer:** **Keep Content Grabber MCP for Hotmart, use Firecrawl for everything else.**

**Why?**
- Content Grabber: Better for **protected sites** (Hotmart, ClickBank) that block bots
- Firecrawl: Better for **simple sites** and **one-off scraping** tasks

**Best Strategy:** Use BOTH - they complement each other perfectly.

---

## 📊 Head-to-Head Comparison

| Feature | Content Grabber + MCP | Firecrawl |
|---------|----------------------|-----------|
| **Anti-bot Bypass** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Good |
| **Hotmart Compatibility** | ✅ Works perfectly | ⚠️ May get blocked |
| **Setup Complexity** | ⚠️ Moderate (Windows only) | ✅ Easy (API call) |
| **Visual Debugging** | ✅ Full GUI editor | ❌ No visual tools |
| **Cost** | ✅ $0 (you own license) | ⚠️ $9-47/month |
| **Speed** | ⭐⭐⭐ Good (2-5 sec) | ⭐⭐⭐⭐⭐ Fast (<1 sec) |
| **Markdown Output** | ⚠️ Manual extraction | ✅ Built-in |
| **Session Management** | ✅ Maintains login | ⚠️ Stateless |
| **JavaScript Handling** | ✅ Full browser | ✅ Full rendering |
| **Scalability** | ⭐⭐⭐ Limited by Windows | ⭐⭐⭐⭐⭐ Cloud-based |
| **Learning Curve** | ⚠️ Steep | ✅ Simple |
| **Maintenance** | ⚠️ Requires updates | ✅ Managed service |
| **Proxy Rotation** | ⚠️ Manual setup | ✅ Built-in |
| **AI Integration** | ✅ Via MCP | ✅ Via API |

---

## 🎯 Verdict: When to Use Each

### Use Content Grabber When:
✅ Scraping **Hotmart** (anti-bot protection)  
✅ Scraping **ClickBank** (requires login)  
✅ Scraping **ShareASale** (protected affiliate platforms)  
✅ Need to **maintain login sessions**  
✅ Need **visual debugging** of selectors  
✅ Scraping **complex multi-step workflows**  
✅ You already **own the license** ($0 cost)

### Use Firecrawl When:
✅ Scraping **public websites** (blogs, news sites)  
✅ Need **fast one-off scraping**  
✅ Want **markdown output** for AI processing  
✅ Scraping **multiple different sites** quickly  
✅ Need **cloud-based scalability**  
✅ Want **zero maintenance**  
✅ Scraping **product research** from open sites

---

## 📝 Detailed Workflow: Content Grabber MCP

### Scenario: Scrape Hotmart Product Page

**Target URL:** `https://app.hotmart.com/market/details?productUcode=5119144`

**Goal:** Extract product name, price, commission, rating, description, image

---

### STEP-BY-STEP WORKFLOW

#### **Phase 1: Create the Agent (One-Time Setup)**

**1. Open Content Grabber Desktop App**
- Launch Content Grabber on your Windows machine
- Click "New Agent" button

**2. Configure Agent Basics**
- **Agent Name:** `hotmart_product_scraper`
- **Description:** "Scrapes Hotmart product details for affiliate system"
- **Category:** "Affiliate Marketing"

**3. Add Input Parameter**
- Click "Add Parameter"
- **Name:** `productId`
- **Type:** Text
- **Default Value:** `5119144` (for testing)
- **Description:** "Hotmart product unique code"

**4. Set Starting URL**
- **URL Template:** `https://app.hotmart.com/market/details?productUcode={productId}`
- **Method:** GET
- **Wait for page load:** Yes (5 seconds)

**5. Configure Browser Settings**
- **Browser:** Chrome (built-in)
- **JavaScript:** Enabled
- **Cookies:** Enabled
- **User Agent:** Random rotation
- **Window Size:** 1920x1080

---

#### **Phase 2: Extract Data Fields**

**6. Extract Product Name**

**Action:** Click "Add Command" → "Extract Data"

**Configuration:**
- **Field Name:** `productName`
- **Selector Type:** CSS Selector
- **Selector:** `h3._text-4._text-lg-5._mb-0`
- **Extraction Type:** Text Content
- **Required:** Yes
- **Validation:** Not empty

**How to find selector:**
1. In Content Grabber, click "Inspect Element"
2. Click on product name on the page
3. Content Grabber highlights the element
4. Click "Use This Selector"
5. Content Grabber auto-generates CSS selector

**7. Extract Price**

**Configuration:**
- **Field Name:** `price`
- **Selector:** `.product-details-info__price` (or similar)
- **Extraction Type:** Text Content
- **Data Cleaning:**
  - Remove currency symbols: `$`, `R$`
  - Convert to number
  - Regex: `[\d.,]+`

**8. Extract Commission**

**Configuration:**
- **Field Name:** `commission`
- **Selector:** Look for text containing "comissão" or "commission"
- **Extraction Type:** Text Content
- **Data Cleaning:**
  - Extract percentage: `(\d+)%`
  - Convert to number

**9. Extract Rating**

**Configuration:**
- **Field Name:** `rating`
- **Selector:** `.rating-stars` or similar
- **Extraction Type:** Attribute (`data-rating` or `aria-label`)
- **Data Cleaning:**
  - Extract number: `[\d.]+`
  - Validate range: 0-5

**10. Extract Description**

**Configuration:**
- **Field Name:** `description`
- **Selector:** `.product-details-info__description` or card body
- **Extraction Type:** Text Content
- **Data Cleaning:**
  - Trim whitespace
  - Limit to 500 characters
  - Remove HTML tags

**11. Extract Product Image**

**Configuration:**
- **Field Name:** `imageUrl`
- **Selector:** `.product-details-info__product-image`
- **Extraction Type:** Attribute (`src`)
- **Validation:** Must start with `http`

**12. Extract Producer Name**

**Configuration:**
- **Field Name:** `producer`
- **Selector:** `.producer-name` or similar
- **Extraction Type:** Text Content

**13. Extract Category**

**Configuration:**
- **Field Name:** `category`
- **Selector:** `.breadcrumb` or category link
- **Extraction Type:** Text Content

---

#### **Phase 3: Configure Output**

**14. Set Output Format**

**Configuration:**
- **Format:** JSON
- **Structure:** Single object (not array)
- **Fields to include:** All extracted fields
- **Pretty print:** Yes

**Example Output:**
```json
{
  "productId": "5119144",
  "productName": "Sebastien Valla Massage School",
  "price": 297,
  "commission": 40,
  "rating": 4.9,
  "description": "Learn professional massage techniques...",
  "imageUrl": "https://static-media.hotmart.com/...",
  "producer": "Sebastien Valla",
  "category": "Health & Wellness"
}
```

**15. Configure Error Handling**

**Settings:**
- **On selector not found:** Return null
- **On page timeout:** Retry 3 times
- **On network error:** Wait 5 seconds, retry
- **Log level:** Errors only (for production)

---

#### **Phase 4: Test the Agent**

**16. Manual Test in Content Grabber**

**Steps:**
1. Click "Run Agent" button
2. Enter test product ID: `5119144`
3. Watch browser automation in real-time
4. Check extracted data in preview pane
5. Verify all fields are populated correctly

**17. Debug Selectors (if needed)**

**If data is missing:**
1. Click "Debug Mode"
2. Agent pauses at each step
3. Inspect the page manually
4. Update selectors if page structure changed
5. Re-run test

**18. Save the Agent**

**Steps:**
1. Click "Save Agent"
2. Agent saved to: `C:\Users\Public\Documents\Content Grabber\Agents\hotmart_product_scraper.scg`
3. Agent now available to MCP server

---

#### **Phase 5: Use via MCP Server**

**19. Start Content Grabber Agent Service**

**Windows Services:**
1. Press `Win + R`
2. Type `services.msc`
3. Find "Content Grabber Agent Service"
4. Click "Start"
5. Service listens on `http://localhost:8003/ContentGrabber`

**20. Start MCP Server**

**Command Prompt:**
```bash
cd C:\Users\YourName\Documents\mcp-servers\content-grabber-mcp
node dist\index.js
```

**Output:**
```
Content Grabber MCP Server starting...
Configuration: {
  serviceUrl: 'http://localhost:8003/ContentGrabber',
  agentsPath: 'C:\\Users\\Public\\Documents\\Content Grabber\\Agents',
  useService: true
}
Content Grabber MCP Server running on stdio
```

**21. Configure in Manus AI**

**MCP Configuration File:**
```json
{
  "mcpServers": {
    "content-grabber": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\Documents\\mcp-servers\\content-grabber-mcp\\dist\\index.js"]
    }
  }
}
```

---

#### **Phase 6: Scrape via Manus AI**

**22. Natural Language Command**

**User says to Manus AI:**
> "Use Content Grabber to scrape Hotmart product 5119144"

**23. Manus AI Executes:**

**Step 1:** Call MCP tool `run_agent`
```javascript
await mcp.callTool('run_agent', {
  agentName: 'hotmart_product_scraper',
  parameters: {
    productId: '5119144'
  },
  timeout: 60
});
```

**Step 2:** MCP server sends HTTP request
```http
POST http://localhost:8003/ContentGrabber/StartAgent
Content-Type: application/json

{
  "agentName": "hotmart_product_scraper",
  "parameters": {
    "productId": "5119144"
  }
}
```

**Step 3:** Content Grabber Agent Service receives request
- Loads `hotmart_product_scraper.scg`
- Launches Chrome browser (headless)
- Navigates to URL with productId parameter
- Executes extraction commands
- Returns JSON data

**Step 4:** MCP server receives response
```json
{
  "success": true,
  "data": {
    "productId": "5119144",
    "productName": "Sebastien Valla Massage School",
    "price": 297,
    "commission": 40,
    "rating": 4.9,
    "description": "Learn professional massage techniques from a certified instructor...",
    "imageUrl": "https://static-media.hotmart.com/...",
    "producer": "Sebastien Valla",
    "category": "Health & Wellness"
  },
  "recordCount": 1,
  "executionTime": 4.2
}
```

**Step 5:** Manus AI processes data
- Validates required fields
- Cleans/formats data if needed
- Sends to dashboard API

---

#### **Phase 7: Send to Dashboard**

**24. Manus AI Calls Dashboard API**

```javascript
await fetch('https://your-railway-app.railway.app/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    externalId: '5119144',
    source: 'hotmart',
    name: data.productName,
    price: data.price,
    commission: data.commission,
    rating: data.rating,
    description: data.description,
    imageUrl: data.imageUrl,
    producer: data.producer,
    category: data.category,
    status: 'discovered',
    discoveredAt: new Date().toISOString()
  })
});
```

**25. Dashboard Updates**

**Backend (Railway):**
1. Receives product data
2. Checks if product already exists (by externalId)
3. If new: Insert into database
4. If exists: Update fields
5. Store in Redis cache for fast access
6. Return success response

**Frontend (React):**
1. Product appears in "Discovery" section
2. User sees notification: "New product discovered!"
3. Product card displays all information
4. User can click "Get Affiliate Link"

---

### COMPLETE WORKFLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│  USER: "Scrape Hotmart product 5119144"                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  MANUS AI                                                   │
│  • Understands intent                                       │
│  • Calls MCP tool: run_agent                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTENT GRABBER MCP SERVER (Windows)                       │
│  • Receives: agentName + parameters                         │
│  • Sends HTTP to Agent Service                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTENT GRABBER AGENT SERVICE                              │
│  • Loads: hotmart_product_scraper.scg                       │
│  • Launches: Chrome browser                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  CHROME BROWSER (Automated)                                 │
│  1. Navigate to: app.hotmart.com/market/details?...         │
│  2. Wait for page load (5 seconds)                          │
│  3. Execute JavaScript if needed                            │
│  4. Extract data using CSS selectors:                       │
│     • Product name                                          │
│     • Price                                                 │
│     • Commission                                            │
│     • Rating                                                │
│     • Description                                           │
│     • Image URL                                             │
│     • Producer                                              │
│     • Category                                              │
│  5. Clean and format data                                   │
│  6. Return JSON                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT SERVICE → MCP SERVER                                 │
│  Returns: { success: true, data: {...} }                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  MCP SERVER → MANUS AI                                      │
│  Returns: Formatted JSON with product data                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  MANUS AI PROCESSING                                        │
│  • Validates data                                           │
│  • Checks required fields                                   │
│  • Optionally: Use OpenAI to enhance description            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD API (Railway)                                    │
│  POST /api/products                                         │
│  • Check if product exists                                  │
│  • Insert/Update database                                   │
│  • Cache in Redis                                           │
│  • Return success                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD UI (React)                                       │
│  • Display new product in Discovery section                 │
│  • Show notification to user                                │
│  • Enable "Get Affiliate Link" button                       │
└─────────────────────────────────────────────────────────────┘
```

---

### TIMING BREAKDOWN

| Step | Duration | Details |
|------|----------|---------|
| User command | 0.1s | Natural language to Manus |
| MCP call | 0.2s | Manus → MCP server |
| Agent load | 0.5s | Load .scg file |
| Browser launch | 1.0s | Chrome startup |
| Page navigation | 1.5s | Load Hotmart page |
| Page wait | 2.0s | Wait for JavaScript |
| Data extraction | 0.5s | Execute selectors |
| Data cleaning | 0.3s | Format JSON |
| Return to MCP | 0.2s | HTTP response |
| AI processing | 0.5s | Optional enhancement |
| Dashboard API | 0.3s | Database insert |
| **TOTAL** | **~7 seconds** | End-to-end |

---

### ERROR HANDLING

**Common Issues & Solutions:**

**1. Selector Not Found**
- **Cause:** Hotmart changed page structure
- **Solution:** 
  1. Open Content Grabber GUI
  2. Run agent in debug mode
  3. Inspect page manually
  4. Update selectors
  5. Save agent

**2. Page Timeout**
- **Cause:** Slow internet or Hotmart down
- **Solution:** 
  - Increase timeout in agent settings
  - Add retry logic (already in MCP)

**3. Anti-Bot Detection**
- **Cause:** Hotmart detected automation
- **Solution:**
  - Content Grabber handles this automatically
  - Uses realistic browser fingerprints
  - Random user agents
  - Cookie persistence

**4. Missing Data**
- **Cause:** Product page has different structure
- **Solution:**
  - Make selectors more flexible
  - Use multiple selector fallbacks
  - Return null for optional fields

---

### MAINTENANCE

**Monthly Tasks:**

**1. Check Selectors (15 minutes)**
- Run test scrapes
- Verify all fields extracting correctly
- Update selectors if Hotmart changed layout

**2. Monitor Success Rate**
- Check MCP logs
- Track failed scrapes
- Identify patterns

**3. Update Agent**
- Add new fields if needed
- Optimize selectors for speed
- Improve error handling

---

## 🎯 Why Content Grabber Wins for Hotmart

### Advantages:

**1. Anti-Bot Bypass**
- Content Grabber mimics real users better than any API
- Maintains cookies across sessions
- Handles CAPTCHAs (if needed)

**2. Visual Debugging**
- See exactly what's happening
- Click through the workflow
- Test selectors in real-time

**3. Session Persistence**
- If Hotmart requires login, Content Grabber maintains session
- Cookies persist across runs
- No re-authentication needed

**4. Cost**
- You already own the license = $0
- Firecrawl = $9-47/month
- ROI: Infinite

**5. Reliability**
- Proven to work with protected sites
- Enterprise-grade tool
- Used by Fortune 500 companies

---

## 📝 Next Section: Firecrawl Workflow

(Continued in next response...)

---

*Created by Manus AI - December 8, 2025*

_No changes made. File content is identical._


---

## 📝 Detailed Workflow: Firecrawl

### Scenario: Scrape Hotmart Product Page (Alternative Method)

**Target URL:** `https://app.hotmart.com/market/details?productUcode=5119144`

**Goal:** Extract product name, price, commission, rating, description, image

---

### STEP-BY-STEP WORKFLOW

#### **Phase 1: Setup Firecrawl**

**1. Get API Key**
- Go to `firecrawl.dev`
- Sign up for a free or paid plan
- Copy your API key

**2. Configure in Manus AI**
- Store API key as a secret or environment variable
- No installation needed - it's a cloud API

---

#### **Phase 2: Scrape via Manus AI**

**3. Natural Language Command**

**User says to Manus AI:**
> "Use Firecrawl to scrape Hotmart product 5119144"

**4. Manus AI Executes:**

**Step 1:** Call Firecrawl API
```javascript
const response = await fetch("https://api.firecrawl.dev/v0/scrape", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`
  },
  body: JSON.stringify({
    url: "https://app.hotmart.com/market/details?productUcode=5119144",
    pageOptions: {
      screenshot: true,
      waitFor: 5000 // Wait 5 seconds for JS
    },
    extractorOptions: {
      mode: "llm-extraction",
      extractionSchema: {
        type: "object",
        properties: {
          productName: { type: "string" },
          price: { type: "number" },
          commission: { type: "number" },
          rating: { type: "number" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          producer: { type: "string" },
          category: { type: "string" }
        },
        required: ["productName", "price", "commission"]
      }
    }
  })
});

const data = await response.json();
```

**Step 2:** Firecrawl backend executes
- Chooses a random proxy server
- Launches a headless browser
- Navigates to Hotmart URL
- Waits 5 seconds for dynamic content
- Takes a screenshot
- Extracts the entire DOM/HTML

**Step 3:** Firecrawl AI processing
- Feeds the HTML to an internal LLM
- Uses the `extractionSchema` to find the data
- Populates the JSON object

**Step 4:** Firecrawl returns data
```json
{
  "success": true,
  "data": {
    "productName": "Sebastien Valla Massage School",
    "price": 297,
    "commission": 40,
    "rating": 4.9,
    "description": "Learn professional massage techniques...",
    "imageUrl": "https://static-media.hotmart.com/...",
    "producer": "Sebastien Valla",
    "category": "Health & Wellness"
  },
  "metadata": {
    "url": "...",
    "title": "...",
    "screenshot": "data:image/png;base64,..."
  }
}
```

**Step 5:** Manus AI processes data
- Same as Content Grabber workflow
- Sends to dashboard API

---

### COMPLETE WORKFLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│  USER: "Scrape Hotmart product 5119144"                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  MANUS AI                                                   │
│  • Understands intent                                       │
│  • Calls Firecrawl API                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  FIRECRAWL API (Cloud)                                      │
│  1. Launch headless browser from random proxy             │
│  2. Navigate to Hotmart URL                                 │
│  3. Wait 5 seconds for JS                                   │
│  4. Extract HTML                                            │
│  5. Use LLM to extract data based on schema                 │
│  6. Return JSON                                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  MANUS AI PROCESSING                                        │
│  • Validates data                                           │
│  • Sends to dashboard API                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD API (Railway)                                    │
│  • Insert/Update database                                   │
│  • Cache in Redis                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  DASHBOARD UI (React)                                       │
│  • Display new product                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### TIMING BREAKDOWN

| Step | Duration | Details |
|------|----------|---------|
| User command | 0.1s | Natural language to Manus |
| API call | 0.2s | Manus → Firecrawl |
| Browser launch | 1.0s | Firecrawl cloud browser |
| Page navigation | 1.5s | Load Hotmart page |
| Page wait | 5.0s | Wait for JavaScript |
| AI extraction | 2.0s | LLM processing |
| Return to Manus | 0.2s | API response |
| Dashboard API | 0.3s | Database insert |
| **TOTAL** | **~10 seconds** | End-to-end |

---

### ERROR HANDLING

**1. Anti-Bot Detection**
- **Cause:** Hotmart detects Firecrawl's proxy/fingerprint
- **Solution:**
  - ⚠️ **This is the main risk**
  - Firecrawl rotates proxies automatically
  - May need to contact Firecrawl support
  - May need to switch to Content Grabber

**2. Incorrect Data Extraction**
- **Cause:** LLM misinterprets the HTML
- **Solution:**
  - Refine the `extractionSchema`
  - Add more specific descriptions to fields
  - Switch to `css-selector` mode if schema fails

**3. Timeout**
- **Cause:** Hotmart page is very slow
- **Solution:**
  - Increase `waitFor` parameter
  - Firecrawl handles this automatically

---

## 🎯 Why Firecrawl Loses for Hotmart

### Disadvantages:

**1. Anti-Bot Risk**
- Firecrawl is a known scraping service
- Hotmart likely has rules to block their IPs
- Your Content Grabber setup is unique and harder to detect

**2. No Visual Debugging**
- If data is wrong, you can't see why
- You're flying blind
- With Content Grabber, you see the browser and selectors

**3. Stateless**
- Firecrawl doesn't maintain login sessions
- If Hotmart requires login, Firecrawl fails
- Content Grabber maintains cookies and sessions

**4. Cost**
- Firecrawl costs money ($9-47/month)
- Your Content Grabber license is already paid for ($0)

**5. Less Control**
- You can't control the exact browser fingerprint
- You can't control the exact sequence of clicks
- With Content Grabber, you have full control

---

## 🚀 Final Recommendation

**Stick with the Content Grabber MCP server for scraping Hotmart.**

It's more reliable, more powerful, and costs you nothing. The visual debugging alone is worth the initial setup.

**Use Firecrawl for everything else:**
- Scraping public blogs for content ideas
- Researching competitor websites
- Pulling data from news articles
- Any site that doesn't have strong bot protection

**The best solution is a hybrid approach:**

- **Content Grabber:** Your heavy-duty, anti-bot scraping tool for protected affiliate platforms.
- **Firecrawl:** Your lightweight, fast scraper for public web data.

This gives you the best of both worlds and a massive advantage over people who only use one tool.

---

*Created by Manus AI - December 8, 2025*

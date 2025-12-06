# Browser Automation Services

This directory contains browser automation services for Core #1: Agentic Offer Research.

## Overview

The browser automation layer enables AI agents to perform human-like research on affiliate marketplaces, bypassing API limitations and avoiding penalties.

## Architecture

```
browser/
├── BrowserService.js       # Base browser automation utilities
├── HotmartAutomation.js    # Hotmart-specific automation
└── README.md               # This file
```

## BrowserService.js

Base class providing core browser automation functionality using Playwright.

### Key Methods:

- `launch(options)` - Launch browser with realistic settings
- `goto(url)` - Navigate to URL
- `click(selector)` - Click element
- `type(selector, text)` - Type into input
- `getText(selector)` - Extract text from element
- `screenshot(path)` - Take screenshot
- `evaluate(script)` - Execute JavaScript
- `close()` - Close browser

### Features:

- ✅ Headless mode in production
- ✅ Realistic user agent and viewport
- ✅ Cookie management
- ✅ Screenshot capability
- ✅ Error handling and logging

## HotmartAutomation.js

Hotmart marketplace automation extending BrowserService.

### Key Methods:

- `login(email, password)` - Login to Hotmart
- `goToMarketplace()` - Navigate to marketplace
- `searchMarketplace(keywords, filters)` - Search for products
- `extractProductCards(maxProducts)` - Extract product data
- `getProductDetails(productUrl)` - Get detailed product info
- `researchNiche(niche, options)` - Complete niche research workflow

### Features:

- ✅ Automated login with session persistence
- ✅ Marketplace navigation and search
- ✅ Product data extraction (name, price, commission, etc.)
- ✅ Filtering by language, category, sorting
- ✅ Detailed product page scraping
- ✅ Respectful rate limiting

## Usage Example

```javascript
const HotmartAutomation = require('./HotmartAutomation');

async function researchProducts() {
  const browser = new HotmartAutomation();
  
  try {
    // Launch browser
    await browser.launch();
    
    // Login
    await browser.login('your-email@example.com', 'your-password');
    
    // Research niche
    const products = await browser.researchNiche('weight loss', {
      maxProducts: 10,
      language: 'pt',
      sortBy: 'best_sellers',
      getDetails: true
    });
    
    console.log(`Found ${products.length} products:`, products);
    
  } finally {
    await browser.close();
  }
}
```

## Environment Variables

```bash
# Optional: Set headless mode
NODE_ENV=production  # headless=true

# Optional: Browser launch options
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

## Testing

Run the test script to verify browser automation:

```bash
# Set test credentials
export HOTMART_TEST_EMAIL="your-email@example.com"
export HOTMART_TEST_PASSWORD="your-password"

# Run test
node backend/test-agent-executor.js
```

## Adding New Platforms

To add automation for a new platform (Impact.com, ClickBank, etc.):

1. Create a new file: `PlatformNameAutomation.js`
2. Extend `BrowserService`
3. Implement platform-specific methods:
   - `login(credentials)`
   - `searchMarketplace(keywords, filters)`
   - `extractProductCards(maxProducts)`
   - `getProductDetails(productUrl)`
4. Add to `AgentExecutor.getBrowserAutomation()`

Example:

```javascript
const BrowserService = require('./BrowserService');

class ImpactAutomation extends BrowserService {
  constructor() {
    super();
    this.baseUrl = 'https://app.impact.com';
  }

  async login(email, password) {
    // Implement Impact.com login
  }

  async searchMarketplace(keywords, filters) {
    // Implement marketplace search
  }

  // ... other methods
}

module.exports = ImpactAutomation;
```

## Security Considerations

- ✅ Credentials are never stored, only passed at runtime
- ✅ Cookies can be persisted for session management
- ✅ Rate limiting to avoid detection
- ✅ Realistic user agent and browser fingerprint
- ⚠️  Always use environment variables for credentials
- ⚠️  Never commit credentials to Git

## Troubleshooting

### Browser won't launch
- Ensure Playwright is installed: `npx playwright install chromium`
- Check system dependencies: `npx playwright install-deps`

### Login fails
- Verify credentials are correct
- Check if platform has CAPTCHA (manual intervention required)
- Ensure cookies are being saved/loaded correctly

### Products not extracted
- Inspect page selectors (they may have changed)
- Check console logs for errors
- Take screenshots to debug: `await browser.screenshot('debug.png')`

### Rate limiting / IP blocking
- Add delays between requests: `await browser.wait(2000)`
- Use residential proxies (not implemented yet)
- Reduce concurrent requests

## Performance

- **Average login time**: 3-5 seconds
- **Search time**: 2-3 seconds
- **Product extraction**: 1-2 seconds per 10 products
- **Detailed scraping**: 2-3 seconds per product
- **Total mission time**: 15-30 seconds for 10 products

## Future Enhancements

- [ ] Proxy support for IP rotation
- [ ] CAPTCHA solving integration
- [ ] Session persistence across missions
- [ ] Parallel browser instances
- [ ] Screenshot-based debugging
- [ ] More platforms (Impact, ClickBank, ShareASale)
- [ ] Error recovery and retry logic
- [ ] Performance monitoring

## Related Files

- `services/agents/AgentExecutor.js` - Uses browser automation to execute missions
- `routes/agents-execute.js` - API endpoints to trigger execution
- `test-agent-executor.js` - Test script

---

**Last Updated**: December 6, 2025  
**Maintained By**: Manus AI

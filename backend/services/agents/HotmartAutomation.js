/**
 * HotmartAutomation - Browser automation for Hotmart marketplace
 * Phase 2: Core browser automation functionality
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class HotmartAutomation {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      slowMo: options.slowMo || 0,
      timeout: options.timeout || 30000,
      ...options
    };
    
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * Initialize the browser instance
   */
  async init() {
    console.log('[HotmartAutomation] Initializing browser...');
    
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    // Create context with realistic browser settings
    // NOTE: Do NOT pass geolocation: null - only include if actually defined
    const contextOptions = {
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/New_York',
      permissions: ['geolocation'],
    };

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    
    // Set default timeout
    this.page.setDefaultTimeout(this.options.timeout);
    
    console.log('[HotmartAutomation] Browser initialized successfully');
    return this;
  }

  /**
   * Login to Hotmart
   */
  async login(email, password) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Logging in to Hotmart...');

    try {
      // STEP 0: Try loading saved cookies first
      const cookiesPath = '/tmp/hotmart_cookies.json';
      try {
        if (fs.existsSync(cookiesPath)) {
          console.log('[HotmartAutomation] Found saved cookies, attempting to use them...');
          const cookies = JSON.parse(fs.readFileSync(cookiesPath, 'utf8'));
          await this.page.context().addCookies(cookies);
          
          // Navigate to dashboard directly
          await this.page.goto('https://app.hotmart.com/dashboard', {
            waitUntil: 'networkidle',
            timeout: 15000
          });
          await this.page.waitForTimeout(3000);
          
          // Check if we're logged in (not on login/sso page)
          const currentUrl = this.page.url();
          if (!currentUrl.includes('login') && !currentUrl.includes('sso.hotmart.com')) {
            console.log('[HotmartAutomation] ✅ Logged in using saved cookies!');
            this.isLoggedIn = true;
            return { success: true, method: 'cookies', url: currentUrl };
          }
          console.log('[HotmartAutomation] Cookies expired, proceeding with fresh login...');
        }
      } catch (e) {
        console.log('[HotmartAutomation] No saved cookies or error loading them:', e.message);
      }

      // Navigate to Hotmart login page
      await this.page.goto('https://app.hotmart.com/login', {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Dismiss cookie consent popup if present
      try {
        await this.page.evaluate(() => {
          const acceptBtn = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent && b.textContent.includes('Accept all'));
          if (acceptBtn) {
            acceptBtn.click();
            console.log('Cookie popup dismissed');
          }
        });
        await this.page.waitForTimeout(1000);
      } catch (e) {
        // Popup might not exist, continue
      }

      // Wait for login form (actual Hotmart selector)
      await this.page.waitForSelector('#username', {
        timeout: 10000
      });

      // Fill email (actual Hotmart selector: #username)
      const emailInput = await this.page.$('#username');
      if (emailInput) {
        await emailInput.fill(email);
      } else {
        throw new Error('Email input not found');
      }

      // Fill password (actual Hotmart selector: #password)
      const passwordInput = await this.page.$('#password');
      if (passwordInput) {
        await passwordInput.fill(password);
      } else {
        throw new Error('Password input not found');
      }

      // Click login button (actual Hotmart selector: form#fm1 button containing "Log in")
      const loginButton = await this.page.$('form#fm1 button:has-text("Log in")');
      if (loginButton) {
        await loginButton.click();
      } else {
        throw new Error('Login button not found');
      }

      // Wait for navigation after login
      await this.page.waitForNavigation({
        waitUntil: 'networkidle',
        timeout: 30000
      }).catch(() => {
        // Navigation might not trigger if already on dashboard
      });

      // Wait a bit for any redirects
      await this.page.waitForTimeout(3000);

      // Check for email verification page
      const verificationUrl = this.page.url();
      const hasVerificationPage = verificationUrl.includes('verification') || 
        verificationUrl.includes('2fa') ||
        await this.page.$('text=Two-step verification').catch(() => null) ||
        await this.page.$('text=verification code').catch(() => null);

      if (hasVerificationPage) {
        console.log('[HotmartAutomation] ⚠️  EMAIL VERIFICATION REQUIRED!');
        console.log('[HotmartAutomation] 📧 Check your email for the 6-digit code');
        console.log('[HotmartAutomation] ⏳ Waiting up to 120 seconds for verification...');
        
        // Wait for user to complete verification and be redirected
        // Use polling instead of waitForURL to ensure we actually wait 120 seconds
        const startTime = Date.now();
        const timeout = 120000; // 120 seconds
        let isVerified = false;
        
        while (Date.now() - startTime < timeout) {
          await this.page.waitForTimeout(2000); // Check every 2 seconds
          
          const currentUrl = this.page.url();
          isVerified = currentUrl.includes('app.hotmart.com') && 
                       !currentUrl.includes('sso') && 
                       !currentUrl.includes('login') &&
                       !currentUrl.includes('verification');
          
          if (isVerified) {
            console.log('[HotmartAutomation] ✅ Verification completed!');
            break;
          }
          
          // Log progress every 10 seconds
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          if (elapsed % 10 === 0 && elapsed > 0) {
            console.log(`[HotmartAutomation] Still waiting for verification... (${elapsed}s elapsed)`);
          }
        }
        
        // Check final URL after timeout
        if (!isVerified) {
          const finalUrl = this.page.url();
          if (finalUrl.includes('verification') || finalUrl.includes('verify')) {
            throw new Error('Email verification timeout - please complete verification within 120 seconds');
          }
        }
      }

      // Check if login was successful by looking for dashboard elements
      const finalUrl = this.page.url();
      if (finalUrl.includes('login') || finalUrl.includes('signin')) {
        // Check for error messages
        const errorMessage = await this.page.$('.error-message, .alert-error, [class*="error"]');
        if (errorMessage) {
          const errorText = await errorMessage.textContent();
          throw new Error(`Login failed: ${errorText}`);
        }
        throw new Error('Login failed: Still on login page');
      }

      // Save cookies for future logins
      try {
        const cookies = await this.page.context().cookies();
        fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
        console.log('[HotmartAutomation] ✅ Cookies saved for future logins!');
      } catch (e) {
        console.log('[HotmartAutomation] Warning: Could not save cookies:', e.message);
      }

      this.isLoggedIn = true;
      console.log('[HotmartAutomation] Login successful');
      
      return {
        success: true,
        url: finalUrl
      };

    } catch (error) {
      console.error('[HotmartAutomation] Login error:', error.message);
      throw error;
    }
  }

  /**
   * Navigate to the Hotmart marketplace
   */
  async navigateToMarketplace() {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Navigating to marketplace...');

    try {
      // Direct navigation to marketplace
      await this.page.goto('https://app.hotmart.com/market', {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for marketplace content to load
      await this.page.waitForSelector('[class*="product"], [class*="card"], [data-testid*="product"]', {
        timeout: 15000
      }).catch(() => {
        console.log('[HotmartAutomation] Product cards not immediately visible, continuing...');
      });

      console.log('[HotmartAutomation] At marketplace');
      return {
        success: true,
        url: this.page.url()
      };

    } catch (error) {
      console.error('[HotmartAutomation] Navigation error:', error.message);
      throw error;
    }
  }

  /**
   * Search for products in the marketplace
   */
  async searchMarketplace(keywords, filters = {}) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Searching for: "${keywords}"`);

    try {
      // Look for search input
      const searchInput = await this.page.$('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"], input[placeholder*="buscar"], input[placeholder*="Buscar"], [class*="search"] input');
      
      if (searchInput) {
        await searchInput.fill('');
        await searchInput.fill(keywords);
        await this.page.keyboard.press('Enter');
      } else {
        // Try URL-based search
        const searchUrl = `https://app.hotmart.com/market?q=${encodeURIComponent(keywords)}`;
        await this.page.goto(searchUrl, {
          waitUntil: 'networkidle',
          timeout: this.options.timeout
        });
      }

      // Wait for results to load
      await this.page.waitForTimeout(3000);

      // Apply filters if provided
      if (filters.language) {
        await this.applyLanguageFilter(filters.language);
      }

      if (filters.sortBy) {
        await this.applySortFilter(filters.sortBy);
      }

      console.log('[HotmartAutomation] Search completed');
      return {
        success: true,
        keywords,
        filters,
        url: this.page.url()
      };

    } catch (error) {
      console.error('[HotmartAutomation] Search error:', error.message);
      throw error;
    }
  }

  /**
   * Apply language filter
   */
  async applyLanguageFilter(language) {
    console.log(`[HotmartAutomation] Applying language filter: ${language}`);
    
    try {
      // Look for language filter dropdown or checkbox
      const languageFilter = await this.page.$(`[data-filter="language"], [class*="language-filter"], button:has-text("${language}")`);
      if (languageFilter) {
        await languageFilter.click();
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      console.log('[HotmartAutomation] Language filter not found or not applicable');
    }
  }

  /**
   * Apply sort filter
   */
  async applySortFilter(sortBy) {
    console.log(`[HotmartAutomation] Applying sort: ${sortBy}`);
    
    try {
      // Look for sort dropdown
      const sortDropdown = await this.page.$('[class*="sort"], [data-sort], select[class*="order"]');
      if (sortDropdown) {
        await sortDropdown.click();
        await this.page.waitForTimeout(500);
        
        // Select sort option
        const sortOption = await this.page.$(`[data-value="${sortBy}"], option[value="${sortBy}"], li:has-text("${sortBy}")`);
        if (sortOption) {
          await sortOption.click();
          await this.page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      console.log('[HotmartAutomation] Sort filter not found or not applicable');
    }
  }

  /**
   * Extract product cards from current page
   * UPDATED: Uses text-based extraction for dynamically rendered content
   */
  async extractProductCards(maxProducts = 10) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Extracting up to ${maxProducts} products...`);

    try {
      // Wait for the page body to be ready
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      // Wait for dynamic content to load
      await this.page.waitForTimeout(3000);

      console.log('[HotmartAutomation] Extracting products using page content analysis...');
      
      // Use page.evaluate to extract data from the rendered page
      const products = await this.page.evaluate((maxCount) => {
        const results = [];
        
        // Find all links on the page
        const allLinks = Array.from(document.querySelectorAll('a'));
        
        // Filter for product links (they contain product info in their text)
        const productLinks = allLinks.filter(link => {
          const text = link.textContent || '';
          // Product cards contain temperature (°), rating (★), and commission text
          return text.includes('°') && 
                 text.includes('Commission') &&
                 text.trim().length > 50; // Substantial content
        });

        console.log(`Found ${productLinks.length} potential product cards`);

        for (let i = 0; i < Math.min(productLinks.length, maxCount); i++) {
          const link = productLinks[i];
          const fullText = link.textContent || '';
          const href = link.getAttribute('href') || '';

          try {
            // Extract product name (usually the longest text before "Commission")
            const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            let productName = '';
            
            for (const line of lines) {
              if (!line.includes('°') && 
                  !line.includes('★') && 
                  !line.includes('Commission') &&
                  !line.includes('Max. price') &&
                  !line.startsWith('$') &&
                  !line.startsWith('€') &&
                  !line.startsWith('R$') &&
                  line.length > 3 &&
                  line.length < 100) {
                productName = line;
                break;
              }
            }

            // Extract temperature (format: "21°" or "150°")
            const tempMatch = fullText.match(/(\d+)°/);
            const temperature = tempMatch ? parseInt(tempMatch[1]) : null;

            // Extract rating (format: "3.8 (8)" or "0 (0)")
            const ratingMatch = fullText.match(/([\d.]+)\s*[★]?\s*\((\d+)\)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
            const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : 0;

            // Extract commission (format: "$2.23" or "€2.20")
            const commissionMatch = fullText.match(/Commission[^$€R]*?([$€R$]+[\d,.]+)/);
            const commission = commissionMatch ? commissionMatch[1] : null;

            // Extract max price (format: "$9.99" or "€5.00")
            const priceMatch = fullText.match(/Max\.\s*price[^$€R]*?([$€R$]+[\d,.]+)/);
            const maxPrice = priceMatch ? priceMatch[1] : null;

            // Extract image
            const img = link.querySelector('img');
            const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src')) : null;

            // Only add if we got a product name
            if (productName) {
              results.push({
                name: productName,
                url: href.startsWith('http') ? href : `https://app.hotmart.com${href}`,
                temperature: temperature,
                rating: rating,
                reviewCount: reviewCount,
                commission: commission,
                price: maxPrice,
                imageUrl: imageUrl,
                category: null // Will be extracted from product details page
              });
            }
          } catch (error) {
            console.log(`Error extracting product ${i}:`, error.message);
          }
        }

        return results;
      }, maxProducts);

      console.log(`[HotmartAutomation] Extracted ${products.length} products`);
      return products;

    } catch (error) {
      console.error('[HotmartAutomation] Extraction error:', error.message);
      return [];
    }
  }

  /**
   * Extract data from a single product element
   * UPDATED: Simplified to work with text content
   */
  async extractProductData(element) {
    try {
      const text = await element.evaluate(el => el.textContent);
      const href = await element.evaluate(el => {
        const link = el.tagName === 'A' ? el : el.querySelector('a');
        return link ? link.getAttribute('href') : null;
      });

      // Parse the text content
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      let productName = '';
      for (const line of lines) {
        if (!line.includes('°') && 
            !line.includes('★') && 
            !line.includes('Commission') &&
            !line.includes('Max. price') &&
            !line.startsWith('$') &&
            !line.startsWith('€') &&
            !line.startsWith('R$') &&
            line.length > 3 &&
            line.length < 100) {
          productName = line;
          break;
        }
      }

      const tempMatch = text.match(/(\d+)°/);
      const temperature = tempMatch ? parseInt(tempMatch[1]) : null;

      const ratingMatch = text.match(/([\d.]+)\s*[★]?\s*\((\d+)\)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : 0;

      const commissionMatch = text.match(/Commission[^$€R]*?([$€R$]+[\d,.]+)/);
      const commission = commissionMatch ? commissionMatch[1] : null;

      const priceMatch = text.match(/Max\.\s*price[^$€R]*?([$€R$]+[\d,.]+)/);
      const maxPrice = priceMatch ? priceMatch[1] : null;

      return {
        name: productName,
        url: href,
        temperature: temperature,
        rating: rating,
        reviewCount: reviewCount,
        commission: commission,
        price: maxPrice,
        category: null,
        imageUrl: null
      };
    } catch (error) {
      console.log('[HotmartAutomation] Error extracting product data:', error.message);
      return null;
    }
  }

  /**
   * Generic product extraction fallback
   */
  async extractProductsGeneric(maxProducts) {
    const products = [];
    
    try {
      // Get all links that might be product links
      const links = await this.page.$$('a[href*="product"], a[href*="/market/"]');
      
      for (let i = 0; i < Math.min(links.length, maxProducts); i++) {
        const link = links[i];
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (text && text.trim().length > 5) {
          products.push({
            name: text.trim().substring(0, 100),
            url: href,
            price: null,
            commission: null,
            category: null,
            rating: null,
            imageUrl: null
          });
        }
      }
    } catch (error) {
      console.log('[HotmartAutomation] Generic extraction error:', error.message);
    }

    return products;
  }

  /**
   * Get detailed information about a specific product
   */
  async getProductDetails(productUrl) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log(`[HotmartAutomation] Getting details for: ${productUrl}`);

    try {
      await this.page.goto(productUrl, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for content to load
      await this.page.waitForTimeout(2000);

      const details = {
        name: null,
        description: null,
        price: null,
        commission: null,
        commissionPercent: null,
        salesPage: null,
        vendor: null,
        category: null,
        rating: null,
        totalSales: null,
        affiliateLink: null,
        url: productUrl
      };

      // Extract name
      const nameEl = await this.page.$('h1, [class*="product-title"], [class*="ProductTitle"]');
      if (nameEl) {
        details.name = (await nameEl.textContent())?.trim();
      }

      // Extract description
      const descEl = await this.page.$('[class*="description"], [class*="Description"], [class*="about"]');
      if (descEl) {
        details.description = (await descEl.textContent())?.trim().substring(0, 500);
      }

      // Extract price
      const priceEl = await this.page.$('[class*="price"], [class*="Price"]');
      if (priceEl) {
        details.price = (await priceEl.textContent())?.trim();
      }

      // Extract commission info
      const commissionEl = await this.page.$('[class*="commission"], [class*="Commission"]');
      if (commissionEl) {
        const commText = (await commissionEl.textContent())?.trim();
        details.commission = commText;
        // Try to extract percentage
        const percentMatch = commText?.match(/(\d+(?:\.\d+)?)\s*%/);
        if (percentMatch) {
          details.commissionPercent = parseFloat(percentMatch[1]);
        }
      }

      // Extract vendor/producer
      const vendorEl = await this.page.$('[class*="vendor"], [class*="Vendor"], [class*="producer"], [class*="Producer"]');
      if (vendorEl) {
        details.vendor = (await vendorEl.textContent())?.trim();
      }

      console.log('[HotmartAutomation] Product details extracted');
      return details;

    } catch (error) {
      console.error('[HotmartAutomation] Error getting product details:', error.message);
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(fullPage = false) {
    if (!this.page) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    console.log('[HotmartAutomation] Taking screenshot...');
    
    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png'
    });

    return screenshot;
  }

  /**
   * Close the browser
   */
  async close() {
    console.log('[HotmartAutomation] Closing browser...');
    
    if (this.page) {
      await this.page.close().catch(() => {});
    }
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
    
    this.page = null;
    this.context = null;
    this.browser = null;
    this.isLoggedIn = false;
    
    console.log('[HotmartAutomation] Browser closed');
  }
}

module.exports = HotmartAutomation;

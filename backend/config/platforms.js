/**
 * Platform Configuration
 * 
 * Defines deterministic authentication checks and marketplace navigation
 * for each affiliate platform.
 * 
 * NON-NEGOTIABLE: Auth is considered valid ONLY if BOTH:
 * - URL condition passes
 * - Selector exists
 */

const PLATFORMS = {
  hotmart: {
    platform: 'hotmart',
    name: 'Hotmart',
    
    // Authentication URLs
    loginUrl: 'https://app-vlc.hotmart.com/login',
    
    // Deterministic auth check (BOTH must pass)
    authCheck: {
      urlIncludes: '/app-vlc.hotmart.com',
      urlExcludes: '/login', // Must NOT be on login page
      selector: '.user-menu, [data-testid="user-menu"], .header-user, .user-avatar',
      selectorDescription: 'User menu or avatar (only exists when logged in)'
    },
    
    // Marketplace navigation
    marketplace: {
      url: 'https://app-vlc.hotmart.com/marketplace',
      readySelector: '.product-card, [data-testid="product"], .offer-item',
      readyDescription: 'Product cards loaded'
    },
    
    // Product extraction selectors
    selectors: {
      productCard: '.product-card, [data-testid="product"], .offer-item',
      name: 'h3, .product-name, .title',
      price: '.price, .product-price',
      commission: '.commission, .commission-rate',
      temperature: '.temperature, .popularity, .gravity'
    },
    
    // Pagination
    pagination: {
      nextButton: '.next-page, [aria-label="Next"], .pagination-next',
      disabledClass: 'disabled'
    }
  },
  
  clickbank: {
    platform: 'clickbank',
    name: 'ClickBank',
    
    loginUrl: 'https://accounts.clickbank.com/login',
    
    authCheck: {
      urlIncludes: '/accounts.clickbank.com',
      urlExcludes: '/login',
      selector: '.user-info, #user-menu, .account-menu',
      selectorDescription: 'User account menu'
    },
    
    marketplace: {
      url: 'https://accounts.clickbank.com/marketplace',
      readySelector: '.product-listing, .offer-row',
      readyDescription: 'Product listings loaded'
    },
    
    selectors: {
      productCard: '.product-listing, .offer-row',
      name: '.product-title, h3',
      price: '.price',
      commission: '.commission',
      temperature: '.gravity'
    },
    
    pagination: {
      nextButton: '.next, [rel="next"]',
      disabledClass: 'disabled'
    }
  },
  
  shareasale: {
    platform: 'shareasale',
    name: 'ShareASale',
    
    loginUrl: 'https://account.shareasale.com/a-login.cfm',
    
    authCheck: {
      urlIncludes: '/account.shareasale.com',
      urlExcludes: '/login',
      selector: '.user-nav, #user-info, .account-info',
      selectorDescription: 'User account navigation'
    },
    
    marketplace: {
      url: 'https://account.shareasale.com/a-merchants.cfm',
      readySelector: '.merchant-row, .program-listing',
      readyDescription: 'Merchant listings loaded'
    },
    
    selectors: {
      productCard: '.merchant-row, .program-listing',
      name: '.merchant-name, h3',
      price: '.commission-info',
      commission: '.commission-rate',
      temperature: '.epc, .earnings-per-click'
    },
    
    pagination: {
      nextButton: '.next-page, [aria-label="Next"]',
      disabledClass: 'disabled'
    }
  }
};

/**
 * Get platform configuration
 */
function getPlatformConfig(platform) {
  const config = PLATFORMS[platform];
  
  if (!config) {
    throw new Error(`Unknown platform: ${platform}. Supported: ${Object.keys(PLATFORMS).join(', ')}`);
  }
  
  return config;
}

/**
 * Verify login using deterministic auth check
 * 
 * Returns true ONLY if BOTH conditions pass:
 * 1. URL matches (includes AND excludes)
 * 2. Selector exists
 */
async function verifyLogin(page, platform) {
  const config = getPlatformConfig(platform);
  const currentUrl = page.url();
  
  // Check URL condition
  const urlIncludesPass = currentUrl.includes(config.authCheck.urlIncludes);
  const urlExcludesPass = !currentUrl.includes(config.authCheck.urlExcludes);
  const urlCheck = urlIncludesPass && urlExcludesPass;
  
  if (!urlCheck) {
    return {
      isLoggedIn: false,
      reason: 'URL_CHECK_FAILED',
      details: {
        currentUrl,
        expectedIncludes: config.authCheck.urlIncludes,
        expectedExcludes: config.authCheck.urlExcludes,
        urlIncludesPass,
        urlExcludesPass
      }
    };
  }
  
  // Check selector exists
  let selectorCheck = false;
  try {
    // Split selector by comma (multiple possible selectors)
    const selectors = config.authCheck.selector.split(',').map(s => s.trim());
    
    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          selectorCheck = true;
          break;
        }
      } catch {
        // Try next selector
      }
    }
  } catch (error) {
    return {
      isLoggedIn: false,
      reason: 'SELECTOR_CHECK_FAILED',
      details: {
        currentUrl,
        expectedSelector: config.authCheck.selector,
        selectorDescription: config.authCheck.selectorDescription,
        error: error.message
      }
    };
  }
  
  if (!selectorCheck) {
    return {
      isLoggedIn: false,
      reason: 'SELECTOR_NOT_FOUND',
      details: {
        currentUrl,
        expectedSelector: config.authCheck.selector,
        selectorDescription: config.authCheck.selectorDescription
      }
    };
  }
  
  // Both checks passed
  return {
    isLoggedIn: true,
    reason: 'AUTH_VERIFIED',
    details: {
      currentUrl,
      urlCheck: true,
      selectorCheck: true
    }
  };
}

/**
 * Get list of supported platforms
 */
function getSupportedPlatforms() {
  return Object.keys(PLATFORMS);
}

module.exports = {
  PLATFORMS,
  getPlatformConfig,
  verifyLogin,
  getSupportedPlatforms
};

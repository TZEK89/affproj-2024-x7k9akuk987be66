// backend/services/scraping/selectors/HotmartSelectors.js

/**
 * Hotmart marketplace selectors
 * These may need updates if Hotmart changes their UI
 */
const HOTMART_SELECTORS = {
  // Product card container
  productCard: '[data-testid="product-card"], .product-card, .sc-product-card',

  // Inside each card
  name: '[data-testid="product-name"], .product-name, h3, h4',
  price: '[data-testid="product-price"], .product-price, .price',
  image: 'img[data-testid="product-image"], .product-image img, img',
  link: 'a[data-testid="product-link"], a.product-link, a',
  description: '[data-testid="product-description"], .product-description, p',
  category: '[data-testid="product-category"], .product-category, .category',
  temperature: '[data-testid="temperature"], .temperature, .temp-score',

  // Pagination / Load more
  loadMore: '[data-testid="load-more"], button.load-more, .load-more-btn',
  nextPage: '[data-testid="next-page"], a.next, .pagination-next',

  // Alternative selectors (fallbacks)
  alternativeSelectors: {
    productCard: [
      '[class*="ProductCard"]',
      '[class*="product-item"]',
      'article[class*="product"]',
      '.marketplace-product',
      '[class*="Card__"]',
      '[class*="styles__Product"]'
    ],
    name: [
      '[class*="ProductName"]',
      '[class*="title"]',
      '.product-title',
      '[class*="Name__"]'
    ],
    price: [
      '[class*="Price"]',
      '[class*="price"]',
      '.amount',
      '[class*="Value__"]'
    ]
  }
};

/**
 * ClickBank marketplace selectors
 */
const CLICKBANK_SELECTORS = {
  productCard: '.product-listing, .cb-product, [data-product-id]',
  name: '.product-title, h3, h4',
  price: '.product-price, .price',
  image: 'img',
  link: 'a',
  description: '.product-description, p',
  gravity: '.gravity-value, [class*="gravity"]',

  alternativeSelectors: {
    productCard: [
      '[class*="product-card"]',
      '.listing-item'
    ]
  }
};

/**
 * JVZoo marketplace selectors
 */
const JVZOO_SELECTORS = {
  productCard: '.product-item, .jvzoo-product',
  name: '.product-name, h3',
  price: '.product-price, .price',
  image: 'img',
  link: 'a',
  description: '.description',

  alternativeSelectors: {
    productCard: [
      '[class*="product"]'
    ]
  }
};

/**
 * Get selectors for a platform
 */
function getSelectorsForPlatform(platform) {
  switch (platform?.toLowerCase()) {
    case 'hotmart':
      return HOTMART_SELECTORS;
    case 'clickbank':
      return CLICKBANK_SELECTORS;
    case 'jvzoo':
      return JVZOO_SELECTORS;
    default:
      return HOTMART_SELECTORS;
  }
}

/**
 * Get the best working selector for a field
 */
async function findWorkingSelector(page, field, selectors) {
  const candidates = [
    selectors[field],
    ...(selectors.alternativeSelectors?.[field] || [])
  ].filter(Boolean);

  for (const selector of candidates) {
    try {
      const count = await page.locator(selector).count();
      if (count > 0) {
        return selector;
      }
    } catch (e) {
      // Selector invalid, try next
    }
  }
  return null;
}

module.exports = {
  HOTMART_SELECTORS,
  CLICKBANK_SELECTORS,
  JVZOO_SELECTORS,
  getSelectorsForPlatform,
  findWorkingSelector
};

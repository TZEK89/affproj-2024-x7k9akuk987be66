// backend/services/marketplace/PlatformPresets.js

/**
 * Platform configurations for known marketplaces
 * Used to auto-fill URLs and provide category options
 */
const PLATFORM_PRESETS = {
  hotmart: {
    name: 'Hotmart',
    icon: '/icons/hotmart.svg',
    description: 'Digital products marketplace with instant approval',
    languages: [
      { code: 'en', name: 'English', url: 'https://hotmart.com/en/marketplace' },
      { code: 'pt-br', name: 'Portuguese (Brazil)', url: 'https://hotmart.com/pt-br/marketplace' },
      { code: 'es', name: 'Spanish', url: 'https://hotmart.com/es/marketplace' },
      { code: 'fr', name: 'French', url: 'https://hotmart.com/fr/marketplace' },
      { code: 'de', name: 'German', url: 'https://hotmart.com/de/marketplace' },
      { code: 'it', name: 'Italian', url: 'https://hotmart.com/it/marketplace' },
      { code: 'nl', name: 'Dutch', url: 'https://hotmart.com/nl/marketplace' },
      { code: 'ja', name: 'Japanese', url: 'https://hotmart.com/ja/marketplace' }
    ],
    categories: [
      { id: 'health-and-sports', name: 'Health & Sports' },
      { id: 'business-and-career', name: 'Business & Career' },
      { id: 'education', name: 'Education' },
      { id: 'relationships', name: 'Relationships' },
      { id: 'finance-and-investment', name: 'Finance & Investment' },
      { id: 'internet', name: 'Internet & Marketing' },
      { id: 'apps-and-software', name: 'Apps & Software' },
      { id: 'entertainment', name: 'Entertainment' },
      { id: 'spirituality', name: 'Spirituality' },
      { id: 'cooking-and-gastronomy', name: 'Cooking & Gastronomy' }
    ],
    urlBuilder: (language, category) => {
      let url = `https://hotmart.com/${language}/marketplace`;
      if (category) {
        url += `?q=&category=${category}`;
      }
      return url;
    }
  },

  clickbank: {
    name: 'ClickBank',
    icon: '/icons/clickbank.svg',
    description: 'Global affiliate marketplace with high commissions',
    languages: [
      { code: 'en', name: 'English', url: 'https://www.clickbank.com/marketplace' }
    ],
    categories: [
      { id: 'health-fitness', name: 'Health & Fitness' },
      { id: 'e-business-e-marketing', name: 'E-Business & E-Marketing' },
      { id: 'self-help', name: 'Self-Help' },
      { id: 'spirituality-new-age', name: 'Spirituality & New Age' },
      { id: 'home-garden', name: 'Home & Garden' },
      { id: 'parenting-families', name: 'Parenting & Families' },
      { id: 'sports', name: 'Sports' },
      { id: 'cooking-food-wine', name: 'Cooking, Food & Wine' }
    ],
    urlBuilder: (language, category) => {
      let url = 'https://www.clickbank.com/marketplace';
      if (category) {
        url += `/${category}`;
      }
      return url;
    }
  },

  jvzoo: {
    name: 'JVZoo',
    icon: '/icons/jvzoo.svg',
    description: 'Digital product marketplace focused on launches',
    languages: [
      { code: 'en', name: 'English', url: 'https://www.jvzoo.com/products' }
    ],
    categories: [],
    urlBuilder: (language, category) => 'https://www.jvzoo.com/products'
  },

  custom: {
    name: 'Custom',
    icon: '/icons/custom.svg',
    description: 'Add any marketplace URL',
    languages: [],
    categories: [],
    urlBuilder: () => ''
  }
};

/**
 * Available scraper types and their configurations
 */
const SCRAPER_TYPES = [
  {
    type: 'playwright',
    name: 'Built-in (Playwright)',
    description: 'Free built-in browser automation. Good for basic scraping.',
    requiresApiKey: false,
    requiresAgent: false,
    configFields: [],
    supportedFeatures: ['basic', 'pagination', 'scroll', 'screenshots'],
    limitations: ['May be blocked by anti-bot systems', 'Slower for large scrapes']
  },
  {
    type: 'brightdata',
    name: 'Bright Data',
    description: 'Enterprise proxy network with anti-bot bypass. Best for scale.',
    requiresApiKey: true,
    requiresAgent: false,
    configFields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true },
      { name: 'zone', label: 'Zone', type: 'text', required: false },
      { name: 'country', label: 'Country Code', type: 'text', required: false }
    ],
    supportedFeatures: ['proxy_rotation', 'captcha_solving', 'residential_ips', 'scale'],
    limitations: ['Paid service', 'Requires account setup']
  },
  {
    type: 'firecrawl',
    name: 'Firecrawl',
    description: 'AI-powered web scraping API with structured data extraction.',
    requiresApiKey: true,
    requiresAgent: false,
    configFields: [
      { name: 'apiKey', label: 'API Key', type: 'password', required: true }
    ],
    supportedFeatures: ['ai_extraction', 'markdown_output', 'screenshot', 'pdf'],
    limitations: ['Rate limited on free tier', 'Token-based pricing']
  },
  {
    type: 'agentic',
    name: 'AI Agent (Experimental)',
    description: 'LLM-directed scraping with self-healing. Most flexible but slower.',
    requiresApiKey: false,
    requiresAgent: true,
    configFields: [],
    supportedFeatures: ['self_healing', 'dynamic_selectors', 'intelligent_navigation', 'adaptation'],
    limitations: ['Requires AI agent configured', 'Higher latency', 'Uses LLM tokens']
  }
];

module.exports = {
  PLATFORM_PRESETS,
  SCRAPER_TYPES,
  getPlatformPreset: (platform) => PLATFORM_PRESETS[platform] || PLATFORM_PRESETS.custom,
  getScraperType: (type) => SCRAPER_TYPES.find(s => s.type === type),
  getAllPlatforms: () => Object.keys(PLATFORM_PRESETS).map(key => ({
    key,
    ...PLATFORM_PRESETS[key]
  })),
  getAllScraperTypes: () => SCRAPER_TYPES
};

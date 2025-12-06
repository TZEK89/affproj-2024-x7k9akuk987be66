/**
 * Agent Dispatcher
 * 
 * The Agent Dispatcher is the bridge between the orchestration layer (job queue)
 * and the execution layer (browser automation). It handles:
 * 
 * 1. Prompt Analysis: Understanding what the user wants to research
 * 2. Agent Selection: Choosing which AI agents to deploy
 * 3. Mission Execution: Running agents in parallel or sequence
 * 4. Result Aggregation: Combining results from multiple agents
 * 
 * This module is designed to work with different execution backends:
 * - BrowserAutomation: Uses Playwright for human-like web interaction
 * - API-based: Uses platform APIs when available and appropriate
 * - Hybrid: Combines both approaches for best results
 * 
 * Architecture Note:
 * The Dispatcher sends high-level commands to Agent Executors.
 * Each Executor controls a browser instance and performs the actual research.
 * This separation allows for:
 * - Horizontal scaling (multiple executors)
 * - Different executor implementations per platform
 * - Easy testing and mocking
 */

const AIService = require('../services/ai/AIService');

// Supported platforms and their capabilities
const PLATFORM_CONFIG = {
  hotmart: {
    name: 'Hotmart',
    supportsApi: true,  // Has API for some operations
    requiresBrowser: true,  // Marketplace browsing needs browser
    loginRequired: true,
    baseUrl: 'https://app.hotmart.com',
    marketplaceUrl: 'https://app.hotmart.com/market',
    searchUrl: 'https://app.hotmart.com/market/search'
  },
  impact: {
    name: 'Impact.com',
    supportsApi: true,
    requiresBrowser: false,  // Can mostly use API
    loginRequired: true,
    baseUrl: 'https://app.impact.com',
    catalogUrl: 'https://app.impact.com/advertiser-discover'
  },
  clickbank: {
    name: 'ClickBank',
    supportsApi: true,
    requiresBrowser: true,
    loginRequired: true,
    baseUrl: 'https://accounts.clickbank.com',
    marketplaceUrl: 'https://www.clickbank.com/marketplace'
  },
  shareasale: {
    name: 'ShareASale',
    supportsApi: true,
    requiresBrowser: true,
    loginRequired: true,
    baseUrl: 'https://account.shareasale.com',
    merchantUrl: 'https://account.shareasale.com/a-merchantsearchsales.cfm'
  }
};

// Agent configurations
const AGENT_CONFIG = {
  manus: {
    name: 'Manus AI',
    provider: 'manus',
    capabilities: ['research', 'analysis', 'comparison', 'strategy'],
    model: 'gpt-4.1-mini',
    strengths: ['Speed', 'Multi-step reasoning', 'Tool use'],
    maxConcurrentTasks: 3
  },
  claude: {
    name: 'Claude',
    provider: 'openai', // Using OpenAI-compatible endpoint for now
    capabilities: ['research', 'analysis', 'comparison', 'detailed_review'],
    model: 'gpt-4',
    strengths: ['Thoroughness', 'Nuanced analysis', 'Long context'],
    maxConcurrentTasks: 2
  },
  gpt: {
    name: 'GPT-4',
    provider: 'openai',
    capabilities: ['research', 'quick_scan', 'categorization'],
    model: 'gpt-4-turbo-preview',
    strengths: ['Speed', 'Broad knowledge', 'Categorization'],
    maxConcurrentTasks: 3
  }
};

class AgentDispatcher {
  /**
   * Create a new Agent Dispatcher
   * 
   * @param {Object} config - Mission configuration
   * @param {number} config.missionId - Database ID of the mission
   * @param {string} config.platform - Target platform (hotmart, impact, etc.)
   * @param {string} config.prompt - User's research prompt
   * @param {string[]} config.agents - List of agents to use
   * @param {Object} config.parameters - Additional parameters
   * @param {Function} config.onProgress - Progress callback (progress, message)
   * @param {Function} config.onLog - Log callback (agentName, action, details, level)
   */
  constructor(config) {
    this.missionId = config.missionId;
    this.platform = config.platform;
    this.prompt = config.prompt;
    this.agents = config.agents || ['claude'];
    this.parameters = config.parameters || {};
    this.onProgress = config.onProgress || (() => {});
    this.onLog = config.onLog || (() => {});
    
    // Get platform configuration
    this.platformConfig = PLATFORM_CONFIG[this.platform.toLowerCase()];
    if (!this.platformConfig) {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
    
    // AI service for prompt analysis and result processing
    this.aiService = new AIService();
    
    // Results storage
    this.agentResults = {};
    this.allProducts = [];
  }
  
  /**
   * Execute the mission
   * This is the main entry point called by the mission processor
   * 
   * @returns {Promise<Object>} Mission results
   */
  async execute() {
    await this.onLog('dispatcher', 'execute_start', 
      `Starting mission for ${this.platform} with agents: ${this.agents.join(', ')}`);
    
    // Step 1: Analyze the prompt to understand what we need to do
    const missionPlan = await this.analyzeMissionPrompt();
    await this.onProgress(20, 'Mission plan created');
    
    // Step 2: Prepare the execution context
    const context = await this.prepareExecutionContext(missionPlan);
    await this.onProgress(30, 'Execution context prepared');
    
    // Step 3: Execute with selected agents
    if (this.agents.length > 1) {
      // A/B testing mode - run agents in parallel
      await this.executeParallel(context, missionPlan);
    } else {
      // Single agent mode
      await this.executeSingle(context, missionPlan);
    }
    await this.onProgress(70, 'Agent execution completed');
    
    // Step 4: Aggregate and deduplicate results
    const aggregatedResults = await this.aggregateResults();
    await this.onProgress(75, 'Results aggregated');
    
    // Step 5: Score and rank products
    const scoredProducts = await this.scoreProducts(aggregatedResults.products);
    await this.onProgress(78, 'Products scored');
    
    // Step 6: Generate summary
    const summary = await this.generateSummary(scoredProducts);
    
    await this.onLog('dispatcher', 'execute_complete',
      `Mission completed. Found ${scoredProducts.length} unique products.`);
    
    return {
      products: scoredProducts,
      agentResults: this.agentResults,
      summary
    };
  }
  
  /**
   * Analyze the user's prompt to create a mission plan
   * Uses AI to understand the intent and extract parameters
   * 
   * @returns {Promise<Object>} Mission plan
   */
  async analyzeMissionPrompt() {
    await this.onLog('dispatcher', 'analyze_prompt', `Analyzing prompt: "${this.prompt}"`);
    
    const analysisPrompt = `Analyze this affiliate marketing research request and extract the key parameters.

Request: "${this.prompt}"

Extract and return a JSON object with:
1. action: The main action (search, compare, analyze, discover)
2. niche: The target niche/category (e.g., "weight loss", "fitness", "finance")
3. keywords: Array of search keywords to use
4. filters: Any filters mentioned (price range, commission rate, etc.)
5. quantity: How many products to find (default 10)
6. language: Target language/market (default "en")
7. sortBy: How to sort results (default "relevance")
8. additionalCriteria: Any other specific requirements

Return ONLY valid JSON, no explanation.`;

    try {
      const response = await this.aiService.chat({
        provider: 'manus',
        messages: [{ role: 'user', content: analysisPrompt }],
        options: { temperature: 0.3 }
      });
      
      // Parse the AI response
      const plan = JSON.parse(response.content);
      
      // Apply defaults
      return {
        action: plan.action || 'search',
        niche: plan.niche || this.extractNicheFromPrompt(),
        keywords: plan.keywords || [],
        filters: plan.filters || {},
        quantity: plan.quantity || 10,
        language: plan.language || this.parameters.language || 'en',
        sortBy: plan.sortBy || 'relevance',
        additionalCriteria: plan.additionalCriteria || [],
        originalPrompt: this.prompt
      };
    } catch (error) {
      await this.onLog('dispatcher', 'analyze_prompt_fallback', 
        `AI analysis failed, using fallback: ${error.message}`, 'warning');
      
      // Fallback to simple extraction
      return {
        action: 'search',
        niche: this.extractNicheFromPrompt(),
        keywords: this.extractKeywordsFromPrompt(),
        filters: {},
        quantity: 10,
        language: this.parameters.language || 'en',
        sortBy: 'relevance',
        additionalCriteria: [],
        originalPrompt: this.prompt
      };
    }
  }
  
  /**
   * Simple niche extraction from prompt (fallback)
   */
  extractNicheFromPrompt() {
    const nichePatterns = [
      /(?:in the |about |for )([\w\s]+?) (?:niche|market|category|space)/i,
      /(?:research|find|search|discover) ([\w\s]+?) products/i,
      /(weight loss|fitness|health|finance|crypto|dating|self-help|business)/i
    ];
    
    for (const pattern of nichePatterns) {
      const match = this.prompt.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'general';
  }
  
  /**
   * Extract keywords from prompt (fallback)
   */
  extractKeywordsFromPrompt() {
    // Remove common words and extract meaningful terms
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'find', 'search', 'research', 'discover', 'products', 'marketplace'];
    
    const words = this.prompt.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));
    
    // Return unique words
    return [...new Set(words)];
  }
  
  /**
   * Prepare the execution context for agents
   * This includes credentials, browser config, etc.
   * 
   * @param {Object} missionPlan - The analyzed mission plan
   * @returns {Promise<Object>} Execution context
   */
  async prepareExecutionContext(missionPlan) {
    await this.onLog('dispatcher', 'prepare_context', 
      `Preparing execution context for ${this.platform}`);
    
    // The context object that will be passed to agent executors
    return {
      platform: this.platform,
      platformConfig: this.platformConfig,
      missionPlan,
      credentials: await this.getCredentials(),
      browserConfig: {
        headless: process.env.NODE_ENV === 'production',
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        timeout: 30000
      },
      searchStrategy: this.determineSearchStrategy(missionPlan),
      rateLimit: {
        requestsPerMinute: 20,
        delayBetweenActions: 2000  // 2 seconds between actions
      }
    };
  }
  
  /**
   * Get credentials for the platform
   * In production, these would come from encrypted storage
   */
  async getCredentials() {
    // TODO: Implement secure credential retrieval
    // For now, return placeholder
    return {
      username: process.env[`${this.platform.toUpperCase()}_USERNAME`],
      password: process.env[`${this.platform.toUpperCase()}_PASSWORD`],
      // API credentials as backup
      apiKey: process.env[`${this.platform.toUpperCase()}_API_KEY`],
      apiSecret: process.env[`${this.platform.toUpperCase()}_API_SECRET`]
    };
  }
  
  /**
   * Get a random user agent to avoid detection
   */
  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }
  
  /**
   * Determine the best search strategy based on the mission plan
   */
  determineSearchStrategy(missionPlan) {
    const { action, quantity, filters } = missionPlan;
    
    if (action === 'compare') {
      return {
        type: 'deep',
        pagesPerSearch: 3,
        productsPerPage: 20,
        includeDetails: true
      };
    } else if (action === 'discover') {
      return {
        type: 'broad',
        pagesPerSearch: 5,
        productsPerPage: 50,
        includeDetails: false
      };
    } else {
      return {
        type: 'standard',
        pagesPerSearch: 2,
        productsPerPage: Math.min(quantity, 30),
        includeDetails: true
      };
    }
  }
  
  /**
   * Execute mission with a single agent
   */
  async executeSingle(context, missionPlan) {
    const agentName = this.agents[0];
    const agentConfig = AGENT_CONFIG[agentName];
    
    if (!agentConfig) {
      throw new Error(`Unknown agent: ${agentName}`);
    }
    
    await this.onLog(agentName, 'execute_start', 
      `Starting ${agentConfig.name} agent execution`);
    
    try {
      const result = await this.runAgentExecutor(agentName, context, missionPlan);
      this.agentResults[agentName] = result;
      this.allProducts.push(...(result.products || []));
      
      await this.onLog(agentName, 'execute_complete',
        `Agent found ${result.products?.length || 0} products`);
    } catch (error) {
      await this.onLog(agentName, 'execute_error', error.message, 'error');
      this.agentResults[agentName] = { error: error.message, products: [] };
    }
  }
  
  /**
   * Execute mission with multiple agents in parallel (A/B testing)
   */
  async executeParallel(context, missionPlan) {
    await this.onLog('dispatcher', 'parallel_start',
      `Starting parallel execution with ${this.agents.length} agents`);
    
    const promises = this.agents.map(async (agentName) => {
      const agentConfig = AGENT_CONFIG[agentName];
      
      if (!agentConfig) {
        await this.onLog(agentName, 'skip', `Unknown agent: ${agentName}`, 'warning');
        return { agentName, error: 'Unknown agent', products: [] };
      }
      
      try {
        await this.onLog(agentName, 'execute_start',
          `Starting ${agentConfig.name} agent execution`);
        
        const result = await this.runAgentExecutor(agentName, context, missionPlan);
        
        await this.onLog(agentName, 'execute_complete',
          `Agent found ${result.products?.length || 0} products`);
        
        return { agentName, ...result };
      } catch (error) {
        await this.onLog(agentName, 'execute_error', error.message, 'error');
        return { agentName, error: error.message, products: [] };
      }
    });
    
    const results = await Promise.all(promises);
    
    for (const result of results) {
      this.agentResults[result.agentName] = result;
      if (result.products) {
        this.allProducts.push(...result.products);
      }
    }
    
    await this.onLog('dispatcher', 'parallel_complete',
      `All agents completed. Total products before dedup: ${this.allProducts.length}`);
  }
  
  /**
   * Run a specific agent executor
   * This is where the actual browser automation would be invoked
   * 
   * @param {string} agentName - Name of the agent
   * @param {Object} context - Execution context
   * @param {Object} missionPlan - Mission plan
   * @returns {Promise<Object>} Agent results
   */
  async runAgentExecutor(agentName, context, missionPlan) {
    // Get the appropriate executor based on platform and agent
    const executor = await this.getExecutor(agentName, context.platform);
    
    if (!executor) {
      // Fallback to mock/simulation mode for development
      return this.runMockExecutor(agentName, context, missionPlan);
    }
    
    return executor.execute(context, missionPlan);
  }
  
  /**
   * Get the executor instance for the given agent and platform
   * The execution layer (browser automation) is built by Manus
   */
  async getExecutor(agentName, platform) {
    try {
      // Try to load the platform-specific executor
      // This will be implemented in the execution layer
      const ExecutorClass = require(`../executors/${platform}Executor`);
      return new ExecutorClass(agentName);
    } catch (error) {
      // Executor not available yet
      await this.onLog('dispatcher', 'executor_not_found',
        `Executor for ${platform} not available, using mock mode`, 'warning');
      return null;
    }
  }
  
  /**
   * Mock executor for development and testing
   * Simulates what the real executor would return
   */
  async runMockExecutor(agentName, context, missionPlan) {
    await this.onLog(agentName, 'mock_start',
      'Running in mock mode (executor not implemented yet)');
    
    // Simulate some delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock products based on the mission plan
    const mockProducts = [];
    const quantity = Math.min(missionPlan.quantity, 5);
    
    for (let i = 0; i < quantity; i++) {
      mockProducts.push({
        id: `mock-${agentName}-${Date.now()}-${i}`,
        externalId: `${context.platform}-${1000 + i}`,
        platform: context.platform,
        name: `${missionPlan.niche} Product ${i + 1} (Mock)`,
        description: `This is a mock product for testing. Niche: ${missionPlan.niche}`,
        price: (Math.random() * 200 + 50).toFixed(2),
        currency: 'USD',
        commissionRate: (Math.random() * 50 + 10).toFixed(1),
        commissionType: 'percentage',
        category: missionPlan.niche,
        niche: missionPlan.niche,
        productUrl: `https://${context.platform}.com/product/${1000 + i}`,
        imageUrl: `https://via.placeholder.com/300x200?text=${missionPlan.niche}+${i + 1}`,
        metadata: {
          discoveredBy: agentName,
          mockData: true,
          searchKeywords: missionPlan.keywords
        }
      });
    }
    
    await this.onLog(agentName, 'mock_complete',
      `Mock executor generated ${mockProducts.length} products`);
    
    return {
      products: mockProducts,
      stats: {
        pagesSearched: 2,
        productsScanned: 20,
        executionTime: 2000
      }
    };
  }
  
  /**
   * Aggregate results from all agents
   * Deduplicates products found by multiple agents
   */
  async aggregateResults() {
    await this.onLog('dispatcher', 'aggregate_start',
      `Aggregating ${this.allProducts.length} products from ${Object.keys(this.agentResults).length} agents`);
    
    // Deduplicate by external ID
    const productMap = new Map();
    
    for (const product of this.allProducts) {
      const key = product.externalId || `${product.platform}-${product.name}`;
      
      if (productMap.has(key)) {
        // Merge additional info from duplicate
        const existing = productMap.get(key);
        existing.foundByAgents = existing.foundByAgents || [];
        existing.foundByAgents.push(product.metadata?.discoveredBy);
        
        // Multiple agents found this = higher confidence
        existing.confidenceBoost = (existing.confidenceBoost || 0) + 0.1;
      } else {
        product.foundByAgents = [product.metadata?.discoveredBy];
        productMap.set(key, product);
      }
    }
    
    const uniqueProducts = Array.from(productMap.values());
    
    await this.onLog('dispatcher', 'aggregate_complete',
      `Deduplicated to ${uniqueProducts.length} unique products`);
    
    return {
      products: uniqueProducts,
      duplicatesRemoved: this.allProducts.length - uniqueProducts.length
    };
  }
  
  /**
   * Score products using AI analysis
   */
  async scoreProducts(products) {
    if (products.length === 0) {
      return [];
    }
    
    await this.onLog('dispatcher', 'scoring_start',
      `Scoring ${products.length} products`);
    
    // Score each product
    const scoredProducts = await Promise.all(products.map(async (product) => {
      try {
        const score = await this.calculateProductScore(product);
        return { ...product, aiScore: score.total, aiAnalysis: score };
      } catch (error) {
        // Default score if AI fails
        return { 
          ...product, 
          aiScore: 50, 
          aiAnalysis: { error: error.message } 
        };
      }
    }));
    
    // Sort by score descending
    scoredProducts.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    
    await this.onLog('dispatcher', 'scoring_complete',
      `Scoring complete. Top score: ${scoredProducts[0]?.aiScore}`);
    
    return scoredProducts;
  }
  
  /**
   * Calculate AI score for a product
   */
  async calculateProductScore(product) {
    // Base score components
    const scores = {
      commissionRate: 0,
      pricePoint: 0,
      confidence: 0,
      nicheFit: 0
    };
    
    // Commission rate score (0-30 points)
    const commRate = parseFloat(product.commissionRate) || 0;
    scores.commissionRate = Math.min(commRate * 0.6, 30);
    
    // Price point score (0-20 points) - moderate prices often convert better
    const price = parseFloat(product.price) || 0;
    if (price >= 30 && price <= 200) {
      scores.pricePoint = 20;
    } else if (price < 30) {
      scores.pricePoint = 10;
    } else {
      scores.pricePoint = 15;
    }
    
    // Confidence boost from multiple agents (0-20 points)
    const agentCount = product.foundByAgents?.length || 1;
    scores.confidence = Math.min(agentCount * 10, 20) + (product.confidenceBoost || 0) * 10;
    
    // Niche fit (0-30 points) - would use AI in production
    scores.nicheFit = 20;  // Default moderate fit
    
    const total = Math.min(
      scores.commissionRate + scores.pricePoint + scores.confidence + scores.nicheFit,
      100
    );
    
    return {
      total: Math.round(total),
      breakdown: scores,
      factors: {
        commissionRate: `${commRate}% commission`,
        pricePoint: `$${price} price`,
        multiAgentConfirm: `Found by ${agentCount} agent(s)`
      }
    };
  }
  
  /**
   * Generate a summary of the mission results
   */
  async generateSummary(products) {
    if (products.length === 0) {
      return {
        message: 'No products found matching the criteria.',
        recommendations: ['Try broader search terms', 'Check different niches']
      };
    }
    
    const topProducts = products.slice(0, 3);
    const avgScore = products.reduce((sum, p) => sum + (p.aiScore || 0), 0) / products.length;
    const avgCommission = products.reduce((sum, p) => sum + (parseFloat(p.commissionRate) || 0), 0) / products.length;
    
    return {
      message: `Found ${products.length} products with an average AI score of ${avgScore.toFixed(1)}`,
      stats: {
        totalProducts: products.length,
        averageScore: avgScore.toFixed(1),
        averageCommission: `${avgCommission.toFixed(1)}%`,
        topScore: products[0]?.aiScore || 0,
        agentsUsed: Object.keys(this.agentResults)
      },
      topRecommendations: topProducts.map(p => ({
        name: p.name,
        score: p.aiScore,
        commission: p.commissionRate,
        reason: p.aiAnalysis?.factors ? Object.values(p.aiAnalysis.factors).join(', ') : 'Good overall score'
      })),
      recommendations: [
        'Review the top-scored products for affiliate partnership',
        'Consider testing multiple products in your campaigns',
        'Monitor conversion rates after promoting'
      ]
    };
  }
}

module.exports = AgentDispatcher;

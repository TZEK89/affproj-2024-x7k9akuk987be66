/**
 * Agentic Scraping Service
 * 
 * This service enables AI agents to intelligently scrape affiliate marketplaces
 * using dynamic tool selection (Firecrawl, Playwright, Bright Data).
 * 
 * Key Features:
 * - AI decides which scraping tool to use
 * - Adapts to page structure changes
 * - Learns successful patterns
 * - Handles authentication via saved sessions
 */

const { supabase } = require('../config/supabase');
const manusBrowserController = require('./manus-browser-controller');

class AgenticScraper {
  constructor() {
    this.strategies = new Map(); // Stores learned scraping strategies
  }

  /**
   * Create a new scraping mission
   * This is called when user wants to discover products from a platform
   */
  async createMission(userId, platformId, goal, constraints = {}) {
    try {
      // Check if platform is connected
      const { data: connection, error: connError } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('platform_id', platformId)
        .eq('status', 'connected')
        .single();

      if (connError || !connection) {
        throw new Error(`Platform ${platformId} is not connected. Please connect first.`);
      }

      // Create mission in database
      const { data: mission, error: missionError } = await supabase
        .from('scraping_missions')
        .insert({
          user_id: userId,
          platform_id: platformId,
          goal,
          constraints: constraints || {},
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (missionError) throw missionError;

      return {
        success: true,
        mission: {
          id: mission.id,
          platformId: mission.platform_id,
          goal: mission.goal,
          status: mission.status,
          instructions: this.generateMissionInstructions(mission, connection)
        }
      };
    } catch (error) {
      console.error('Error creating scraping mission:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate instructions for Manus to execute the mission
   */
  generateMissionInstructions(mission, connection) {
    const platformConfig = manusBrowserController.getPlatformConfig(mission.platform_id);

    return {
      missionId: mission.id,
      platform: platformConfig.name,
      goal: mission.goal,
      
      // Step 1: Load saved session
      step1: {
        action: 'load_session',
        description: 'Load encrypted session from database',
        command: `curl ${process.env.BACKEND_URL || 'https://affiliate-backend-production-df21.up.railway.app'}/api/agentic-scraper/session/${connection.id}`
      },

      // Step 2: Decide scraping strategy
      step2: {
        action: 'analyze_and_decide',
        description: 'AI analyzes the marketplace and decides which tool to use',
        options: [
          {
            tool: 'firecrawl',
            when: 'Page is static HTML or has good semantic structure',
            pros: 'Fast, cost-effective, handles pagination well',
            cons: 'May miss dynamic content'
          },
          {
            tool: 'playwright',
            when: 'Page has dynamic content, requires interaction, or complex navigation',
            pros: 'Full browser control, handles JavaScript, can interact',
            cons: 'Slower, more expensive'
          },
          {
            tool: 'bright_data',
            when: 'Need to bypass anti-bot measures or scrape at scale',
            pros: 'Residential proxies, CAPTCHA solving, high success rate',
            cons: 'Most expensive option'
          }
        ],
        decision_prompt: `
You are an intelligent scraping agent. Analyze ${platformConfig.name} marketplace and decide:

1. Which tool should I use? (firecrawl, playwright, or bright_data)
2. What selectors/patterns should I use to extract products?
3. How should I handle pagination?
4. What rate limits should I respect?

Platform: ${platformConfig.name}
Goal: ${mission.goal}
Marketplace URL: ${platformConfig.marketplaceUrl}

Respond with a JSON strategy:
{
  "tool": "firecrawl|playwright|bright_data",
  "reasoning": "why this tool is best",
  "selectors": {
    "productCard": "CSS selector for product cards",
    "title": "selector for product title",
    "price": "selector for price",
    "commission": "selector for commission rate",
    "url": "selector for product URL"
  },
  "pagination": {
    "method": "click_next|url_pattern|infinite_scroll",
    "selector": "selector for next button or pattern"
  },
  "rateLimit": {
    "requestsPerMinute": 10,
    "delayBetweenPages": 2000
  }
}
`
      },

      // Step 3: Execute scraping
      step3: {
        action: 'execute_scraping',
        description: 'Execute the chosen strategy',
        
        firecrawl_example: {
          tool: 'firecrawl-mcp',
          command: 'manus-mcp-cli tool call scrape --server firecrawl --input \'{"url": "MARKETPLACE_URL", "formats": ["markdown", "html"], "onlyMainContent": true}\'',
          extract: 'Parse the markdown/HTML to extract product data using the selectors from step 2'
        },

        playwright_example: {
          tool: 'playwright-mcp',
          commands: [
            'manus-mcp-cli tool call browser_navigate --server playwright --input \'{"url": "MARKETPLACE_URL", "cookies": "FROM_SESSION"}\'',
            'manus-mcp-cli tool call browser_evaluate --server playwright --input \'{"script": "EXTRACTION_SCRIPT"}\'',
            'manus-mcp-cli tool call browser_screenshot --server playwright'
          ]
        },

        bright_data_example: {
          note: 'Will be implemented when Bright Data MCP is available',
          placeholder: 'Use Bright Data Browser API with saved session'
        }
      },

      // Step 4: Validate and save results
      step4: {
        action: 'validate_and_save',
        description: 'Validate extracted products and save to database',
        validation: {
          required_fields: ['title', 'price', 'url'],
          min_products: 1,
          max_products: 1000
        },
        save_command: `curl -X POST ${process.env.BACKEND_URL || 'https://affiliate-backend-production-df21.up.railway.app'}/api/agentic-scraper/results \\
  -H "Content-Type: application/json" \\
  -d '{"missionId": "${mission.id}", "products": [...], "strategy": {...}}'`
      },

      // Step 5: Learn and improve
      step5: {
        action: 'save_strategy',
        description: 'Save successful strategy for future use',
        note: 'If scraping was successful, save the strategy so backend can replay it automatically'
      }
    };
  }

  /**
   * Get decrypted session for scraping
   * Called by Manus during mission execution
   */
  async getSession(connectionId) {
    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('session_data')
        .eq('id', connectionId)
        .single();

      if (error || !data) {
        throw new Error('Session not found');
      }

      // Decrypt session
      const decrypted = manusBrowserController.decryptSession(data.session_data);

      return {
        success: true,
        session: decrypted
      };
    } catch (error) {
      console.error('Error getting session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save scraping results
   * Called by Manus after successful scraping
   */
  async saveResults(missionId, products, strategy) {
    try {
      // Update mission status
      await supabase
        .from('scraping_missions')
        .update({
          status: 'completed',
          products_found: products.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', missionId);

      // Save products to discovered_products table
      const productsToInsert = products.map(p => ({
        platform: strategy.platform,
        title: p.title,
        price: p.price,
        commission_rate: p.commission,
        product_url: p.url,
        image_url: p.image,
        category: p.category,
        description: p.description,
        discovered_at: new Date().toISOString()
      }));

      const { error: productsError } = await supabase
        .from('discovered_products')
        .insert(productsToInsert);

      if (productsError) throw productsError;

      // Save successful strategy
      await this.saveStrategy(strategy);

      return {
        success: true,
        productsAdded: products.length
      };
    } catch (error) {
      console.error('Error saving results:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Save successful scraping strategy for future use
   */
  async saveStrategy(strategy) {
    try {
      const { error } = await supabase
        .from('scraping_strategies')
        .insert({
          platform_id: strategy.platformId,
          tool: strategy.tool,
          selectors: strategy.selectors,
          pagination: strategy.pagination,
          rate_limit: strategy.rateLimit,
          success_count: 1,
          last_used_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        // Strategy might already exist, update it
        await supabase
          .from('scraping_strategies')
          .update({
            success_count: supabase.raw('success_count + 1'),
            last_used_at: new Date().toISOString()
          })
          .eq('platform_id', strategy.platformId)
          .eq('tool', strategy.tool);
      }

      // Cache in memory
      this.strategies.set(`${strategy.platformId}_${strategy.tool}`, strategy);

      return { success: true };
    } catch (error) {
      console.error('Error saving strategy:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get learned strategy for a platform
   * Used by backend for autonomous scraping
   */
  async getLearnedStrategy(platformId) {
    try {
      const { data, error } = await supabase
        .from('scraping_strategies')
        .select('*')
        .eq('platform_id', platformId)
        .order('success_count', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: 'No learned strategy found' };
      }

      return {
        success: true,
        strategy: data
      };
    } catch (error) {
      console.error('Error getting learned strategy:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AgenticScraper();

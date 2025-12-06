/**
 * Manus Agentic Executor
 * 
 * This module implements TRUE agentic behavior using Manus AI.
 * Instead of following a hardcoded script, Manus:
 * 
 * 1. Receives the user's goal (e.g., "Find top 5 keto products")
 * 2. THINKS about what actions to take
 * 3. DECIDES which tool to use (login, search, extract, etc.)
 * 4. OBSERVES the result
 * 5. THINKS about what to do next
 * 6. REPEATS until goal is achieved
 * 
 * This is the Think-Act-Observe loop that makes it a true AI agent.
 */

const HotmartAutomation = require('../browser/HotmartAutomation');
const db = require('../../db');

// Tool definitions that Manus can use
const BROWSER_TOOLS = [
  {
    name: "login_to_platform",
    description: "Login to the affiliate platform (e.g., Hotmart) using credentials. Must be called before searching.",
    parameters: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["hotmart"],
          description: "The platform to login to"
        }
      },
      required: ["platform"]
    }
  },
  {
    name: "search_marketplace",
    description: "Search the marketplace for products matching keywords. Returns search status, not products.",
    parameters: {
      type: "object",
      properties: {
        keywords: {
          type: "string",
          description: "Search keywords (e.g., 'weight loss', 'keto diet', 'fitness')"
        },
        language: {
          type: "string",
          enum: ["pt", "en", "es"],
          description: "Filter by language (optional)"
        },
        sortBy: {
          type: "string",
          enum: ["best_sellers", "newest", "highest_commission", "lowest_price"],
          description: "How to sort results (optional)"
        }
      },
      required: ["keywords"]
    }
  },
  {
    name: "extract_products",
    description: "Extract product information from the current search results page. Call this after searching.",
    parameters: {
      type: "object",
      properties: {
        maxProducts: {
          type: "number",
          description: "Maximum number of products to extract (1-20)"
        }
      },
      required: ["maxProducts"]
    }
  },
  {
    name: "get_product_details",
    description: "Get detailed information about a specific product by visiting its page.",
    parameters: {
      type: "object",
      properties: {
        productUrl: {
          type: "string",
          description: "URL of the product to get details for"
        }
      },
      required: ["productUrl"]
    }
  },
  {
    name: "complete_research",
    description: "Signal that research is complete and provide final analysis. Call this when you have enough products.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Summary of what was found"
        },
        recommendedProducts: {
          type: "array",
          items: { type: "string" },
          description: "Names of recommended products to affiliate with"
        },
        reasoning: {
          type: "string",
          description: "Why you recommend these products"
        }
      },
      required: ["summary", "recommendedProducts", "reasoning"]
    }
  }
];

class ManusAgenticExecutor {
  constructor(credentials) {
    this.credentials = credentials;
    this.browser = null;
    this.isLoggedIn = false;
    this.conversationHistory = [];
    this.discoveredProducts = [];
    this.maxIterations = 15; // Safety limit
    this.missionId = null;
  }

  /**
   * Execute an agentic research mission
   * The AI will think, act, observe, and repeat until the goal is achieved
   */
  async execute(mission) {
    this.missionId = mission.id;
    console.log(`\n🤖 Starting AGENTIC execution for mission #${mission.id}`);
    console.log(`   Goal: ${mission.prompt}`);
    
    try {
      // Update mission status
      await this.updateMissionStatus('running');
      await this.logAction('agentic_execution_started', { prompt: mission.prompt });
      
      // Initialize browser
      this.browser = new HotmartAutomation();
      await this.browser.launch();
      await this.logAction('browser_launched');
      
      // Build initial prompt for Manus
      const systemPrompt = this.buildSystemPrompt(mission);
      
      // Start the think-act-observe loop
      let iteration = 0;
      let isComplete = false;
      let finalResult = null;
      
      // Initial message to Manus
      this.conversationHistory.push({
        role: 'user',
        content: `Your mission: ${mission.prompt}\n\nYou are now ready to begin. What is your first action?`
      });
      
      while (!isComplete && iteration < this.maxIterations) {
        iteration++;
        console.log(`\n📍 Iteration ${iteration}/${this.maxIterations}`);
        
        // THINK: Ask Manus what to do next
        const aiResponse = await this.callManusWithTools(systemPrompt);
        
        if (!aiResponse) {
          throw new Error('No response from Manus AI');
        }
        
        // Check if Manus wants to use a tool
        if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
          const toolCall = aiResponse.tool_calls[0];
          console.log(`🔧 Manus wants to use tool: ${toolCall.function.name}`);
          
          // ACT: Execute the tool
          const toolResult = await this.executeTool(toolCall);
          
          // OBSERVE: Add result to conversation
          this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse.content || '',
            tool_calls: aiResponse.tool_calls
          });
          
          this.conversationHistory.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
          
          // Check if research is complete
          if (toolCall.function.name === 'complete_research') {
            isComplete = true;
            finalResult = toolResult;
          }
          
        } else {
          // Manus is thinking/responding without a tool call
          console.log(`💭 Manus says: ${aiResponse.content?.substring(0, 100)}...`);
          
          this.conversationHistory.push({
            role: 'assistant',
            content: aiResponse.content
          });
          
          // Prompt Manus to take action
          this.conversationHistory.push({
            role: 'user',
            content: 'What tool would you like to use next? Remember to use the available tools to complete the research.'
          });
        }
        
        // Log iteration
        await this.logAction(`iteration_${iteration}`, {
          tool: aiResponse.tool_calls?.[0]?.function?.name || 'thinking',
          productsFound: this.discoveredProducts.length
        });
      }
      
      // Clean up
      await this.browser.close();
      
      // Save results
      if (this.discoveredProducts.length > 0) {
        await this.saveDiscoveredProducts();
      }
      
      // Update mission status
      await this.updateMissionStatus('completed', {
        completedAt: new Date(),
        results: {
          productsFound: this.discoveredProducts.length,
          iterations: iteration,
          summary: finalResult?.summary || 'Research completed'
        }
      });
      
      await this.logAction('agentic_execution_completed', {
        iterations: iteration,
        productsFound: this.discoveredProducts.length
      });
      
      console.log(`\n✅ Agentic execution completed in ${iteration} iterations`);
      console.log(`   Products found: ${this.discoveredProducts.length}`);
      
      return {
        success: true,
        productsFound: this.discoveredProducts.length,
        iterations: iteration,
        products: this.discoveredProducts,
        summary: finalResult?.summary
      };
      
    } catch (error) {
      console.error(`❌ Agentic execution failed:`, error);
      
      if (this.browser) {
        await this.browser.close().catch(() => {});
      }
      
      await this.updateMissionStatus('failed', {
        errorMessage: error.message
      });
      
      await this.logAction('agentic_execution_failed', { error: error.message });
      
      throw error;
    }
  }

  /**
   * Build the system prompt that defines Manus's behavior
   */
  buildSystemPrompt(mission) {
    return `You are an expert affiliate marketing researcher with the ability to browse and analyze products on affiliate marketplaces.

YOUR MISSION: ${mission.prompt}

AVAILABLE TOOLS:
1. login_to_platform - Login to the affiliate platform (MUST do this first)
2. search_marketplace - Search for products with keywords
3. extract_products - Get product list from current search results
4. get_product_details - Get detailed info about a specific product
5. complete_research - Finish and summarize your findings

HOW TO APPROACH THIS:
1. First, login to the platform
2. Then search for relevant products based on the mission
3. Extract products from search results
4. If needed, get details on promising products
5. When you have enough good products, call complete_research

CRITERIA FOR GOOD AFFILIATE PRODUCTS:
- High commission rate (30%+ is good)
- Reasonable price point ($20-$200 typically converts well)
- Clear value proposition
- Good sales page
- Active and popular

Be efficient - don't over-search. Find ${mission.parameters?.maxProducts || 5} good products and complete the research.

Remember: You control the browser. Each tool call actually executes in a real browser.`;
  }

  /**
   * Call Manus AI with tool use capability
   */
  async callManusWithTools(systemPrompt) {
    const apiKey = process.env.MANUS_API_KEY || process.env.OPENAI_API_KEY;
    const apiUrl = process.env.MANUS_API_URL || 'https://api.openai.com/v1';
    
    if (!apiKey) {
      throw new Error('No AI API key configured (MANUS_API_KEY or OPENAI_API_KEY)');
    }

    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.MANUS_MODEL || 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.conversationHistory
          ],
          tools: BROWSER_TOOLS.map(tool => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }
          })),
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI API error: ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message;
      
    } catch (error) {
      console.error('Manus API call failed:', error);
      throw error;
    }
  }

  /**
   * Execute a tool that Manus requested
   */
  async executeTool(toolCall) {
    const toolName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    console.log(`   Executing: ${toolName}`, args);
    
    try {
      switch (toolName) {
        case 'login_to_platform':
          return await this.toolLogin(args);
          
        case 'search_marketplace':
          return await this.toolSearch(args);
          
        case 'extract_products':
          return await this.toolExtract(args);
          
        case 'get_product_details':
          return await this.toolGetDetails(args);
          
        case 'complete_research':
          return await this.toolComplete(args);
          
        default:
          return { error: `Unknown tool: ${toolName}` };
      }
    } catch (error) {
      console.error(`   Tool error:`, error.message);
      return { error: error.message };
    }
  }

  /**
   * Tool: Login to platform
   */
  async toolLogin(args) {
    if (this.isLoggedIn) {
      return { success: true, message: 'Already logged in' };
    }
    
    const email = this.credentials.email || process.env.HOTMART_EMAIL;
    const password = this.credentials.password || process.env.HOTMART_PASSWORD;
    
    if (!email || !password) {
      return { error: 'No credentials available for login' };
    }
    
    const success = await this.browser.login(email, password);
    this.isLoggedIn = success;
    
    return {
      success,
      message: success 
        ? 'Successfully logged into Hotmart. You can now search the marketplace.'
        : 'Login failed. Check credentials.'
    };
  }

  /**
   * Tool: Search marketplace
   */
  async toolSearch(args) {
    if (!this.isLoggedIn) {
      return { error: 'Must login first before searching' };
    }
    
    await this.browser.searchMarketplace(args.keywords, {
      language: args.language,
      sortBy: args.sortBy
    });
    
    return {
      success: true,
      message: `Searched for "${args.keywords}". Use extract_products to see results.`,
      searchedFor: args.keywords,
      filters: { language: args.language, sortBy: args.sortBy }
    };
  }

  /**
   * Tool: Extract products from current page
   */
  async toolExtract(args) {
    const maxProducts = Math.min(args.maxProducts || 10, 20);
    const products = await this.browser.extractProductCards(maxProducts);
    
    // Add to discovered products
    this.discoveredProducts.push(...products);
    
    return {
      success: true,
      productsFound: products.length,
      products: products.map(p => ({
        name: p.name,
        price: p.price,
        commission: p.commission,
        category: p.category,
        url: p.productUrl
      })),
      message: `Found ${products.length} products. Review them and decide if you need more or can complete.`
    };
  }

  /**
   * Tool: Get product details
   */
  async toolGetDetails(args) {
    const details = await this.browser.getProductDetails(args.productUrl);
    
    // Update product in discovered products
    const existingIndex = this.discoveredProducts.findIndex(
      p => p.productUrl === args.productUrl
    );
    
    if (existingIndex >= 0) {
      this.discoveredProducts[existingIndex] = {
        ...this.discoveredProducts[existingIndex],
        ...details
      };
    }
    
    return {
      success: true,
      product: details,
      message: 'Product details retrieved.'
    };
  }

  /**
   * Tool: Complete research
   */
  async toolComplete(args) {
    return {
      success: true,
      complete: true,
      summary: args.summary,
      recommendedProducts: args.recommendedProducts,
      reasoning: args.reasoning,
      totalProductsFound: this.discoveredProducts.length
    };
  }

  /**
   * Save discovered products to database
   */
  async saveDiscoveredProducts() {
    console.log(`💾 Saving ${this.discoveredProducts.length} products to database...`);
    
    for (const product of this.discoveredProducts) {
      try {
        await db.query(`
          INSERT INTO discovered_products (
            mission_id, platform, name, description, price,
            commission_rate, commission_type, category, niche,
            product_url, image_url, producer_name,
            ai_score, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (mission_id, product_url) DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP
        `, [
          this.missionId,
          'hotmart',
          product.name,
          product.description || null,
          product.price || null,
          product.commission || null,
          'percentage',
          product.category || null,
          product.niche || null,
          product.productUrl || null,
          product.imageUrl || null,
          product.producer || null,
          product.aiScore || 50,
          'discovered'
        ]);
      } catch (error) {
        console.error(`Failed to save product "${product.name}":`, error.message);
      }
    }
  }

  /**
   * Update mission status in database
   */
  async updateMissionStatus(status, updates = {}) {
    const fields = ['status = $2', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [this.missionId, status];
    let paramIndex = 3;

    if (updates.completedAt) {
      fields.push(`completed_at = $${paramIndex}`);
      values.push(updates.completedAt);
      paramIndex++;
    }

    if (updates.errorMessage) {
      fields.push(`error_message = $${paramIndex}`);
      values.push(updates.errorMessage);
      paramIndex++;
    }

    if (updates.results) {
      fields.push(`results_summary = $${paramIndex}`);
      values.push(JSON.stringify(updates.results));
      paramIndex++;
    }

    await db.query(`
      UPDATE agent_missions 
      SET ${fields.join(', ')}
      WHERE id = $1
    `, values);
  }

  /**
   * Log action to database
   */
  async logAction(action, details = {}) {
    try {
      await db.query(`
        INSERT INTO agent_logs (mission_id, action, details, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      `, [this.missionId, action, JSON.stringify(details)]);
    } catch (error) {
      console.error('Failed to log action:', error.message);
    }
  }
}

module.exports = ManusAgenticExecutor;

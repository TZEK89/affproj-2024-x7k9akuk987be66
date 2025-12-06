/**
 * Agent Dispatcher - Lightweight Version
 * 
 * This module provides a bridge between the job queue and the AgentExecutor.
 * Most of the actual work is now done by Manus's AgentExecutor.
 * 
 * The dispatcher is responsible for:
 * - Prompt analysis (understanding what user wants)
 * - Multi-agent coordination (if needed for A/B testing)
 * - Result aggregation
 * 
 * The AgentExecutor handles:
 * - Browser automation
 * - Platform-specific logic
 * - Product extraction
 * - AI analysis
 */

// Import Manus's AgentExecutor
let AgentExecutor = null;
try {
  AgentExecutor = require('../services/agents/AgentExecutor');
} catch (error) {
  console.warn('AgentExecutor not available:', error.message);
}

// Supported platforms
const PLATFORM_CONFIG = {
  hotmart: { name: 'Hotmart', requiresBrowser: true },
  impact: { name: 'Impact.com', requiresBrowser: true },
  clickbank: { name: 'ClickBank', requiresBrowser: true },
  shareasale: { name: 'ShareASale', requiresBrowser: true }
};

class AgentDispatcher {
  constructor(config) {
    this.missionId = config.missionId;
    this.platform = config.platform;
    this.prompt = config.prompt;
    this.agents = config.agents || ['claude'];
    this.parameters = config.parameters || {};
    this.onProgress = config.onProgress || (() => {});
    this.onLog = config.onLog || (() => {});
    
    this.platformConfig = PLATFORM_CONFIG[this.platform?.toLowerCase()];
  }
  
  /**
   * Execute the mission
   * Delegates to AgentExecutor for actual browser automation
   */
  async execute() {
    await this.onLog('dispatcher', 'execute_start', 
      `Starting mission for ${this.platform}`);
    
    if (!this.platformConfig) {
      throw new Error(`Unsupported platform: ${this.platform}`);
    }
    
    // If AgentExecutor is available, use it directly
    if (AgentExecutor) {
      return this.executeWithAgentExecutor();
    }
    
    // Fallback to mock execution
    return this.executeMock();
  }
  
  /**
   * Execute using Manus's AgentExecutor
   */
  async executeWithAgentExecutor() {
    await this.onLog('dispatcher', 'using_agent_executor', 'Delegating to AgentExecutor');
    await this.onProgress(10, 'Preparing execution');
    
    const executor = new AgentExecutor();
    
    // Build mission object as expected by AgentExecutor
    const mission = {
      id: this.missionId,
      platform: this.platform,
      prompt: this.prompt,
      mission_type: 'research',
      parameters: this.parameters
    };
    
    // Get credentials from parameters or environment
    const credentials = this.parameters.credentials || {
      email: process.env[`${this.platform.toUpperCase()}_EMAIL`],
      password: process.env[`${this.platform.toUpperCase()}_PASSWORD`]
    };
    
    if (!credentials.email || !credentials.password) {
      throw new Error(`No credentials for ${this.platform}`);
    }
    
    await this.onProgress(20, 'Starting AgentExecutor');
    
    // Execute via AgentExecutor
    const result = await executor.executeMission(mission, credentials);
    
    await this.onProgress(100, 'Execution complete');
    
    return {
      products: result.products || [],
      agentResults: { executor: result },
      summary: {
        message: `Found ${result.productsFound} products`,
        productsFound: result.productsFound,
        duration: result.duration
      }
    };
  }
  
  /**
   * Mock execution for testing when AgentExecutor is not available
   */
  async executeMock() {
    await this.onLog('dispatcher', 'mock_mode', 'Using mock execution');
    await this.onProgress(20, 'Mock mode - simulating research');
    
    // Simulate delay
    await new Promise(r => setTimeout(r, 2000));
    
    await this.onProgress(50, 'Generating mock products');
    
    const mockProducts = [];
    for (let i = 0; i < 5; i++) {
      mockProducts.push({
        id: `mock-${Date.now()}-${i}`,
        platform: this.platform,
        name: `Mock Product ${i + 1}`,
        description: `Mock product for: ${this.prompt.substring(0, 50)}`,
        price: (Math.random() * 200 + 50).toFixed(2),
        commission: (Math.random() * 50 + 10).toFixed(1),
        aiScore: Math.floor(Math.random() * 40 + 60)
      });
    }
    
    await this.onProgress(100, 'Mock execution complete');
    
    return {
      products: mockProducts,
      agentResults: { mock: true },
      summary: {
        message: `Mock: Found ${mockProducts.length} products`,
        productsFound: mockProducts.length,
        mode: 'mock'
      }
    };
  }
}

module.exports = AgentDispatcher;

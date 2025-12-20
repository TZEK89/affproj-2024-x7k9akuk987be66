/**
 * Claude-Manus Supervisor Service
 *
 * This service acts as the bridge between Claude (supervisor/architect)
 * and Manus (executor/worker). Claude transforms simple user prompts
 * into detailed, structured commands for Manus to execute.
 *
 * Flow:
 * 1. User gives simple prompt to Claude
 * 2. Claude analyzes context and builds detailed Manus prompt
 * 3. Manus executes the task
 * 4. Claude reviews the results and requests corrections if needed
 */

const axios = require('axios');
const db = require('../db');

class ClaudeManusSupervisor {
  constructor() {
    this.manusApiUrl = process.env.MANUS_API_URL || 'https://api.manus.ai/v1';
    this.manusApiKey = process.env.MANUS_API_KEY;
    this.taskHistory = [];
  }

  /**
   * Send a task to Manus with detailed instructions
   * @param {Object} task - The structured task object
   * @returns {Promise<Object>} - Manus response
   */
  async sendToManus(task) {
    if (!this.manusApiKey) {
      throw new Error('MANUS_API_KEY not configured');
    }

    const startTime = Date.now();

    try {
      console.log(`📤 Sending task to Manus: ${task.type}`);

      const response = await axios.post(
        `${this.manusApiUrl}/tasks`,
        {
          task_type: task.type,
          prompt: task.prompt,
          parameters: task.parameters || {},
          context: task.context || {},
          output_format: task.outputFormat || 'json',
          quality_requirements: task.qualityRequirements || []
        },
        {
          headers: {
            'Authorization': `Bearer ${this.manusApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: task.timeout || 120000
        }
      );

      const result = {
        success: true,
        taskId: response.data.task_id || response.data.id,
        status: response.data.status,
        result: response.data.result || response.data,
        duration: Date.now() - startTime
      };

      // Log task execution
      await this.logTaskExecution(task, result);

      return result;

    } catch (error) {
      const errorResult = {
        success: false,
        error: error.response?.data?.message || error.message,
        duration: Date.now() - startTime
      };

      await this.logTaskExecution(task, errorResult);
      throw new Error(`Manus task failed: ${errorResult.error}`);
    }
  }

  /**
   * Chat with Manus for simpler tasks
   * @param {string} message - The message to send
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Chat response
   */
  async chatWithManus(message, context = {}) {
    if (!this.manusApiKey) {
      throw new Error('MANUS_API_KEY not configured');
    }

    try {
      const response = await axios.post(
        `${this.manusApiUrl}/chat/completions`,
        {
          model: 'gpt-4.1-mini',
          messages: [
            {
              role: 'system',
              content: context.systemPrompt || 'You are Manus, an AI assistant for affiliate marketing automation.'
            },
            ...(context.history || []),
            {
              role: 'user',
              content: message
            }
          ],
          temperature: context.temperature || 0.7,
          max_tokens: context.maxTokens || 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.manusApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return {
        success: true,
        reply: response.data.choices[0].message.content,
        usage: response.data.usage
      };

    } catch (error) {
      throw new Error(`Manus chat failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Transform a simple user prompt into a detailed Manus command
   * This is the core "prompt engineering" function
   *
   * @param {string} simplePrompt - User's simple request
   * @param {string} taskType - Type of task
   * @param {Object} additionalContext - Extra context from codebase
   * @returns {Object} - Structured Manus command
   */
  buildManusCommand(simplePrompt, taskType, additionalContext = {}) {
    const commands = {
      // ========================================
      // RESEARCH & DISCOVERY
      // ========================================
      'research_products': {
        type: 'browser_automation',
        prompt: this.buildResearchPrompt(simplePrompt, additionalContext),
        parameters: {
          platform: additionalContext.platform || 'hotmart',
          maxProducts: additionalContext.maxProducts || 20,
          sortBy: additionalContext.sortBy || 'best_sellers',
          getDetails: true,
          filters: {
            minCommission: additionalContext.minCommission || 30,
            language: additionalContext.language || null,
            hasAffiliateMaterials: true
          }
        },
        outputFormat: 'structured_json',
        qualityRequirements: [
          'All fields must be populated',
          'Commission rates must be valid percentages',
          'Product URLs must be accessible',
          'Include AI scoring for each product'
        ],
        timeout: 300000 // 5 minutes for browser automation
      },

      // ========================================
      // CONTENT GENERATION
      // ========================================
      'generate_content': {
        type: 'content_generation',
        prompt: this.buildContentPrompt(simplePrompt, additionalContext),
        parameters: {
          contentType: additionalContext.contentType || 'description',
          length: additionalContext.length || 'medium',
          tone: additionalContext.tone || 'professional',
          targetAudience: additionalContext.targetAudience || 'general',
          format: additionalContext.format || 'markdown'
        },
        outputFormat: 'text',
        qualityRequirements: [
          'Content must be original and plagiarism-free',
          'Include clear call-to-action',
          'Optimize for conversions',
          'Match the specified tone and length'
        ]
      },

      'generate_image': {
        type: 'image_generation',
        prompt: this.buildImagePrompt(simplePrompt, additionalContext),
        parameters: {
          style: additionalContext.style || 'photorealistic',
          size: additionalContext.size || '1024x1024',
          model: additionalContext.model || 'nano-banana'
        },
        outputFormat: 'url',
        qualityRequirements: [
          'High resolution output',
          'Appropriate for marketing use',
          'No watermarks or artifacts'
        ]
      },

      // ========================================
      // CAMPAIGN MANAGEMENT
      // ========================================
      'manage_campaign': {
        type: 'campaign_action',
        prompt: this.buildCampaignPrompt(simplePrompt, additionalContext),
        parameters: {
          action: additionalContext.action || 'analyze',
          campaignId: additionalContext.campaignId,
          platform: additionalContext.platform
        },
        outputFormat: 'json',
        qualityRequirements: [
          'Validate all campaign parameters',
          'Check budget constraints',
          'Verify platform compatibility'
        ]
      },

      // ========================================
      // ANALYSIS & REPORTING
      // ========================================
      'analyze_data': {
        type: 'data_analysis',
        prompt: this.buildAnalysisPrompt(simplePrompt, additionalContext),
        parameters: {
          analysisType: additionalContext.analysisType || 'performance',
          timeframe: additionalContext.timeframe || '30d',
          metrics: additionalContext.metrics || ['revenue', 'conversions', 'roas']
        },
        outputFormat: 'structured_json',
        qualityRequirements: [
          'Include actionable insights',
          'Provide specific recommendations',
          'Quantify opportunities where possible'
        ]
      },

      // ========================================
      // CODE & DEVELOPMENT
      // ========================================
      'write_code': {
        type: 'code_generation',
        prompt: this.buildCodePrompt(simplePrompt, additionalContext),
        parameters: {
          language: additionalContext.language || 'javascript',
          framework: additionalContext.framework,
          style: additionalContext.style || 'clean',
          includeTests: additionalContext.includeTests || false
        },
        outputFormat: 'code',
        qualityRequirements: [
          'Follow existing codebase patterns',
          'Include proper error handling',
          'Add appropriate comments',
          'Ensure type safety where applicable'
        ]
      }
    };

    return commands[taskType] || {
      type: 'general',
      prompt: simplePrompt,
      parameters: additionalContext,
      outputFormat: 'text'
    };
  }

  // ========================================
  // PROMPT BUILDERS
  // ========================================

  buildResearchPrompt(simplePrompt, context) {
    return `
## RESEARCH MISSION

**User Request:** ${simplePrompt}

**Platform:** ${context.platform || 'Hotmart'}

### Instructions:
1. Navigate to the ${context.platform || 'Hotmart'} marketplace
2. Search for products matching: "${this.extractKeywords(simplePrompt)}"
3. For each product found, extract:
   - Product name and ID
   - Price and commission rate
   - Category/niche
   - Rating and reviews count
   - Sales page URL
   - Affiliate materials availability
   - Producer/vendor information

### Filtering Criteria:
- Minimum commission: ${context.minCommission || 30}%
- Language: ${context.language || 'Any'}
- Must have affiliate program active

### Output Format:
Return a JSON array of products with AI scoring (0-100) based on:
- Commission potential (30%)
- Market demand (25%)
- Competition level (20%)
- Product quality signals (15%)
- Affiliate support (10%)

### Quality Standards:
- Verify all URLs are accessible
- Ensure commission rates are accurate
- Include reasoning for each AI score
`;
  }

  buildContentPrompt(simplePrompt, context) {
    const lengthGuide = {
      short: '50-100 words',
      medium: '150-300 words',
      long: '400-600 words'
    };

    return `
## CONTENT GENERATION TASK

**User Request:** ${simplePrompt}

**Content Type:** ${context.contentType || 'marketing copy'}
**Length:** ${lengthGuide[context.length] || lengthGuide.medium}
**Tone:** ${context.tone || 'professional'}
**Target Audience:** ${context.targetAudience || 'general consumers'}

### Product Context:
${context.productName ? `- Product: ${context.productName}` : ''}
${context.productDetails ? `- Details: ${context.productDetails}` : ''}
${context.benefits ? `- Key Benefits: ${context.benefits}` : ''}
${context.price ? `- Price: ${context.price}` : ''}

### Requirements:
1. Write compelling, conversion-focused content
2. Include a clear call-to-action
3. Address pain points and benefits
4. Use power words that drive action
5. Optimize for the specified audience

### Output:
Provide the content in ${context.format || 'plain text'} format.
`;
  }

  buildImagePrompt(simplePrompt, context) {
    return `
## IMAGE GENERATION

**User Request:** ${simplePrompt}

**Style:** ${context.style || 'photorealistic, professional'}
**Size:** ${context.size || '1024x1024'}
**Use Case:** Marketing/advertising material

### Requirements:
- High quality, professional appearance
- Suitable for social media and ads
- Clear focal point
- Appropriate lighting and composition
- No text overlays (unless specified)

### Additional Context:
${context.productName ? `Product: ${context.productName}` : ''}
${context.brandColors ? `Brand Colors: ${context.brandColors}` : ''}
${context.mood ? `Mood: ${context.mood}` : ''}
`;
  }

  buildCampaignPrompt(simplePrompt, context) {
    return `
## CAMPAIGN MANAGEMENT TASK

**User Request:** ${simplePrompt}

**Action:** ${context.action || 'analyze and recommend'}
**Campaign ID:** ${context.campaignId || 'all active campaigns'}
**Platform:** ${context.platform || 'all platforms'}

### Current Metrics (if available):
${context.currentMetrics ? JSON.stringify(context.currentMetrics, null, 2) : 'Retrieve from database'}

### Task:
1. ${context.action === 'optimize' ? 'Identify underperforming elements and suggest optimizations' : ''}
2. ${context.action === 'scale' ? 'Identify winning campaigns to scale and recommend budget increases' : ''}
3. ${context.action === 'pause' ? 'Identify campaigns to pause based on performance thresholds' : ''}
4. ${context.action === 'analyze' ? 'Provide comprehensive performance analysis with recommendations' : ''}

### Output:
Provide actionable recommendations with specific numbers and rationale.
`;
  }

  buildAnalysisPrompt(simplePrompt, context) {
    return `
## DATA ANALYSIS TASK

**User Request:** ${simplePrompt}

**Analysis Type:** ${context.analysisType || 'performance'}
**Timeframe:** ${context.timeframe || 'last 30 days'}
**Key Metrics:** ${(context.metrics || ['revenue', 'conversions', 'roas']).join(', ')}

### Data to Analyze:
${context.data ? JSON.stringify(context.data, null, 2) : 'Query from database'}

### Required Outputs:
1. **Key Insights** (3-5 data-driven observations)
2. **Trends** (identify patterns and trajectories)
3. **Recommendations** (specific, actionable items)
4. **Opportunities** (potential improvements with estimated impact)
5. **Risks** (areas of concern to monitor)

### Format:
Return structured JSON with clear categorization.
`;
  }

  buildCodePrompt(simplePrompt, context) {
    return `
## CODE GENERATION TASK

**User Request:** ${simplePrompt}

**Language:** ${context.language || 'JavaScript'}
**Framework:** ${context.framework || 'Node.js/Express'}
**Code Style:** ${context.style || 'Clean, readable, well-commented'}

### Codebase Context:
${context.codebasePatterns ? `Existing patterns: ${context.codebasePatterns}` : ''}
${context.relatedFiles ? `Related files: ${context.relatedFiles.join(', ')}` : ''}

### Requirements:
1. Follow existing codebase conventions
2. Include proper error handling
3. Add JSDoc comments for functions
4. Use async/await for asynchronous operations
5. ${context.includeTests ? 'Include unit tests' : 'No tests required'}

### Output:
Provide complete, working code that can be directly integrated.
`;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  extractKeywords(text) {
    const stopWords = ['find', 'search', 'get', 'show', 'list', 'the', 'a', 'an', 'in', 'on', 'for', 'to', 'of', 'and', 'or', 'with'];
    return text
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.includes(word) && word.length > 2)
      .join(' ');
  }

  async logTaskExecution(task, result) {
    try {
      await db.query(`
        INSERT INTO claude_manus_tasks (
          task_type, prompt, parameters, success, result, duration_ms, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        task.type,
        task.prompt?.substring(0, 500),
        JSON.stringify(task.parameters || {}),
        result.success,
        JSON.stringify(result).substring(0, 5000),
        result.duration
      ]);
    } catch (error) {
      console.error('Failed to log task execution:', error.message);
    }
  }

  /**
   * Execute a supervised task - the main entry point
   * @param {string} simplePrompt - User's simple request
   * @param {string} taskType - Type of task to execute
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Execution result
   */
  async executeSupervised(simplePrompt, taskType, context = {}) {
    console.log(`\n🎯 Claude Supervisor: Processing "${simplePrompt}"`);
    console.log(`   Task Type: ${taskType}`);

    // Step 1: Build the detailed Manus command
    const command = this.buildManusCommand(simplePrompt, taskType, context);
    console.log(`📝 Built command for Manus`);

    // Step 2: Send to Manus
    const result = await this.sendToManus(command);
    console.log(`✅ Manus completed task in ${result.duration}ms`);

    // Step 3: Review and return (could add quality checking here)
    return {
      originalPrompt: simplePrompt,
      taskType,
      command: command,
      result: result,
      supervisorNotes: this.generateSupervisorNotes(result)
    };
  }

  generateSupervisorNotes(result) {
    if (!result.success) {
      return `Task failed. Error: ${result.error}. Recommend retry or alternative approach.`;
    }
    return `Task completed successfully in ${result.duration}ms.`;
  }

  /**
   * Test the connection to Manus API
   */
  async testConnection() {
    try {
      const response = await axios.get(
        `${this.manusApiUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${this.manusApiKey}`
          },
          timeout: 10000
        }
      );
      return { connected: true, models: response.data };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  }
}

module.exports = ClaudeManusSupervisor;

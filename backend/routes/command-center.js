/**
 * Command Center API Routes
 * Handles communication between the dashboard and Manus AI system
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Store for active sessions and executions
const sessions = new Map();
const executions = new Map();

// Usage tracking
let usageStats = {
  tokensToday: 0,
  tokensThisMonth: 0,
  tokenLimit: 1000000,
  runsToday: 0,
  runsThisMonth: 0,
  estimatedCost: 0
};

// Core definitions
const CORES = {
  offer_intelligence: {
    name: 'Offer Intelligence',
    agents: ['Market Researcher', 'Competitor Analyst', 'Scoring Agent'],
    runner: 'offer_intelligence_runner.py'
  },
  content_generation: {
    name: 'Content Generation',
    agents: ['Copywriter', 'Email Specialist', 'Social Media Expert', 'Video Scripter'],
    runner: 'content_generation_runner.py'
  },
  campaign_management: {
    name: 'Campaign Management',
    agents: ['Campaign Manager', 'Budget Optimizer', 'A/B Test Coordinator'],
    runner: null // Not yet implemented
  },
  analytics_engine: {
    name: 'Analytics Engine',
    agents: ['Data Analyst', 'Insights Generator', 'Report Builder'],
    runner: null
  },
  automation_hub: {
    name: 'Automation Hub',
    agents: ['Workflow Manager', 'Scheduler', 'Trigger Handler'],
    runner: null
  },
  financial_intelligence: {
    name: 'Financial Intelligence',
    agents: ['Revenue Tracker', 'Expense Analyzer', 'Profit Calculator'],
    runner: 'financial_intelligence_runner.py'
  },
  integration_layer: {
    name: 'Integration Layer',
    agents: ['API Gateway', 'MCP Connector', 'Data Sync Manager'],
    runner: null
  },
  personalization_engine: {
    name: 'Personalization',
    agents: ['Profile Manager', 'Recommender', 'Segment Analyzer'],
    runner: null
  }
};

// Detect which core to use based on message content
function detectCore(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('content') || lowerMessage.includes('ad') || 
      lowerMessage.includes('email') || lowerMessage.includes('copy')) {
    return 'content_generation';
  }
  if (lowerMessage.includes('finance') || lowerMessage.includes('revenue') || 
      lowerMessage.includes('profit') || lowerMessage.includes('expense')) {
    return 'financial_intelligence';
  }
  if (lowerMessage.includes('campaign') || lowerMessage.includes('budget') || 
      lowerMessage.includes('scale')) {
    return 'campaign_management';
  }
  if (lowerMessage.includes('analytics') || lowerMessage.includes('report') || 
      lowerMessage.includes('metrics')) {
    return 'analytics_engine';
  }
  if (lowerMessage.includes('automate') || lowerMessage.includes('schedule') || 
      lowerMessage.includes('workflow')) {
    return 'automation_hub';
  }
  // Default to offer intelligence for product/offer related queries
  return 'offer_intelligence';
}

// Execute AI analysis using OpenAI API (replaces Python runner)
async function executeRunner(core, task, options = {}) {
  const coreConfig = CORES[core];
  const agents = coreConfig?.agents || [];
  
  // Use OpenAI API for AI analysis
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompts = {
    offer_intelligence: `You are an AI Offer Intelligence system with 3 specialized agents:
- Market Researcher: Analyzes market trends and demand
- Competitor Analyst: Evaluates competition and positioning  
- Scoring Agent: Calculates product scores based on multiple factors

Analyze affiliate products and provide actionable recommendations. Focus on:
1. Market demand and trends
2. Competition level
3. Conversion potential
4. Commission value
5. Risk assessment

Provide specific, data-driven insights.`,
    content_generation: `You are an AI Content Generation system with 4 specialized agents:
- Copywriter: Creates compelling sales copy
- Email Specialist: Writes email sequences
- Social Media Expert: Creates social content
- Video Scripter: Writes video scripts

Generate high-converting affiliate marketing content.`,
    financial_intelligence: `You are an AI Financial Intelligence system with 3 specialized agents:
- Revenue Tracker: Monitors income streams
- Expense Analyzer: Tracks costs and ROI
- Profit Calculator: Projects profitability

Provide financial analysis and projections for affiliate campaigns.`
  };
  
  const systemPrompt = systemPrompts[core] || systemPrompts.offer_intelligence;
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });
    
    const tokensUsed = completion.usage?.total_tokens || 500;
    
    return {
      status: 'success',
      core,
      agents,
      result: completion.choices[0].message.content,
      tokensUsed
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    // Fallback to simulated response
    return {
      status: 'simulated',
      core,
      agents,
      result: `AI analysis for ${core}: ${task}\n\nNote: AI service temporarily unavailable. Please try again.`,
      tokensUsed: 0
    };
  }
}

// GET /api/command-center/status
router.get('/status', (req, res) => {
  res.json({
    connected: true,
    cores: Object.keys(CORES).map(id => ({
      id,
      ...CORES[id],
      status: 'idle'
    })),
    usage: usageStats,
    frameworks: {
      langgraph: true,
      crewai: true,
      autogen: true,
      llamaindex: true
    }
  });
});

// GET /api/command-center/cores
router.get('/cores', (req, res) => {
  res.json({
    cores: Object.entries(CORES).map(([id, config]) => ({
      id,
      name: config.name,
      agents: config.agents,
      hasRunner: !!config.runner,
      status: 'idle'
    }))
  });
});

// GET /api/command-center/usage
router.get('/usage', (req, res) => {
  res.json(usageStats);
});

// POST /api/command-center/chat
router.post('/chat', async (req, res) => {
  const { message, sessionId = 'default' } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Detect which core to use
    const detectedCore = detectCore(message);
    const coreConfig = CORES[detectedCore];

    // Create execution record
    const executionId = Date.now().toString();
    const execution = {
      id: executionId,
      core: detectedCore,
      agents: coreConfig.agents,
      status: 'running',
      startTime: new Date(),
      message
    };
    executions.set(executionId, execution);

    // Execute the runner
    const result = await executeRunner(detectedCore, message);

    // Update usage stats
    usageStats.tokensToday += result.tokensUsed;
    usageStats.tokensThisMonth += result.tokensUsed;
    usageStats.runsToday += 1;
    usageStats.runsThisMonth += 1;
    usageStats.estimatedCost += result.tokensUsed * 0.00003;

    // Update execution record
    execution.status = 'complete';
    execution.endTime = new Date();
    execution.tokensUsed = result.tokensUsed;

    res.json({
      executionId,
      core: detectedCore,
      coreName: coreConfig.name,
      agents: coreConfig.agents,
      response: result.result,
      tokensUsed: result.tokensUsed,
      llm: 'OpenAI GPT-4o',
      controller: 'Manus (Claude 3.5 Sonnet)'
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Execution failed', 
      message: error.message 
    });
  }
});

// POST /api/command-center/execute
router.post('/execute', async (req, res) => {
  const { core, task, options = {} } = req.body;

  if (!core || !task) {
    return res.status(400).json({ error: 'Core and task are required' });
  }

  if (!CORES[core]) {
    return res.status(400).json({ error: 'Invalid core specified' });
  }

  try {
    const result = await executeRunner(core, task, options);

    // Update usage stats
    usageStats.tokensToday += result.tokensUsed;
    usageStats.tokensThisMonth += result.tokensUsed;
    usageStats.runsToday += 1;
    usageStats.runsThisMonth += 1;
    usageStats.estimatedCost += result.tokensUsed * 0.00003;

    res.json(result);

  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({ 
      error: 'Execution failed', 
      message: error.message 
    });
  }
});

// GET /api/command-center/executions
router.get('/executions', (req, res) => {
  const executionList = Array.from(executions.values())
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, 20);
  
  res.json({ executions: executionList });
});

// POST /api/command-center/knowledge
router.post('/knowledge', async (req, res) => {
  const { question, category } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    const runnerPath = path.join(__dirname, '../../ai-orchestration/runners/knowledge_query_runner.py');
    const args = ['--question', question, '--output', 'json'];
    if (category) args.push('--category', category);

    const result = await new Promise((resolve, reject) => {
      const python = spawn('python3', [runnerPath, ...args]);
      let output = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (e) {
            resolve({ answer: output });
          }
        } else {
          reject(new Error('Knowledge query failed'));
        }
      });
    });

    res.json(result);

  } catch (error) {
    console.error('Knowledge query error:', error);
    res.status(500).json({ 
      error: 'Query failed', 
      message: error.message 
    });
  }
});

module.exports = router;

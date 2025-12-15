/**
 * Agent Management API Routes
 * Handles CRUD operations for agents, cores, LLMs, and frameworks
 */

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// In-memory storage (would be database in production)
let agentConfig = {
  cores: [
    {
      id: 'offer_intelligence',
      name: 'Offer Intelligence',
      description: 'Research and analyze affiliate products across platforms',
      framework: 'crewai',
      enabled: true,
      agents: [
        { id: 'oi_researcher', name: 'Market Researcher', role: 'researcher', llm: 'gpt-4o', enabled: true, temperature: 0.7, maxTokens: 2000 },
        { id: 'oi_analyst', name: 'Competitor Analyst', role: 'analyst', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000 },
        { id: 'oi_scorer', name: 'Scoring Agent', role: 'scorer', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500 }
      ]
    },
    {
      id: 'content_generation',
      name: 'Content Generation',
      description: 'Create marketing content, ads, emails, and social posts',
      framework: 'crewai',
      enabled: true,
      agents: [
        { id: 'cg_copywriter', name: 'Copywriter', role: 'writer', llm: 'gpt-4o', enabled: true, temperature: 0.8, maxTokens: 3000 },
        { id: 'cg_email', name: 'Email Specialist', role: 'email', llm: 'gpt-4o', enabled: true, temperature: 0.7, maxTokens: 2500 },
        { id: 'cg_social', name: 'Social Media Expert', role: 'social', llm: 'gpt-4o', enabled: true, temperature: 0.8, maxTokens: 2000 },
        { id: 'cg_video', name: 'Video Scripter', role: 'video', llm: 'gpt-4o', enabled: false, temperature: 0.7, maxTokens: 3000 }
      ]
    },
    {
      id: 'campaign_management',
      name: 'Campaign Management',
      description: 'Manage and optimize advertising campaigns',
      framework: 'langgraph',
      enabled: true,
      agents: [
        { id: 'cm_manager', name: 'Campaign Manager', role: 'manager', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000 },
        { id: 'cm_budget', name: 'Budget Optimizer', role: 'optimizer', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 1500 },
        { id: 'cm_ab', name: 'A/B Test Coordinator', role: 'tester', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500 }
      ]
    },
    {
      id: 'analytics_engine',
      name: 'Analytics Engine',
      description: 'Analyze performance data and generate insights',
      framework: 'langgraph',
      enabled: true,
      agents: [
        { id: 'ae_analyst', name: 'Data Analyst', role: 'analyst', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 2000 },
        { id: 'ae_insights', name: 'Insights Generator', role: 'insights', llm: 'gpt-4o', enabled: true, temperature: 0.6, maxTokens: 2500 },
        { id: 'ae_report', name: 'Report Builder', role: 'reporter', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 3000 }
      ]
    },
    {
      id: 'financial_intelligence',
      name: 'Financial Intelligence',
      description: 'Track revenue, expenses, and profitability',
      framework: 'crewai',
      enabled: true,
      agents: [
        { id: 'fi_revenue', name: 'Revenue Tracker', role: 'tracker', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500 },
        { id: 'fi_expense', name: 'Expense Analyzer', role: 'analyzer', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500 },
        { id: 'fi_profit', name: 'Profit Calculator', role: 'calculator', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1000 }
      ]
    },
    {
      id: 'automation_hub',
      name: 'Automation Hub',
      description: 'Automate workflows and scheduled tasks',
      framework: 'langgraph',
      enabled: false,
      agents: [
        { id: 'ah_workflow', name: 'Workflow Manager', role: 'manager', llm: 'gpt-4o', enabled: false, temperature: 0.4, maxTokens: 2000 },
        { id: 'ah_scheduler', name: 'Scheduler', role: 'scheduler', llm: 'gpt-4o', enabled: false, temperature: 0.3, maxTokens: 1000 },
        { id: 'ah_trigger', name: 'Trigger Handler', role: 'handler', llm: 'gpt-4o', enabled: false, temperature: 0.3, maxTokens: 1000 }
      ]
    },
    {
      id: 'integration_layer',
      name: 'Integration Layer',
      description: 'Connect with external APIs and services',
      framework: 'autogen',
      enabled: true,
      agents: [
        { id: 'il_gateway', name: 'API Gateway', role: 'gateway', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1500 },
        { id: 'il_mcp', name: 'MCP Connector', role: 'connector', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1500 },
        { id: 'il_sync', name: 'Data Sync Manager', role: 'sync', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 2000 }
      ]
    },
    {
      id: 'personalization_engine',
      name: 'Personalization Engine',
      description: 'Personalize content and recommendations',
      framework: 'llamaindex',
      enabled: true,
      agents: [
        { id: 'pe_profile', name: 'Profile Manager', role: 'profiler', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 1500 },
        { id: 'pe_recommend', name: 'Recommender', role: 'recommender', llm: 'gpt-4o', enabled: true, temperature: 0.6, maxTokens: 2000 },
        { id: 'pe_segment', name: 'Segment Analyzer', role: 'segmenter', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000 }
      ]
    }
  ],
  llms: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', model: 'gpt-4o', apiKeySet: true, maxTokens: 128000, costPer1kTokens: 0.03, enabled: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', model: 'gpt-4o-mini', apiKeySet: true, maxTokens: 128000, costPer1kTokens: 0.00015, enabled: true },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', model: 'claude-3-5-sonnet-20241022', apiKeySet: true, maxTokens: 200000, costPer1kTokens: 0.003, enabled: true },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model: 'claude-3-opus-20240229', apiKeySet: true, maxTokens: 200000, costPer1kTokens: 0.015, enabled: false },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', model: 'gemini-1.5-pro', apiKeySet: false, maxTokens: 1000000, costPer1kTokens: 0.00125, enabled: false }
  ],
  frameworks: [
    { id: 'langgraph', name: 'LangGraph', version: '1.0.5', description: 'Master orchestrator for complex workflows', enabled: true, cores: ['campaign_management', 'analytics_engine', 'automation_hub'] },
    { id: 'crewai', name: 'CrewAI', version: '1.7.0', description: 'Role-based agent teams', enabled: true, cores: ['offer_intelligence', 'content_generation', 'financial_intelligence'] },
    { id: 'autogen', name: 'AutoGen', version: '0.7.5', description: 'Conversational agents with code execution', enabled: true, cores: ['integration_layer'] },
    { id: 'llamaindex', name: 'LlamaIndex', version: '0.14.3', description: 'Knowledge base and RAG', enabled: true, cores: ['personalization_engine'] }
  ],
  stats: {
    totalRuns: 222,
    totalTokens: 206912,
    estimatedCost: 6.21
  }
};

// GET /api/agent-management/config
router.get('/config', (req, res) => {
  res.json(agentConfig);
});

// GET /api/agent-management/cores
router.get('/cores', (req, res) => {
  res.json({ cores: agentConfig.cores });
});

// GET /api/agent-management/cores/:coreId
router.get('/cores/:coreId', (req, res) => {
  const core = agentConfig.cores.find(c => c.id === req.params.coreId);
  if (!core) {
    return res.status(404).json({ error: 'Core not found' });
  }
  res.json(core);
});

// PUT /api/agent-management/cores/:coreId
router.put('/cores/:coreId', (req, res) => {
  const coreIndex = agentConfig.cores.findIndex(c => c.id === req.params.coreId);
  if (coreIndex === -1) {
    return res.status(404).json({ error: 'Core not found' });
  }
  
  const { enabled, framework } = req.body;
  if (typeof enabled === 'boolean') {
    agentConfig.cores[coreIndex].enabled = enabled;
  }
  if (framework) {
    agentConfig.cores[coreIndex].framework = framework;
  }
  
  res.json(agentConfig.cores[coreIndex]);
});

// GET /api/agent-management/agents
router.get('/agents', (req, res) => {
  const allAgents = agentConfig.cores.flatMap(core => 
    core.agents.map(agent => ({ ...agent, coreId: core.id, coreName: core.name }))
  );
  res.json({ agents: allAgents });
});

// GET /api/agent-management/agents/:agentId
router.get('/agents/:agentId', (req, res) => {
  for (const core of agentConfig.cores) {
    const agent = core.agents.find(a => a.id === req.params.agentId);
    if (agent) {
      return res.json({ ...agent, coreId: core.id, coreName: core.name });
    }
  }
  res.status(404).json({ error: 'Agent not found' });
});

// PUT /api/agent-management/agents/:agentId
router.put('/agents/:agentId', (req, res) => {
  const { enabled, llm, temperature, maxTokens } = req.body;
  
  for (const core of agentConfig.cores) {
    const agentIndex = core.agents.findIndex(a => a.id === req.params.agentId);
    if (agentIndex !== -1) {
      if (typeof enabled === 'boolean') {
        core.agents[agentIndex].enabled = enabled;
      }
      if (llm) {
        core.agents[agentIndex].llm = llm;
      }
      if (typeof temperature === 'number') {
        core.agents[agentIndex].temperature = temperature;
      }
      if (typeof maxTokens === 'number') {
        core.agents[agentIndex].maxTokens = maxTokens;
      }
      return res.json({ ...core.agents[agentIndex], coreId: core.id });
    }
  }
  
  res.status(404).json({ error: 'Agent not found' });
});

// POST /api/agent-management/agents/:agentId/toggle
router.post('/agents/:agentId/toggle', (req, res) => {
  for (const core of agentConfig.cores) {
    const agentIndex = core.agents.findIndex(a => a.id === req.params.agentId);
    if (agentIndex !== -1) {
      core.agents[agentIndex].enabled = !core.agents[agentIndex].enabled;
      return res.json({ 
        id: core.agents[agentIndex].id,
        enabled: core.agents[agentIndex].enabled 
      });
    }
  }
  res.status(404).json({ error: 'Agent not found' });
});

// GET /api/agent-management/llms
router.get('/llms', (req, res) => {
  res.json({ llms: agentConfig.llms });
});

// PUT /api/agent-management/llms/:llmId
router.put('/llms/:llmId', (req, res) => {
  const llmIndex = agentConfig.llms.findIndex(l => l.id === req.params.llmId);
  if (llmIndex === -1) {
    return res.status(404).json({ error: 'LLM not found' });
  }
  
  const { enabled, apiKey } = req.body;
  if (typeof enabled === 'boolean') {
    agentConfig.llms[llmIndex].enabled = enabled;
  }
  if (apiKey) {
    agentConfig.llms[llmIndex].apiKeySet = true;
    // In production, securely store the API key
  }
  
  res.json(agentConfig.llms[llmIndex]);
});

// POST /api/agent-management/llms/:llmId/toggle
router.post('/llms/:llmId/toggle', (req, res) => {
  const llmIndex = agentConfig.llms.findIndex(l => l.id === req.params.llmId);
  if (llmIndex === -1) {
    return res.status(404).json({ error: 'LLM not found' });
  }
  
  agentConfig.llms[llmIndex].enabled = !agentConfig.llms[llmIndex].enabled;
  res.json({ 
    id: agentConfig.llms[llmIndex].id,
    enabled: agentConfig.llms[llmIndex].enabled 
  });
});

// GET /api/agent-management/frameworks
router.get('/frameworks', (req, res) => {
  res.json({ frameworks: agentConfig.frameworks });
});

// PUT /api/agent-management/frameworks/:frameworkId
router.put('/frameworks/:frameworkId', (req, res) => {
  const fwIndex = agentConfig.frameworks.findIndex(f => f.id === req.params.frameworkId);
  if (fwIndex === -1) {
    return res.status(404).json({ error: 'Framework not found' });
  }
  
  const { enabled } = req.body;
  if (typeof enabled === 'boolean') {
    agentConfig.frameworks[fwIndex].enabled = enabled;
  }
  
  res.json(agentConfig.frameworks[fwIndex]);
});

// POST /api/agent-management/frameworks/:frameworkId/toggle
router.post('/frameworks/:frameworkId/toggle', (req, res) => {
  const fwIndex = agentConfig.frameworks.findIndex(f => f.id === req.params.frameworkId);
  if (fwIndex === -1) {
    return res.status(404).json({ error: 'Framework not found' });
  }
  
  agentConfig.frameworks[fwIndex].enabled = !agentConfig.frameworks[fwIndex].enabled;
  res.json({ 
    id: agentConfig.frameworks[fwIndex].id,
    enabled: agentConfig.frameworks[fwIndex].enabled 
  });
});

// GET /api/agent-management/stats
router.get('/stats', (req, res) => {
  // Calculate real-time stats
  const enabledAgents = agentConfig.cores.reduce((sum, core) => 
    sum + core.agents.filter(a => a.enabled).length, 0
  );
  const totalAgents = agentConfig.cores.reduce((sum, core) => 
    sum + core.agents.length, 0
  );
  const enabledCores = agentConfig.cores.filter(c => c.enabled).length;
  const enabledLLMs = agentConfig.llms.filter(l => l.enabled).length;
  const enabledFrameworks = agentConfig.frameworks.filter(f => f.enabled).length;

  res.json({
    agents: { enabled: enabledAgents, total: totalAgents },
    cores: { enabled: enabledCores, total: agentConfig.cores.length },
    llms: { enabled: enabledLLMs, total: agentConfig.llms.length },
    frameworks: { enabled: enabledFrameworks, total: agentConfig.frameworks.length },
    usage: agentConfig.stats
  });
});

// POST /api/agent-management/reset
router.post('/reset', (req, res) => {
  // Reset all agents to default enabled state
  agentConfig.cores.forEach(core => {
    core.enabled = true;
    core.agents.forEach(agent => {
      agent.enabled = true;
      agent.llm = 'gpt-4o';
      agent.temperature = 0.5;
    });
  });
  
  res.json({ message: 'Configuration reset to defaults', config: agentConfig });
});

module.exports = router;

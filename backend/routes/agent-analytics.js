/**
 * Agent Analytics API Routes
 * Handles agent performance metrics, accuracy scoring, and execution history
 */

const express = require('express');
const router = express.Router();

// In-memory storage for analytics (would be database in production)
let analyticsData = {
  agents: [
    {
      id: 'oi_researcher', name: 'Market Researcher', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
      totalTasks: 156, successfulTasks: 152, failedTasks: 4, successRate: 97.4,
      accuracyScore: 94.2, precisionScore: 92.8, recallScore: 95.6, f1Score: 94.2,
      decisionAccuracy: 91.5, falsePositives: 8, falseNegatives: 5, confidenceAvg: 87.3,
      avgResponseTime: 2.3, avgTokensUsed: 312, costEfficiency: 94.5, throughput: 26.0,
      trend: 'up', trendValue: 3.2, last7Days: [92, 94, 93, 95, 94, 96, 97], lastUpdated: new Date().toISOString()
    },
    {
      id: 'oi_analyst', name: 'Competitor Analyst', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
      totalTasks: 148, successfulTasks: 142, failedTasks: 6, successRate: 95.9,
      accuracyScore: 91.8, precisionScore: 90.5, recallScore: 93.1, f1Score: 91.8,
      decisionAccuracy: 89.2, falsePositives: 12, falseNegatives: 7, confidenceAvg: 84.6,
      avgResponseTime: 3.1, avgTokensUsed: 287, costEfficiency: 91.2, throughput: 21.1,
      trend: 'up', trendValue: 2.1, last7Days: [88, 90, 89, 91, 92, 91, 93], lastUpdated: new Date().toISOString()
    },
    {
      id: 'oi_scorer', name: 'Scoring Agent', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
      totalTasks: 156, successfulTasks: 155, failedTasks: 1, successRate: 99.4,
      accuracyScore: 96.8, precisionScore: 97.2, recallScore: 96.4, f1Score: 96.8,
      decisionAccuracy: 95.3, falsePositives: 3, falseNegatives: 4, confidenceAvg: 92.1,
      avgResponseTime: 1.8, avgTokensUsed: 189, costEfficiency: 97.8, throughput: 34.7,
      trend: 'stable', trendValue: 0.3, last7Days: [96, 97, 96, 97, 97, 96, 97], lastUpdated: new Date().toISOString()
    },
    {
      id: 'cg_copywriter', name: 'Copywriter', coreId: 'content_generation', coreName: 'Content Generation',
      totalTasks: 89, successfulTasks: 86, failedTasks: 3, successRate: 96.6,
      accuracyScore: 88.5, precisionScore: 87.2, recallScore: 89.8, f1Score: 88.5,
      decisionAccuracy: 85.4, falsePositives: 6, falseNegatives: 8, confidenceAvg: 81.2,
      avgResponseTime: 4.2, avgTokensUsed: 456, costEfficiency: 86.3, throughput: 14.8,
      trend: 'up', trendValue: 4.5, last7Days: [82, 84, 85, 87, 88, 89, 90], lastUpdated: new Date().toISOString()
    },
    {
      id: 'cg_email', name: 'Email Specialist', coreId: 'content_generation', coreName: 'Content Generation',
      totalTasks: 72, successfulTasks: 68, failedTasks: 4, successRate: 94.4,
      accuracyScore: 86.2, precisionScore: 85.8, recallScore: 86.6, f1Score: 86.2,
      decisionAccuracy: 83.7, falsePositives: 9, falseNegatives: 6, confidenceAvg: 79.5,
      avgResponseTime: 3.8, avgTokensUsed: 389, costEfficiency: 84.1, throughput: 12.0,
      trend: 'down', trendValue: -1.8, last7Days: [88, 87, 86, 85, 86, 85, 84], lastUpdated: new Date().toISOString()
    },
    {
      id: 'fi_revenue', name: 'Revenue Tracker', coreId: 'financial_intelligence', coreName: 'Financial Intelligence',
      totalTasks: 45, successfulTasks: 45, failedTasks: 0, successRate: 100.0,
      accuracyScore: 98.5, precisionScore: 98.8, recallScore: 98.2, f1Score: 98.5,
      decisionAccuracy: 97.8, falsePositives: 1, falseNegatives: 1, confidenceAvg: 95.6,
      avgResponseTime: 1.5, avgTokensUsed: 234, costEfficiency: 98.2, throughput: 30.0,
      trend: 'stable', trendValue: 0.1, last7Days: [98, 98, 99, 98, 98, 99, 98], lastUpdated: new Date().toISOString()
    }
  ],
  executions: [],
  insights: []
};

// Initialize with some execution history
for (let i = 0; i < 50; i++) {
  const agents = analyticsData.agents;
  const agent = agents[Math.floor(Math.random() * agents.length)];
  const statuses = ['success', 'success', 'success', 'success', 'partial', 'failed'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  analyticsData.executions.push({
    id: `exec_${i}`,
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
    agentId: agent.id,
    agentName: agent.name,
    coreId: agent.coreId,
    task: `Task ${i + 1}: ${['Find products', 'Analyze data', 'Generate content', 'Score offers', 'Track revenue'][Math.floor(Math.random() * 5)]}`,
    status: status,
    accuracy: status === 'success' ? 85 + Math.random() * 15 : status === 'partial' ? 60 + Math.random() * 20 : 30 + Math.random() * 30,
    confidence: status === 'success' ? 80 + Math.random() * 20 : status === 'partial' ? 55 + Math.random() * 25 : 25 + Math.random() * 35,
    tokensUsed: Math.floor(150 + Math.random() * 400),
    responseTime: 1 + Math.random() * 5,
    feedback: Math.random() > 0.6 ? (Math.random() > 0.3 ? 'positive' : 'negative') : null
  });
}

// GET /api/agent-analytics/overview
router.get('/overview', (req, res) => {
  const agents = analyticsData.agents;
  
  const overview = {
    totalAgents: agents.length,
    avgAccuracy: agents.reduce((sum, a) => sum + a.accuracyScore, 0) / agents.length,
    avgSuccessRate: agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length,
    totalTasks: agents.reduce((sum, a) => sum + a.totalTasks, 0),
    totalTokens: agents.reduce((sum, a) => sum + (a.totalTasks * a.avgTokensUsed), 0),
    avgResponseTime: agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / agents.length,
    topPerformer: agents.reduce((best, a) => a.accuracyScore > best.accuracyScore ? a : best, agents[0]),
    worstPerformer: agents.reduce((worst, a) => a.accuracyScore < worst.accuracyScore ? a : worst, agents[0]),
    trendingUp: agents.filter(a => a.trend === 'up').length,
    trendingDown: agents.filter(a => a.trend === 'down').length,
    stable: agents.filter(a => a.trend === 'stable').length
  };
  
  res.json(overview);
});

// GET /api/agent-analytics/agents
router.get('/agents', (req, res) => {
  const { coreId, sortBy = 'accuracy', order = 'desc' } = req.query;
  
  let agents = [...analyticsData.agents];
  
  // Filter by core
  if (coreId && coreId !== 'all') {
    agents = agents.filter(a => a.coreId === coreId);
  }
  
  // Sort
  agents.sort((a, b) => {
    let valueA, valueB;
    switch (sortBy) {
      case 'accuracy': valueA = a.accuracyScore; valueB = b.accuracyScore; break;
      case 'success': valueA = a.successRate; valueB = b.successRate; break;
      case 'tasks': valueA = a.totalTasks; valueB = b.totalTasks; break;
      case 'efficiency': valueA = a.costEfficiency; valueB = b.costEfficiency; break;
      case 'confidence': valueA = a.confidenceAvg; valueB = b.confidenceAvg; break;
      default: valueA = a.accuracyScore; valueB = b.accuracyScore;
    }
    return order === 'desc' ? valueB - valueA : valueA - valueB;
  });
  
  res.json({ agents });
});

// GET /api/agent-analytics/agents/:agentId
router.get('/agents/:agentId', (req, res) => {
  const agent = analyticsData.agents.find(a => a.id === req.params.agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  // Get recent executions for this agent
  const recentExecutions = analyticsData.executions
    .filter(e => e.agentId === agent.id)
    .slice(0, 20);
  
  res.json({ ...agent, recentExecutions });
});

// GET /api/agent-analytics/executions
router.get('/executions', (req, res) => {
  const { agentId, coreId, status, limit = 50, offset = 0 } = req.query;
  
  let executions = [...analyticsData.executions];
  
  // Filter
  if (agentId) executions = executions.filter(e => e.agentId === agentId);
  if (coreId) executions = executions.filter(e => e.coreId === coreId);
  if (status) executions = executions.filter(e => e.status === status);
  
  // Paginate
  const total = executions.length;
  executions = executions.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
  
  res.json({ executions, total, limit: parseInt(limit), offset: parseInt(offset) });
});

// POST /api/agent-analytics/executions
router.post('/executions', (req, res) => {
  const { agentId, task, status, accuracy, confidence, tokensUsed, responseTime } = req.body;
  
  const agent = analyticsData.agents.find(a => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const execution = {
    id: `exec_${Date.now()}`,
    timestamp: new Date().toISOString(),
    agentId,
    agentName: agent.name,
    coreId: agent.coreId,
    task,
    status,
    accuracy,
    confidence,
    tokensUsed,
    responseTime,
    feedback: null
  };
  
  analyticsData.executions.unshift(execution);
  
  // Update agent metrics
  agent.totalTasks++;
  if (status === 'success') agent.successfulTasks++;
  else agent.failedTasks++;
  agent.successRate = (agent.successfulTasks / agent.totalTasks) * 100;
  
  // Update running averages
  agent.avgTokensUsed = Math.round((agent.avgTokensUsed * (agent.totalTasks - 1) + tokensUsed) / agent.totalTasks);
  agent.avgResponseTime = parseFloat(((agent.avgResponseTime * (agent.totalTasks - 1) + responseTime) / agent.totalTasks).toFixed(2));
  
  // Update accuracy (weighted average)
  agent.accuracyScore = parseFloat(((agent.accuracyScore * (agent.totalTasks - 1) + accuracy) / agent.totalTasks).toFixed(1));
  
  agent.lastUpdated = new Date().toISOString();
  
  res.json({ execution, updatedAgent: agent });
});

// POST /api/agent-analytics/executions/:executionId/feedback
router.post('/executions/:executionId/feedback', (req, res) => {
  const { feedback } = req.body; // 'positive' or 'negative'
  
  const execution = analyticsData.executions.find(e => e.id === req.params.executionId);
  if (!execution) {
    return res.status(404).json({ error: 'Execution not found' });
  }
  
  execution.feedback = feedback;
  
  // Update agent metrics based on feedback
  const agent = analyticsData.agents.find(a => a.id === execution.agentId);
  if (agent) {
    if (feedback === 'negative') {
      // Adjust accuracy down slightly
      agent.accuracyScore = Math.max(0, agent.accuracyScore - 0.5);
      agent.falsePositives++;
    } else if (feedback === 'positive') {
      // Confirm accuracy
      agent.accuracyScore = Math.min(100, agent.accuracyScore + 0.1);
    }
  }
  
  res.json({ execution });
});

// GET /api/agent-analytics/leaderboard
router.get('/leaderboard', (req, res) => {
  const { metric = 'accuracy', limit = 10 } = req.query;
  
  let agents = [...analyticsData.agents];
  
  // Sort by metric
  switch (metric) {
    case 'accuracy':
      agents.sort((a, b) => b.accuracyScore - a.accuracyScore);
      break;
    case 'success':
      agents.sort((a, b) => b.successRate - a.successRate);
      break;
    case 'efficiency':
      agents.sort((a, b) => b.costEfficiency - a.costEfficiency);
      break;
    case 'throughput':
      agents.sort((a, b) => b.throughput - a.throughput);
      break;
    case 'improvement':
      agents.sort((a, b) => b.trendValue - a.trendValue);
      break;
  }
  
  const leaderboard = agents.slice(0, parseInt(limit)).map((agent, index) => ({
    rank: index + 1,
    ...agent
  }));
  
  res.json({ leaderboard, metric });
});

// GET /api/agent-analytics/insights
router.get('/insights', (req, res) => {
  const agents = analyticsData.agents;
  
  const insights = [];
  
  // Top performer insight
  const topPerformer = agents.reduce((best, a) => a.accuracyScore > best.accuracyScore ? a : best, agents[0]);
  insights.push({
    type: 'success',
    title: `Top Performer: ${topPerformer.name}`,
    message: `Consistently achieving ${topPerformer.accuracyScore.toFixed(1)}% accuracy with the lowest false positive rate. Consider using this agent's configuration as a template for others.`,
    agentId: topPerformer.id,
    priority: 'high'
  });
  
  // Declining agents
  const decliningAgents = agents.filter(a => a.trend === 'down');
  decliningAgents.forEach(agent => {
    insights.push({
      type: 'warning',
      title: `Attention: ${agent.name}`,
      message: `Accuracy trending down (${agent.trendValue}% this week). Consider lowering temperature or adjusting prompts for more consistent outputs.`,
      agentId: agent.id,
      priority: 'medium'
    });
  });
  
  // High token usage agents
  const highTokenAgents = agents.filter(a => a.avgTokensUsed > 400);
  highTokenAgents.forEach(agent => {
    insights.push({
      type: 'info',
      title: 'Efficiency Opportunity',
      message: `${agent.name} uses ${agent.avgTokensUsed} tokens/task on average. Switching to GPT-4o-mini could reduce costs by 85% with minimal accuracy impact.`,
      agentId: agent.id,
      priority: 'low'
    });
  });
  
  // Low confidence agents
  const lowConfidenceAgents = agents.filter(a => a.confidenceAvg < 85);
  lowConfidenceAgents.forEach(agent => {
    insights.push({
      type: 'warning',
      title: 'Low Confidence Detected',
      message: `${agent.name} has average confidence of ${agent.confidenceAvg.toFixed(1)}%. This may indicate unclear prompts or insufficient context.`,
      agentId: agent.id,
      priority: 'medium'
    });
  });
  
  res.json({ insights });
});

// GET /api/agent-analytics/cores
router.get('/cores', (req, res) => {
  const agents = analyticsData.agents;
  
  // Group by core
  const coreMap = {};
  agents.forEach(agent => {
    if (!coreMap[agent.coreId]) {
      coreMap[agent.coreId] = {
        id: agent.coreId,
        name: agent.coreName,
        agents: [],
        totalTasks: 0,
        totalTokens: 0,
        avgAccuracy: 0,
        avgSuccessRate: 0
      };
    }
    coreMap[agent.coreId].agents.push(agent);
    coreMap[agent.coreId].totalTasks += agent.totalTasks;
    coreMap[agent.coreId].totalTokens += agent.totalTasks * agent.avgTokensUsed;
  });
  
  // Calculate averages
  Object.values(coreMap).forEach(core => {
    core.avgAccuracy = core.agents.reduce((sum, a) => sum + a.accuracyScore, 0) / core.agents.length;
    core.avgSuccessRate = core.agents.reduce((sum, a) => sum + a.successRate, 0) / core.agents.length;
    core.overallScore = (core.avgAccuracy + core.avgSuccessRate) / 2;
  });
  
  res.json({ cores: Object.values(coreMap) });
});

// GET /api/agent-analytics/trends
router.get('/trends', (req, res) => {
  const { agentId, days = 7 } = req.query;
  
  if (agentId) {
    const agent = analyticsData.agents.find(a => a.id === agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    return res.json({ agentId, trend: agent.trend, trendValue: agent.trendValue, last7Days: agent.last7Days });
  }
  
  // Return trends for all agents
  const trends = analyticsData.agents.map(agent => ({
    agentId: agent.id,
    agentName: agent.name,
    trend: agent.trend,
    trendValue: agent.trendValue,
    last7Days: agent.last7Days
  }));
  
  res.json({ trends });
});

// POST /api/agent-analytics/reset
router.post('/reset', (req, res) => {
  // Reset all metrics to baseline
  analyticsData.agents.forEach(agent => {
    agent.totalTasks = 0;
    agent.successfulTasks = 0;
    agent.failedTasks = 0;
    agent.successRate = 0;
    agent.falsePositives = 0;
    agent.falseNegatives = 0;
    agent.last7Days = [0, 0, 0, 0, 0, 0, 0];
    agent.lastUpdated = new Date().toISOString();
  });
  
  analyticsData.executions = [];
  
  res.json({ message: 'Analytics reset successfully' });
});

module.exports = router;

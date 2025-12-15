'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Bot, 
  User, 
  Zap, 
  Brain, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Settings,
  Activity,
  Database,
  MessageSquare,
  Play,
  Pause,
  CheckCircle2,
  Circle,
  Loader2,
  Coins,
  BarChart3,
  Target,
  Sparkles,
  Clock,
  AlertCircle,
  ChevronRight,
  Maximize2,
  Moon,
  Sun
} from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  coreExecuted?: string;
  agentsUsed?: string[];
  tokensUsed?: number;
  status?: 'pending' | 'running' | 'complete' | 'error';
}

interface AgentExecution {
  id: string;
  core: string;
  agents: string[];
  currentAgent: number;
  status: 'queued' | 'running' | 'complete' | 'error';
  startTime: Date;
  endTime?: Date;
  tokensUsed: number;
  llm: string;
}

interface CoreStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'error';
  lastRun?: Date;
  totalRuns: number;
  tokensUsed: number;
}

interface UsageStats {
  tokensToday: number;
  tokensThisMonth: number;
  tokenLimit: number;
  runsToday: number;
  runsThisMonth: number;
  estimatedCost: number;
}

// API Configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Core definitions with full details
const CORES: CoreStatus[] = [
  { id: 'offer_intelligence', name: 'Offer Intelligence', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'content_generation', name: 'Content Generation', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'campaign_management', name: 'Campaign Management', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'analytics_engine', name: 'Analytics Engine', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'automation_hub', name: 'Automation Hub', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'financial_intelligence', name: 'Financial Intelligence', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'integration_layer', name: 'Integration Layer', status: 'idle', totalRuns: 0, tokensUsed: 0 },
  { id: 'personalization_engine', name: 'Personalization', status: 'idle', totalRuns: 0, tokensUsed: 0 },
];

// Core icons
const coreIcons: Record<string, React.ReactNode> = {
  offer_intelligence: <Brain className="h-4 w-4" />,
  content_generation: <FileText className="h-4 w-4" />,
  campaign_management: <TrendingUp className="h-4 w-4" />,
  analytics_engine: <BarChart3 className="h-4 w-4" />,
  automation_hub: <Zap className="h-4 w-4" />,
  financial_intelligence: <DollarSign className="h-4 w-4" />,
  integration_layer: <Database className="h-4 w-4" />,
  personalization_engine: <Target className="h-4 w-4" />
};

// Agent definitions per core
const coreAgents: Record<string, string[]> = {
  offer_intelligence: ['Market Researcher', 'Competitor Analyst', 'Scoring Agent'],
  content_generation: ['Copywriter', 'Email Specialist', 'Social Media Expert', 'Video Scripter'],
  campaign_management: ['Campaign Manager', 'Budget Optimizer', 'A/B Test Coordinator'],
  analytics_engine: ['Data Analyst', 'Insights Generator', 'Report Builder'],
  automation_hub: ['Workflow Manager', 'Scheduler', 'Trigger Handler'],
  financial_intelligence: ['Revenue Tracker', 'Expense Analyzer', 'Profit Calculator'],
  integration_layer: ['API Gateway', 'MCP Connector', 'Data Sync Manager'],
  personalization_engine: ['Profile Manager', 'Recommender', 'Segment Analyzer']
};

export default function CommandCenter() {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cores, setCores] = useState<CoreStatus[]>(CORES);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [usage, setUsage] = useState<UsageStats>({
    tokensToday: 3129,
    tokensThisMonth: 45892,
    tokenLimit: 1000000,
    runsToday: 3,
    runsThisMonth: 127,
    estimatedCost: 2.34
  });
  const [darkMode, setDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate agent execution visualization
  const simulateExecution = (core: string, task: string) => {
    const agents = coreAgents[core] || ['Agent 1', 'Agent 2'];
    const executionId = Date.now().toString();
    
    const newExecution: AgentExecution = {
      id: executionId,
      core,
      agents,
      currentAgent: 0,
      status: 'running',
      startTime: new Date(),
      tokensUsed: 0,
      llm: 'OpenAI GPT-4o'
    };

    setExecutions(prev => [newExecution, ...prev]);
    
    // Update core status
    setCores(prev => prev.map(c => 
      c.id === core ? { ...c, status: 'running' as const } : c
    ));

    // Simulate agent progression
    let currentAgent = 0;
    const interval = setInterval(() => {
      currentAgent++;
      if (currentAgent < agents.length) {
        setExecutions(prev => prev.map(e => 
          e.id === executionId 
            ? { ...e, currentAgent, tokensUsed: e.tokensUsed + Math.floor(Math.random() * 300) + 200 }
            : e
        ));
      } else {
        clearInterval(interval);
        const finalTokens = Math.floor(Math.random() * 500) + 800;
        setExecutions(prev => prev.map(e => 
          e.id === executionId 
            ? { ...e, status: 'complete', endTime: new Date(), tokensUsed: finalTokens }
            : e
        ));
        setCores(prev => prev.map(c => 
          c.id === core 
            ? { ...c, status: 'idle', lastRun: new Date(), totalRuns: c.totalRuns + 1, tokensUsed: c.tokensUsed + finalTokens }
            : c
        ));
        setUsage(prev => ({
          ...prev,
          tokensToday: prev.tokensToday + finalTokens,
          tokensThisMonth: prev.tokensThisMonth + finalTokens,
          runsToday: prev.runsToday + 1,
          runsThisMonth: prev.runsThisMonth + 1,
          estimatedCost: prev.estimatedCost + (finalTokens * 0.00003)
        }));
      }
    }, 1500);

    return executionId;
  };

  // Send message handler
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    // Determine which core to execute based on input
    let detectedCore = 'offer_intelligence';
    let agents: string[] = [];
    
    if (userInput.toLowerCase().includes('content') || userInput.toLowerCase().includes('ad') || userInput.toLowerCase().includes('email')) {
      detectedCore = 'content_generation';
      agents = coreAgents.content_generation;
    } else if (userInput.toLowerCase().includes('finance') || userInput.toLowerCase().includes('revenue') || userInput.toLowerCase().includes('profit')) {
      detectedCore = 'financial_intelligence';
      agents = coreAgents.financial_intelligence;
    } else if (userInput.toLowerCase().includes('campaign') || userInput.toLowerCase().includes('budget')) {
      detectedCore = 'campaign_management';
      agents = coreAgents.campaign_management;
    } else if (userInput.toLowerCase().includes('product') || userInput.toLowerCase().includes('offer') || userInput.toLowerCase().includes('find')) {
      detectedCore = 'offer_intelligence';
      agents = coreAgents.offer_intelligence;
    }

    // Add system message showing what's being executed
    const systemMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'system',
      content: `Executing ${detectedCore.replace('_', ' ')} with agents: ${agents.join(' → ')}`,
      timestamp: new Date(),
      coreExecuted: detectedCore,
      agentsUsed: agents,
      status: 'running'
    };
    setMessages(prev => [...prev, systemMessage]);

    // Start execution visualization
    simulateExecution(detectedCore, userInput);

    // Simulate API call
    setTimeout(() => {
      const tokensUsed = Math.floor(Math.random() * 500) + 800;
      
      // Update system message to complete
      setMessages(prev => prev.map(m => 
        m.id === systemMessage.id 
          ? { ...m, status: 'complete', tokensUsed }
          : m
      ));

      // Add response
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: generateMockResponse(detectedCore, userInput),
        timestamp: new Date(),
        coreExecuted: detectedCore,
        agentsUsed: agents,
        tokensUsed
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, agents.length * 1500 + 500);
  };

  // Generate mock response based on core
  const generateMockResponse = (core: string, input: string): string => {
    const responses: Record<string, string> = {
      offer_intelligence: `## Offer Intelligence Analysis Complete

Based on my analysis, here are the top recommendations:

### Top 5 Products Found
| Rank | Product | Commission | AI Score |
|------|---------|------------|----------|
| 1 | Personal Finance Mastery | 50% | 92 |
| 2 | Crypto Investment Kit | 45% | 88 |
| 3 | Budgeting Success eBook | 40% | 85 |
| 4 | Stock Trading Basics | 50% | 83 |
| 5 | Financial Freedom Program | 42% | 80 |

**Recommendation:** Focus on Product #1 for highest potential ROI.`,
      
      content_generation: `## Content Generated Successfully

### Facebook Ad Copy
**Headline:** "Unlock Financial Freedom in 30 Days"
**Body:** Discover the proven system that helped 10,000+ people transform their finances...
**CTA:** Start Your Journey Now →

### Email Subject Lines
1. "The secret to financial freedom (revealed)"
2. "How I paid off $50k in debt in 12 months"
3. "Your finances are about to change forever"

### Social Media Posts
Created 5 Twitter posts, 3 LinkedIn articles, and 2 Instagram captions.`,
      
      financial_intelligence: `## Financial Analysis Complete

### Performance Summary
| Metric | Value | Change |
|--------|-------|--------|
| Revenue | $5,234 | +12% |
| Expenses | $2,100 | -5% |
| Net Profit | $3,134 | +18% |
| ROI | 149% | +15% |
| ROAS | 3.2x | +0.4x |

**Key Insight:** Your finance niche campaigns are outperforming by 23%.`,
      
      campaign_management: `## Campaign Analysis

### Active Campaigns
- **Finance Mastery FB** - ROAS: 2.8x ✅
- **Crypto Starter Google** - ROAS: 1.9x ⚠️
- **Budget eBook Native** - ROAS: 3.1x ✅

**Recommendation:** Scale Finance Mastery FB by 25%, pause Crypto Starter Google for optimization.`
    };

    return responses[core] || 'Analysis complete. Results are ready for review.';
  };

  // Quick actions
  const quickActions = [
    { label: 'Find Products', core: 'offer_intelligence', icon: <Brain className="h-4 w-4" /> },
    { label: 'Create Content', core: 'content_generation', icon: <FileText className="h-4 w-4" /> },
    { label: 'Analyze Finances', core: 'financial_intelligence', icon: <DollarSign className="h-4 w-4" /> },
    { label: 'Check Campaigns', core: 'campaign_management', icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bot className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Manus Command Center</h1>
                <p className="text-xs text-muted-foreground">8-Core AI Affiliate Marketing System</p>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Token Usage */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Coins className="h-4 w-4 text-yellow-500" />
              <div className="text-sm">
                <span className="font-medium">{usage.tokensToday.toLocaleString()}</span>
                <span className="text-muted-foreground"> tokens today</span>
              </div>
            </div>
            
            {/* Cost */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">${usage.estimatedCost.toFixed(2)}</span>
            </div>
            
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            {/* Fullscreen */}
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Ultrawide Layout */}
      <div className="flex h-[calc(100vh-65px)]">
        
        {/* Left Panel - Cores & Status (20%) */}
        <div className="w-[20%] border-r bg-card/30 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Cores
          </h2>
          
          <div className="space-y-2">
            {cores.map((core) => (
              <div 
                key={core.id}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
                  core.status === 'running' ? 'border-primary bg-primary/10' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {coreIcons[core.id]}
                    <span className="text-sm font-medium">{core.name}</span>
                  </div>
                  {core.status === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : core.status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{core.totalRuns} runs</span>
                  <span>{core.tokensUsed.toLocaleString()} tokens</span>
                </div>
              </div>
            ))}
          </div>

          {/* Usage Stats */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Usage Stats
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Tokens</span>
                  <span>{((usage.tokensThisMonth / usage.tokenLimit) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(usage.tokensThisMonth / usage.tokenLimit) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">Today</div>
                  <div className="font-medium">{usage.runsToday} runs</div>
                </div>
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-muted-foreground text-xs">This Month</div>
                  <div className="font-medium">{usage.runsThisMonth} runs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Panel - Chat (50%) */}
        <div className="w-[50%] flex flex-col">
          {/* Quick Actions */}
          <div className="p-4 border-b bg-card/30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Quick Actions:</span>
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setInput(`${action.label.toLowerCase()} for finance niche`)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-16 w-16 mb-4 text-muted-foreground/30" />
                <h3 className="text-xl font-semibold mb-2">Welcome to Manus Command Center</h3>
                <p className="text-muted-foreground max-w-md">
                  I'm your AI orchestrator. Tell me what you need and I'll deploy the right agents to get it done.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setInput('Find top 10 finance products with 50%+ commission')}>
                    <Brain className="h-4 w-4 mr-2" />
                    Find Products
                  </Button>
                  <Button variant="outline" onClick={() => setInput('Create ad copy for a finance course')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Create Content
                  </Button>
                  <Button variant="outline" onClick={() => setInput('Analyze my revenue: $5000 this month')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Analyze Finances
                  </Button>
                  <Button variant="outline" onClick={() => setInput('Check my campaign performance')}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Check Campaigns
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === 'system' ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                        {message.status === 'running' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span>{message.content}</span>
                        {message.tokensUsed && (
                          <Badge variant="secondary" className="ml-auto">
                            {message.tokensUsed} tokens
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'assistant' && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          {message.role === 'assistant' && message.coreExecuted && (
                            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                              {coreIcons[message.coreExecuted]}
                              <span>{message.coreExecuted.replace('_', ' ')}</span>
                              {message.tokensUsed && (
                                <Badge variant="outline" className="ml-2">
                                  {message.tokensUsed} tokens
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {message.content.split('\n').map((line, i) => (
                              <p key={i} className="mb-1">{line}</p>
                            ))}
                          </div>
                        </div>
                        {message.role === 'user' && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-card/30">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Tell me what you need... (e.g., 'Find top finance products with 50%+ commission')"
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>LLM: OpenAI GPT-4o</span>
              <span>•</span>
              <span>Controller: Manus (Claude 3.5)</span>
              <span>•</span>
              <span>Press Enter to send</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Agent Execution (30%) */}
        <div className="w-[30%] border-l bg-card/30 p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Agent Execution
          </h2>

          {executions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active executions</p>
              <p className="text-xs">Send a message to start</p>
            </div>
          ) : (
            <div className="space-y-4">
              {executions.map((execution) => (
                <Card key={execution.id} className={execution.status === 'running' ? 'border-primary' : ''}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {coreIcons[execution.core]}
                        <CardTitle className="text-sm">{execution.core.replace('_', ' ')}</CardTitle>
                      </div>
                      <Badge variant={execution.status === 'complete' ? 'default' : 'secondary'}>
                        {execution.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      LLM: {execution.llm}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      {execution.agents.map((agent, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          {idx < execution.currentAgent ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : idx === execution.currentAgent && execution.status === 'running' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className={`text-sm ${
                            idx <= execution.currentAgent ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {agent}
                          </span>
                          {idx < execution.agents.length - 1 && idx < execution.currentAgent && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between text-xs text-muted-foreground">
                      <span>{execution.tokensUsed.toLocaleString()} tokens</span>
                      <span>
                        {execution.endTime 
                          ? `${((execution.endTime.getTime() - execution.startTime.getTime()) / 1000).toFixed(1)}s`
                          : 'Running...'
                        }
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div className="mt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Offer Intelligence completed</span>
                <span className="ml-auto text-xs">2m ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Content Generation completed</span>
                <span className="ml-auto text-xs">5m ago</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Knowledge Query completed</span>
                <span className="ml-auto text-xs">8m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

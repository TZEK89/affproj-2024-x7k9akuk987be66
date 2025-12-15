'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Bot, 
  Settings, 
  Zap, 
  Brain, 
  TrendingUp, 
  FileText, 
  DollarSign,
  Activity,
  Database,
  Target,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Save,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  GitBranch,
  MessageSquare,
  BookOpen,
  Sparkles,
  Clock,
  Coins
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  coreId: string;
  framework: 'crewai' | 'autogen' | 'langgraph' | 'llamaindex';
  llm: string;
  enabled: boolean;
  temperature: number;
  maxTokens: number;
  totalRuns: number;
  successRate: number;
  avgTokensPerRun: number;
  lastRun?: string;
}

interface Core {
  id: string;
  name: string;
  description: string;
  framework: string;
  agents: Agent[];
  enabled: boolean;
  totalRuns: number;
  tokensUsed: number;
}

interface LLMConfig {
  id: string;
  name: string;
  provider: string;
  model: string;
  apiKeySet: boolean;
  maxTokens: number;
  costPer1kTokens: number;
  enabled: boolean;
}

interface FrameworkConfig {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  cores: string[];
}

// Initial data
const initialCores: Core[] = [
  {
    id: 'offer_intelligence',
    name: 'Offer Intelligence',
    description: 'Research and analyze affiliate products across platforms',
    framework: 'crewai',
    enabled: true,
    totalRuns: 47,
    tokensUsed: 45892,
    agents: [
      { id: 'oi_researcher', name: 'Market Researcher', role: 'researcher', description: 'Scans marketplaces for products matching criteria', coreId: 'offer_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.7, maxTokens: 2000, totalRuns: 47, successRate: 98, avgTokensPerRun: 312, lastRun: '2 min ago' },
      { id: 'oi_analyst', name: 'Competitor Analyst', role: 'analyst', description: 'Analyzes competition and market positioning', coreId: 'offer_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000, totalRuns: 47, successRate: 96, avgTokensPerRun: 287, lastRun: '2 min ago' },
      { id: 'oi_scorer', name: 'Scoring Agent', role: 'scorer', description: 'Calculates AI scores based on multiple factors', coreId: 'offer_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500, totalRuns: 47, successRate: 100, avgTokensPerRun: 189, lastRun: '2 min ago' }
    ]
  },
  {
    id: 'content_generation',
    name: 'Content Generation',
    description: 'Create marketing content, ads, emails, and social posts',
    framework: 'crewai',
    enabled: true,
    totalRuns: 32,
    tokensUsed: 38450,
    agents: [
      { id: 'cg_copywriter', name: 'Copywriter', role: 'writer', description: 'Creates compelling ad copy and headlines', coreId: 'content_generation', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.8, maxTokens: 3000, totalRuns: 32, successRate: 97, avgTokensPerRun: 456, lastRun: '5 min ago' },
      { id: 'cg_email', name: 'Email Specialist', role: 'email', description: 'Crafts email sequences and subject lines', coreId: 'content_generation', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.7, maxTokens: 2500, totalRuns: 28, successRate: 95, avgTokensPerRun: 389, lastRun: '5 min ago' },
      { id: 'cg_social', name: 'Social Media Expert', role: 'social', description: 'Creates platform-specific social content', coreId: 'content_generation', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.8, maxTokens: 2000, totalRuns: 25, successRate: 98, avgTokensPerRun: 234, lastRun: '8 min ago' },
      { id: 'cg_video', name: 'Video Scripter', role: 'video', description: 'Writes scripts for video ads and content', coreId: 'content_generation', framework: 'crewai', llm: 'gpt-4o', enabled: false, temperature: 0.7, maxTokens: 3000, totalRuns: 12, successRate: 92, avgTokensPerRun: 512, lastRun: '1 day ago' }
    ]
  },
  {
    id: 'campaign_management',
    name: 'Campaign Management',
    description: 'Manage and optimize advertising campaigns',
    framework: 'langgraph',
    enabled: true,
    totalRuns: 18,
    tokensUsed: 21340,
    agents: [
      { id: 'cm_manager', name: 'Campaign Manager', role: 'manager', description: 'Oversees campaign creation and management', coreId: 'campaign_management', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000, totalRuns: 18, successRate: 94, avgTokensPerRun: 445, lastRun: '15 min ago' },
      { id: 'cm_budget', name: 'Budget Optimizer', role: 'optimizer', description: 'Optimizes budget allocation across campaigns', coreId: 'campaign_management', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 1500, totalRuns: 15, successRate: 93, avgTokensPerRun: 312, lastRun: '20 min ago' },
      { id: 'cm_ab', name: 'A/B Test Coordinator', role: 'tester', description: 'Manages A/B testing and analyzes results', coreId: 'campaign_management', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500, totalRuns: 10, successRate: 100, avgTokensPerRun: 278, lastRun: '1 hour ago' }
    ]
  },
  {
    id: 'analytics_engine',
    name: 'Analytics Engine',
    description: 'Analyze performance data and generate insights',
    framework: 'langgraph',
    enabled: true,
    totalRuns: 24,
    tokensUsed: 28900,
    agents: [
      { id: 'ae_analyst', name: 'Data Analyst', role: 'analyst', description: 'Processes and analyzes performance data', coreId: 'analytics_engine', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 2000, totalRuns: 24, successRate: 98, avgTokensPerRun: 367, lastRun: '30 min ago' },
      { id: 'ae_insights', name: 'Insights Generator', role: 'insights', description: 'Generates actionable insights from data', coreId: 'analytics_engine', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.6, maxTokens: 2500, totalRuns: 22, successRate: 95, avgTokensPerRun: 423, lastRun: '35 min ago' },
      { id: 'ae_report', name: 'Report Builder', role: 'reporter', description: 'Creates formatted reports and visualizations', coreId: 'analytics_engine', framework: 'langgraph', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 3000, totalRuns: 20, successRate: 100, avgTokensPerRun: 534, lastRun: '1 hour ago' }
    ]
  },
  {
    id: 'financial_intelligence',
    name: 'Financial Intelligence',
    description: 'Track revenue, expenses, and profitability',
    framework: 'crewai',
    enabled: true,
    totalRuns: 15,
    tokensUsed: 12450,
    agents: [
      { id: 'fi_revenue', name: 'Revenue Tracker', role: 'tracker', description: 'Monitors and categorizes revenue streams', coreId: 'financial_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500, totalRuns: 15, successRate: 100, avgTokensPerRun: 234, lastRun: '45 min ago' },
      { id: 'fi_expense', name: 'Expense Analyzer', role: 'analyzer', description: 'Analyzes and categorizes expenses', coreId: 'financial_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 1500, totalRuns: 15, successRate: 98, avgTokensPerRun: 212, lastRun: '45 min ago' },
      { id: 'fi_profit', name: 'Profit Calculator', role: 'calculator', description: 'Calculates profit margins and ROI', coreId: 'financial_intelligence', framework: 'crewai', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1000, totalRuns: 15, successRate: 100, avgTokensPerRun: 178, lastRun: '45 min ago' }
    ]
  },
  {
    id: 'automation_hub',
    name: 'Automation Hub',
    description: 'Automate workflows and scheduled tasks',
    framework: 'langgraph',
    enabled: false,
    totalRuns: 8,
    tokensUsed: 6780,
    agents: [
      { id: 'ah_workflow', name: 'Workflow Manager', role: 'manager', description: 'Manages automated workflow execution', coreId: 'automation_hub', framework: 'langgraph', llm: 'gpt-4o', enabled: false, temperature: 0.4, maxTokens: 2000, totalRuns: 8, successRate: 88, avgTokensPerRun: 345, lastRun: '2 days ago' },
      { id: 'ah_scheduler', name: 'Scheduler', role: 'scheduler', description: 'Handles task scheduling and triggers', coreId: 'automation_hub', framework: 'langgraph', llm: 'gpt-4o', enabled: false, temperature: 0.3, maxTokens: 1000, totalRuns: 6, successRate: 83, avgTokensPerRun: 189, lastRun: '2 days ago' },
      { id: 'ah_trigger', name: 'Trigger Handler', role: 'handler', description: 'Processes event triggers and conditions', coreId: 'automation_hub', framework: 'langgraph', llm: 'gpt-4o', enabled: false, temperature: 0.3, maxTokens: 1000, totalRuns: 5, successRate: 80, avgTokensPerRun: 156, lastRun: '3 days ago' }
    ]
  },
  {
    id: 'integration_layer',
    name: 'Integration Layer',
    description: 'Connect with external APIs and services',
    framework: 'autogen',
    enabled: true,
    totalRuns: 56,
    tokensUsed: 34200,
    agents: [
      { id: 'il_gateway', name: 'API Gateway', role: 'gateway', description: 'Manages API connections and authentication', coreId: 'integration_layer', framework: 'autogen', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1500, totalRuns: 56, successRate: 99, avgTokensPerRun: 234, lastRun: '1 min ago' },
      { id: 'il_mcp', name: 'MCP Connector', role: 'connector', description: 'Connects to MCP servers (Supabase, Vercel, etc.)', coreId: 'integration_layer', framework: 'autogen', llm: 'gpt-4o', enabled: true, temperature: 0.2, maxTokens: 1500, totalRuns: 45, successRate: 98, avgTokensPerRun: 198, lastRun: '3 min ago' },
      { id: 'il_sync', name: 'Data Sync Manager', role: 'sync', description: 'Synchronizes data across platforms', coreId: 'integration_layer', framework: 'autogen', llm: 'gpt-4o', enabled: true, temperature: 0.3, maxTokens: 2000, totalRuns: 38, successRate: 97, avgTokensPerRun: 287, lastRun: '10 min ago' }
    ]
  },
  {
    id: 'personalization_engine',
    name: 'Personalization Engine',
    description: 'Personalize content and recommendations',
    framework: 'llamaindex',
    enabled: true,
    totalRuns: 22,
    tokensUsed: 18900,
    agents: [
      { id: 'pe_profile', name: 'Profile Manager', role: 'profiler', description: 'Manages user profiles and preferences', coreId: 'personalization_engine', framework: 'llamaindex', llm: 'gpt-4o', enabled: true, temperature: 0.4, maxTokens: 1500, totalRuns: 22, successRate: 95, avgTokensPerRun: 267, lastRun: '20 min ago' },
      { id: 'pe_recommend', name: 'Recommender', role: 'recommender', description: 'Generates personalized recommendations', coreId: 'personalization_engine', framework: 'llamaindex', llm: 'gpt-4o', enabled: true, temperature: 0.6, maxTokens: 2000, totalRuns: 20, successRate: 94, avgTokensPerRun: 345, lastRun: '25 min ago' },
      { id: 'pe_segment', name: 'Segment Analyzer', role: 'segmenter', description: 'Analyzes and creates audience segments', coreId: 'personalization_engine', framework: 'llamaindex', llm: 'gpt-4o', enabled: true, temperature: 0.5, maxTokens: 2000, totalRuns: 18, successRate: 92, avgTokensPerRun: 312, lastRun: '30 min ago' }
    ]
  }
];

const initialLLMs: LLMConfig[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', model: 'gpt-4o', apiKeySet: true, maxTokens: 128000, costPer1kTokens: 0.03, enabled: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', model: 'gpt-4o-mini', apiKeySet: true, maxTokens: 128000, costPer1kTokens: 0.00015, enabled: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', model: 'claude-3-5-sonnet-20241022', apiKeySet: true, maxTokens: 200000, costPer1kTokens: 0.003, enabled: true },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', model: 'claude-3-opus-20240229', apiKeySet: true, maxTokens: 200000, costPer1kTokens: 0.015, enabled: false },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'Google', model: 'gemini-1.5-pro', apiKeySet: false, maxTokens: 1000000, costPer1kTokens: 0.00125, enabled: false }
];

const initialFrameworks: FrameworkConfig[] = [
  { id: 'langgraph', name: 'LangGraph', version: '1.0.5', description: 'Master orchestrator for complex workflows and state management', enabled: true, cores: ['campaign_management', 'analytics_engine', 'automation_hub'] },
  { id: 'crewai', name: 'CrewAI', version: '1.7.0', description: 'Role-based agent teams with task delegation', enabled: true, cores: ['offer_intelligence', 'content_generation', 'financial_intelligence'] },
  { id: 'autogen', name: 'AutoGen', version: '0.7.5', description: 'Conversational agents with code execution', enabled: true, cores: ['integration_layer'] },
  { id: 'llamaindex', name: 'LlamaIndex', version: '0.14.3', description: 'Knowledge base and RAG for SOPs', enabled: true, cores: ['personalization_engine'] }
];

// Core icons
const coreIcons: Record<string, React.ReactNode> = {
  offer_intelligence: <Brain className="h-5 w-5" />,
  content_generation: <FileText className="h-5 w-5" />,
  campaign_management: <TrendingUp className="h-5 w-5" />,
  analytics_engine: <BarChart3 className="h-5 w-5" />,
  automation_hub: <Zap className="h-5 w-5" />,
  financial_intelligence: <DollarSign className="h-5 w-5" />,
  integration_layer: <Database className="h-5 w-5" />,
  personalization_engine: <Target className="h-5 w-5" />
};

// Framework icons
const frameworkIcons: Record<string, React.ReactNode> = {
  langgraph: <GitBranch className="h-4 w-4" />,
  crewai: <Layers className="h-4 w-4" />,
  autogen: <MessageSquare className="h-4 w-4" />,
  llamaindex: <BookOpen className="h-4 w-4" />
};

export default function AgentManagement() {
  const [cores, setCores] = useState<Core[]>(initialCores);
  const [llms, setLLMs] = useState<LLMConfig[]>(initialLLMs);
  const [frameworks, setFrameworks] = useState<FrameworkConfig[]>(initialFrameworks);
  const [selectedCore, setSelectedCore] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('agents');

  // Calculate totals
  const totalAgents = cores.reduce((sum, core) => sum + core.agents.length, 0);
  const enabledAgents = cores.reduce((sum, core) => sum + core.agents.filter(a => a.enabled).length, 0);
  const totalTokens = cores.reduce((sum, core) => sum + core.tokensUsed, 0);
  const totalRuns = cores.reduce((sum, core) => sum + core.totalRuns, 0);

  // Toggle agent enabled state
  const toggleAgent = (coreId: string, agentId: string) => {
    setCores(prev => prev.map(core => {
      if (core.id === coreId) {
        return {
          ...core,
          agents: core.agents.map(agent => 
            agent.id === agentId ? { ...agent, enabled: !agent.enabled } : agent
          )
        };
      }
      return core;
    }));
  };

  // Toggle core enabled state
  const toggleCore = (coreId: string) => {
    setCores(prev => prev.map(core => 
      core.id === coreId ? { ...core, enabled: !core.enabled } : core
    ));
  };

  // Update agent settings
  const updateAgent = (updatedAgent: Agent) => {
    setCores(prev => prev.map(core => {
      if (core.id === updatedAgent.coreId) {
        return {
          ...core,
          agents: core.agents.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          )
        };
      }
      return core;
    }));
    setEditingAgent(null);
  };

  // Toggle LLM
  const toggleLLM = (llmId: string) => {
    setLLMs(prev => prev.map(llm => 
      llm.id === llmId ? { ...llm, enabled: !llm.enabled } : llm
    ));
  };

  // Toggle Framework
  const toggleFramework = (frameworkId: string) => {
    setFrameworks(prev => prev.map(fw => 
      fw.id === frameworkId ? { ...fw, enabled: !fw.enabled } : fw
    ));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Agent Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure and manage your AI agents across all 8 cores
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{enabledAgents}/{totalAgents} Agents Active</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{totalTokens.toLocaleString()} Tokens Used</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">{totalRuns} Total Runs</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="agents" className="gap-2">
            <Bot className="h-4 w-4" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="cores" className="gap-2">
            <Cpu className="h-4 w-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="llms" className="gap-2">
            <Sparkles className="h-4 w-4" />
            LLMs
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2">
            <Layers className="h-4 w-4" />
            Frameworks
          </TabsTrigger>
        </TabsList>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">AI Cores</CardTitle>
                <CardDescription>Select a core to view its agents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {cores.map((core) => (
                      <div
                        key={core.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedCore === core.id 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:bg-accent/50'
                        } ${!core.enabled ? 'opacity-50' : ''}`}
                        onClick={() => setSelectedCore(core.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {coreIcons[core.id]}
                            <span className="font-medium">{core.name}</span>
                          </div>
                          <Badge variant={core.enabled ? 'default' : 'secondary'}>
                            {core.agents.filter(a => a.enabled).length}/{core.agents.length}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {frameworkIcons[core.framework]}
                            {core.framework}
                          </span>
                          <span>{core.totalRuns} runs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Agent List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedCore 
                    ? cores.find(c => c.id === selectedCore)?.name + ' Agents'
                    : 'All Agents'
                  }
                </CardTitle>
                <CardDescription>
                  {selectedCore 
                    ? cores.find(c => c.id === selectedCore)?.description
                    : 'Select a core to filter agents'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>LLM</TableHead>
                      <TableHead>Runs</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead>Tokens/Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedCore 
                      ? cores.find(c => c.id === selectedCore)?.agents || []
                      : cores.flatMap(c => c.agents)
                    ).map((agent) => (
                      <TableRow key={agent.id} className={!agent.enabled ? 'opacity-50' : ''}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-xs text-muted-foreground">{agent.role}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.llm}</Badge>
                        </TableCell>
                        <TableCell>{agent.totalRuns}</TableCell>
                        <TableCell>
                          <span className={agent.successRate >= 95 ? 'text-green-500' : agent.successRate >= 85 ? 'text-yellow-500' : 'text-red-500'}>
                            {agent.successRate}%
                          </span>
                        </TableCell>
                        <TableCell>{agent.avgTokensPerRun}</TableCell>
                        <TableCell>
                          <Switch
                            checked={agent.enabled}
                            onCheckedChange={() => toggleAgent(agent.coreId, agent.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingAgent(agent)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cores Tab */}
        <TabsContent value="cores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cores.map((core) => (
              <Card key={core.id} className={!core.enabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {coreIcons[core.id]}
                      <CardTitle className="text-base">{core.name}</CardTitle>
                    </div>
                    <Switch
                      checked={core.enabled}
                      onCheckedChange={() => toggleCore(core.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{core.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Framework</span>
                      <Badge variant="outline" className="gap-1">
                        {frameworkIcons[core.framework]}
                        {core.framework}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Agents</span>
                      <span>{core.agents.filter(a => a.enabled).length}/{core.agents.length} active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Runs</span>
                      <span>{core.totalRuns}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tokens Used</span>
                      <span>{core.tokensUsed.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LLMs Tab */}
        <TabsContent value="llms" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {llms.map((llm) => (
              <Card key={llm.id} className={!llm.enabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{llm.name}</CardTitle>
                    <Switch
                      checked={llm.enabled}
                      onCheckedChange={() => toggleLLM(llm.id)}
                    />
                  </div>
                  <CardDescription>{llm.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Model</span>
                      <code className="text-xs bg-muted px-1 rounded">{llm.model}</code>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Max Tokens</span>
                      <span>{llm.maxTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cost/1k tokens</span>
                      <span>${llm.costPer1kTokens}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>API Key</span>
                      {llm.apiKeySet ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Set
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Missing
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Frameworks Tab */}
        <TabsContent value="frameworks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {frameworks.map((fw) => (
              <Card key={fw.id} className={!fw.enabled ? 'opacity-60' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {frameworkIcons[fw.id]}
                      <CardTitle className="text-base">{fw.name}</CardTitle>
                      <Badge variant="outline">v{fw.version}</Badge>
                    </div>
                    <Switch
                      checked={fw.enabled}
                      onCheckedChange={() => toggleFramework(fw.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{fw.description}</p>
                  <div>
                    <span className="text-sm font-medium">Used by cores:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {fw.cores.map(coreId => (
                        <Badge key={coreId} variant="secondary" className="gap-1">
                          {coreIcons[coreId]}
                          {cores.find(c => c.id === coreId)?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Agent: {editingAgent?.name}</DialogTitle>
            <DialogDescription>
              Configure agent settings and parameters
            </DialogDescription>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>LLM Model</Label>
                <Select 
                  value={editingAgent.llm}
                  onValueChange={(value) => setEditingAgent({...editingAgent, llm: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {llms.filter(l => l.enabled).map(llm => (
                      <SelectItem key={llm.id} value={llm.id}>{llm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Temperature: {editingAgent.temperature}</Label>
                <Slider
                  value={[editingAgent.temperature]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => setEditingAgent({...editingAgent, temperature: value})}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more focused, Higher = more creative
                </p>
              </div>
              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={editingAgent.maxTokens}
                  onChange={(e) => setEditingAgent({...editingAgent, maxTokens: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Enabled</Label>
                <Switch
                  checked={editingAgent.enabled}
                  onCheckedChange={(checked) => setEditingAgent({...editingAgent, enabled: checked})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAgent(null)}>Cancel</Button>
            <Button onClick={() => editingAgent && updateAgent(editingAgent)}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

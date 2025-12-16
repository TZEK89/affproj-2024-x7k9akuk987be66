'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Zap,
  Brain,
  FileText,
  Activity,
  Target,
  Coins,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Award,
  Sparkles,
  Filter,
  Download,
  RefreshCw,
  Calendar
} from 'lucide-react';

// Types
interface LLMCost {
  id: string;
  name: string;
  model: string;
  costPer1kTokens: number;
  totalTokensUsed: number;
  totalCost: number;
  taskCount: number;
  avgCostPerTask: number;
  costTrend: number;
}

interface AgentCost {
  id: string;
  name: string;
  coreId: string;
  coreName: string;
  llmUsed: string;
  totalTasks: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerTask: number;
  revenue: number;
  roi: number;
  roiTrend: number;
  profitability: 'high' | 'medium' | 'low' | 'negative';
}

interface CoreCost {
  id: string;
  name: string;
  totalTasks: number;
  totalTokens: number;
  totalCost: number;
  totalRevenue: number;
  roi: number;
  agents: AgentCost[];
}

interface CostBreakdown {
  byLLM: LLMCost[];
  byAgent: AgentCost[];
  byCore: CoreCost[];
  byTaskType: TaskTypeCost[];
  summary: CostSummary;
}

interface TaskTypeCost {
  type: string;
  taskCount: number;
  totalTokens: number;
  totalCost: number;
  avgCostPerTask: number;
  avgRevenue: number;
  roi: number;
}

interface CostSummary {
  totalCost: number;
  totalRevenue: number;
  totalROI: number;
  costTrend: number;
  revenueTrend: number;
  roiTrend: number;
  costPerTask: number;
  revenuePerTask: number;
  profitPerTask: number;
  mostExpensiveAgent: string;
  mostProfitableAgent: string;
  costSavingsOpportunity: number;
}

// Mock data
const generateCostData = (): CostBreakdown => ({
  byLLM: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      model: 'gpt-4o',
      costPer1kTokens: 0.03,
      totalTokensUsed: 125000,
      totalCost: 3.75,
      taskCount: 156,
      avgCostPerTask: 0.024,
      costTrend: 2.5
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      model: 'gpt-4o-mini',
      costPer1kTokens: 0.00015,
      totalTokensUsed: 45000,
      totalCost: 0.0068,
      taskCount: 89,
      avgCostPerTask: 0.000076,
      costTrend: -1.2
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      model: 'claude-3-5-sonnet-20241022',
      costPer1kTokens: 0.003,
      totalTokensUsed: 78000,
      totalCost: 0.234,
      taskCount: 72,
      avgCostPerTask: 0.00325,
      costTrend: 0.8
    }
  ],
  byAgent: [
    {
      id: 'oi_researcher',
      name: 'Market Researcher',
      coreId: 'offer_intelligence',
      coreName: 'Offer Intelligence',
      llmUsed: 'gpt-4o',
      totalTasks: 156,
      totalTokens: 48672,
      totalCost: 1.46,
      avgCostPerTask: 0.0094,
      revenue: 234.50,
      roi: 15950,
      roiTrend: 12.5,
      profitability: 'high'
    },
    {
      id: 'oi_analyst',
      name: 'Competitor Analyst',
      coreId: 'offer_intelligence',
      coreName: 'Offer Intelligence',
      llmUsed: 'gpt-4o',
      totalTasks: 148,
      totalTokens: 42476,
      totalCost: 1.27,
      avgCostPerTask: 0.0086,
      revenue: 198.75,
      roi: 15540,
      roiTrend: 8.3,
      profitability: 'high'
    },
    {
      id: 'oi_scorer',
      name: 'Scoring Agent',
      coreId: 'offer_intelligence',
      coreName: 'Offer Intelligence',
      llmUsed: 'gpt-4o',
      totalTasks: 156,
      totalTokens: 29484,
      totalCost: 0.88,
      avgCostPerTask: 0.0056,
      revenue: 312.00,
      roi: 35364,
      roiTrend: 18.7,
      profitability: 'high'
    },
    {
      id: 'cg_copywriter',
      name: 'Copywriter',
      coreId: 'content_generation',
      coreName: 'Content Generation',
      llmUsed: 'gpt-4o',
      totalTasks: 89,
      totalTokens: 40584,
      totalCost: 1.22,
      avgCostPerTask: 0.0137,
      revenue: 267.00,
      roi: 21885,
      roiTrend: 5.2,
      profitability: 'high'
    },
    {
      id: 'cg_email',
      name: 'Email Specialist',
      coreId: 'content_generation',
      coreName: 'Content Generation',
      llmUsed: 'gpt-4o',
      totalTasks: 72,
      totalTokens: 28008,
      totalCost: 0.84,
      avgCostPerTask: 0.0117,
      revenue: 144.00,
      roi: 17043,
      roiTrend: -2.1,
      profitability: 'high'
    },
    {
      id: 'fi_revenue',
      name: 'Revenue Tracker',
      coreId: 'financial_intelligence',
      coreName: 'Financial Intelligence',
      llmUsed: 'gpt-4o-mini',
      totalTasks: 45,
      totalTokens: 10530,
      totalCost: 0.0016,
      avgCostPerTask: 0.000036,
      revenue: 450.00,
      roi: 28125000,
      roiTrend: 22.3,
      profitability: 'high'
    },
    {
      id: 'cm_manager',
      name: 'Campaign Manager',
      coreId: 'campaign_management',
      coreName: 'Campaign Management',
      llmUsed: 'gpt-4o',
      totalTasks: 38,
      totalTokens: 16910,
      totalCost: 0.51,
      avgCostPerTask: 0.0134,
      revenue: 95.00,
      roi: 18627,
      roiTrend: 3.8,
      profitability: 'medium'
    }
  ],
  byCore: [
    {
      id: 'offer_intelligence',
      name: 'Offer Intelligence',
      totalTasks: 460,
      totalTokens: 120632,
      totalCost: 3.61,
      totalRevenue: 745.25,
      roi: 20543,
      agents: []
    },
    {
      id: 'content_generation',
      name: 'Content Generation',
      totalTasks: 161,
      totalTokens: 68592,
      totalCost: 2.06,
      totalRevenue: 411.00,
      roi: 19951,
      agents: []
    },
    {
      id: 'financial_intelligence',
      name: 'Financial Intelligence',
      totalTasks: 45,
      totalTokens: 10530,
      totalCost: 0.0016,
      totalRevenue: 450.00,
      roi: 28125000,
      agents: []
    },
    {
      id: 'campaign_management',
      name: 'Campaign Management',
      totalTasks: 38,
      totalTokens: 16910,
      totalCost: 0.51,
      totalRevenue: 95.00,
      roi: 18627,
      agents: []
    }
  ],
  byTaskType: [
    {
      type: 'Product Research',
      taskCount: 156,
      totalTokens: 48672,
      totalCost: 1.46,
      avgCostPerTask: 0.0094,
      avgRevenue: 1.50,
      roi: 15950
    },
    {
      type: 'Content Creation',
      taskCount: 161,
      totalTokens: 68592,
      totalCost: 2.06,
      avgCostPerTask: 0.0128,
      avgRevenue: 2.55,
      roi: 19951
    },
    {
      type: 'Financial Analysis',
      taskCount: 45,
      totalTokens: 10530,
      totalCost: 0.0016,
      avgCostPerTask: 0.000036,
      avgRevenue: 10.00,
      roi: 28125000
    },
    {
      type: 'Campaign Management',
      taskCount: 38,
      totalTokens: 16910,
      totalCost: 0.51,
      avgCostPerTask: 0.0134,
      avgRevenue: 2.50,
      roi: 18627
    }
  ],
  summary: {
    totalCost: 6.21,
    totalRevenue: 1701.25,
    totalROI: 27305,
    costTrend: 1.2,
    revenueTrend: 8.5,
    roiTrend: 12.3,
    costPerTask: 0.0118,
    revenuePerTask: 3.24,
    profitPerTask: 3.23,
    mostExpensiveAgent: 'Copywriter',
    mostProfitableAgent: 'Revenue Tracker',
    costSavingsOpportunity: 0.68
  }
};

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(value);
};

const formatROI = (roi: number): string => {
  if (roi > 1000000) return `${(roi / 1000000).toFixed(1)}M%`;
  if (roi > 1000) return `${(roi / 1000).toFixed(1)}K%`;
  return `${roi.toFixed(0)}%`;
};

const getROIColor = (roi: number): string => {
  if (roi >= 10000) return 'text-green-500';
  if (roi >= 1000) return 'text-emerald-500';
  if (roi >= 100) return 'text-blue-500';
  return 'text-yellow-500';
};

const getProfitabilityColor = (profitability: string): string => {
  switch (profitability) {
    case 'high': return 'bg-green-500/10 border-green-500/20 text-green-700';
    case 'medium': return 'bg-blue-500/10 border-blue-500/20 text-blue-700';
    case 'low': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700';
    case 'negative': return 'bg-red-500/10 border-red-500/20 text-red-700';
    default: return '';
  }
};

export function CostROIAnalysis() {
  const [data, setData] = useState<CostBreakdown>(generateCostData());
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [sortBy, setSortBy] = useState<string>('cost');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(data.summary.totalCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.costTrend > 0 ? '+' : ''}{data.summary.costTrend}% trend
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(data.summary.totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{data.summary.revenueTrend}% trend
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total ROI</p>
                <p className={`text-2xl font-bold ${getROIColor(data.summary.totalROI)}`}>
                  {formatROI(data.summary.totalROI)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  +{data.summary.roiTrend}% trend
                </p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Profit/Task</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(data.summary.profitPerTask)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.summary.costPerTask.toFixed(4)} cost
                </p>
              </div>
              <Percent className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Savings Opportunity</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(data.summary.costSavingsOpportunity)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Potential savings
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="by-llm" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="by-llm" className="gap-2">
            <Brain className="h-4 w-4" />
            By LLM
          </TabsTrigger>
          <TabsTrigger value="by-agent" className="gap-2">
            <Target className="h-4 w-4" />
            By Agent
          </TabsTrigger>
          <TabsTrigger value="by-core" className="gap-2">
            <Activity className="h-4 w-4" />
            By Core
          </TabsTrigger>
          <TabsTrigger value="by-task" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            By Task Type
          </TabsTrigger>
        </TabsList>

        {/* By LLM */}
        <TabsContent value="by-llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown by LLM Model</CardTitle>
              <CardDescription>
                Compare costs across different language models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.byLLM.map((llm) => {
                  const costPercentage = (llm.totalCost / data.summary.totalCost) * 100;
                  return (
                    <div key={llm.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{llm.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {llm.model} • {llm.costPer1kTokens}/1k tokens
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(llm.totalCost)}</p>
                          <p className="text-sm text-muted-foreground">{costPercentage.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <Progress value={costPercentage} className="mb-2" />
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tasks</p>
                          <p className="font-medium">{llm.taskCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Tokens</p>
                          <p className="font-medium">{(llm.totalTokensUsed / 1000).toFixed(1)}k</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Cost/Task</p>
                          <p className="font-medium">{formatCurrency(llm.avgCostPerTask)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Trend</p>
                          <p className={llm.costTrend > 0 ? 'font-medium text-red-500' : 'font-medium text-green-500'}>
                            {llm.costTrend > 0 ? '+' : ''}{llm.costTrend}%
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Agent */}
        <TabsContent value="by-agent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Analysis by Agent</CardTitle>
              <CardDescription>
                Track costs, revenue, and ROI for each agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Core</TableHead>
                    <TableHead>LLM</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>ROI</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byAgent.map((agent) => {
                    const profit = agent.revenue - agent.totalCost;
                    return (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell className="text-sm">{agent.coreName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{agent.llmUsed}</Badge>
                        </TableCell>
                        <TableCell>{agent.totalTasks}</TableCell>
                        <TableCell className="text-red-500">{formatCurrency(agent.totalCost)}</TableCell>
                        <TableCell className="text-green-500">{formatCurrency(agent.revenue)}</TableCell>
                        <TableCell className={profit > 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                          {formatCurrency(profit)}
                        </TableCell>
                        <TableCell className={getROIColor(agent.roi)}>
                          <span className="font-bold">{formatROI(agent.roi)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProfitabilityColor(agent.profitability)}>
                            {agent.profitability}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Core */}
        <TabsContent value="by-core" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.byCore.map((core) => {
              const profit = core.totalRevenue - core.totalCost;
              const profitMargin = (profit / core.totalRevenue) * 100;
              return (
                <Card key={core.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{core.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(core.totalCost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold text-green-500">{formatCurrency(core.totalRevenue)}</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">Profit</p>
                        <p className={`text-lg font-bold ${profit > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(profit)}
                        </p>
                      </div>
                      <Progress value={Math.min(profitMargin, 100)} className="mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {profitMargin.toFixed(1)}% profit margin
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">ROI</p>
                        <p className={`text-lg font-bold ${getROIColor(core.roi)}`}>
                          {formatROI(core.roi)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {core.totalTasks} tasks • {(core.totalTokens / 1000).toFixed(1)}k tokens
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* By Task Type */}
        <TabsContent value="by-task" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost & ROI by Task Type</CardTitle>
              <CardDescription>
                Analyze profitability of different task categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Type</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Avg Cost/Task</TableHead>
                    <TableHead>Avg Revenue/Task</TableHead>
                    <TableHead>Profit/Task</TableHead>
                    <TableHead>ROI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.byTaskType.map((task) => {
                    const profitPerTask = task.avgRevenue - task.avgCostPerTask;
                    return (
                      <TableRow key={task.type}>
                        <TableCell className="font-medium">{task.type}</TableCell>
                        <TableCell>{task.taskCount}</TableCell>
                        <TableCell>{(task.totalTokens / 1000).toFixed(1)}k</TableCell>
                        <TableCell className="text-red-500">{formatCurrency(task.totalCost)}</TableCell>
                        <TableCell>{formatCurrency(task.avgCostPerTask)}</TableCell>
                        <TableCell className="text-green-500">{formatCurrency(task.avgRevenue)}</TableCell>
                        <TableCell className={profitPerTask > 0 ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                          {formatCurrency(profitPerTask)}
                        </TableCell>
                        <TableCell className={getROIColor(task.roi)}>
                          <span className="font-bold">{formatROI(task.roi)}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Cost Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Revenue Tracker - Exceptional ROI</p>
                <p className="text-sm text-muted-foreground">
                  This agent has a 28,125,000% ROI using GPT-4o-mini. Consider allocating more tasks to this agent.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-500">Switch Campaign Manager to GPT-4o-mini</p>
                <p className="text-sm text-muted-foreground">
                  Current cost: $0.51. Switching to GPT-4o-mini could reduce this to ~$0.08 with minimal accuracy loss.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-500">Increase Email Specialist Workload</p>
                <p className="text-sm text-muted-foreground">
                  Despite trending down, this agent has strong ROI (17,043%). Optimize prompts and increase task allocation.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-purple-500">Potential Savings: $0.68</p>
                <p className="text-sm text-muted-foreground">
                  By optimizing LLM selection and reducing token usage, you could save ~$0.68 monthly while maintaining quality.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

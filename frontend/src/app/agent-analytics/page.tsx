'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CostROIAnalysis } from './cost-roi-analysis';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Brain,
  FileText,
  DollarSign,
  Activity,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Award,
  Gauge,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Bot,
  Coins,
  Timer,
  Percent,
  Star,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';

// Types
interface AgentMetrics {
  id: string;
  name: string;
  coreId: string;
  coreName: string;
  
  // Performance Metrics
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  successRate: number;
  
  // Accuracy Metrics
  accuracyScore: number;
  precisionScore: number;
  recallScore: number;
  f1Score: number;
  
  // Decision Quality
  decisionAccuracy: number;
  falsePositives: number;
  falseNegatives: number;
  confidenceAvg: number;
  
  // Efficiency Metrics
  avgResponseTime: number;
  avgTokensUsed: number;
  costEfficiency: number;
  throughput: number;
  
  // Trend
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  
  // Recent Performance
  last7Days: number[];
  lastUpdated: string;
}

interface CoreAnalytics {
  id: string;
  name: string;
  overallScore: number;
  agents: AgentMetrics[];
  totalTasks: number;
  successRate: number;
  avgAccuracy: number;
  totalTokens: number;
  totalCost: number;
}

interface TaskExecution {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  coreId: string;
  task: string;
  status: 'success' | 'failed' | 'partial';
  accuracy: number;
  confidence: number;
  tokensUsed: number;
  responseTime: number;
  feedback?: 'positive' | 'negative' | null;
}

// Mock data generator
const generateAgentMetrics = (): AgentMetrics[] => [
  {
    id: 'oi_researcher', name: 'Market Researcher', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
    totalTasks: 156, successfulTasks: 152, failedTasks: 4, successRate: 97.4,
    accuracyScore: 94.2, precisionScore: 92.8, recallScore: 95.6, f1Score: 94.2,
    decisionAccuracy: 91.5, falsePositives: 8, falseNegatives: 5, confidenceAvg: 87.3,
    avgResponseTime: 2.3, avgTokensUsed: 312, costEfficiency: 94.5, throughput: 26.0,
    trend: 'up', trendValue: 3.2, last7Days: [92, 94, 93, 95, 94, 96, 97], lastUpdated: '2 min ago'
  },
  {
    id: 'oi_analyst', name: 'Competitor Analyst', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
    totalTasks: 148, successfulTasks: 142, failedTasks: 6, successRate: 95.9,
    accuracyScore: 91.8, precisionScore: 90.5, recallScore: 93.1, f1Score: 91.8,
    decisionAccuracy: 89.2, falsePositives: 12, falseNegatives: 7, confidenceAvg: 84.6,
    avgResponseTime: 3.1, avgTokensUsed: 287, costEfficiency: 91.2, throughput: 21.1,
    trend: 'up', trendValue: 2.1, last7Days: [88, 90, 89, 91, 92, 91, 93], lastUpdated: '2 min ago'
  },
  {
    id: 'oi_scorer', name: 'Scoring Agent', coreId: 'offer_intelligence', coreName: 'Offer Intelligence',
    totalTasks: 156, successfulTasks: 155, failedTasks: 1, successRate: 99.4,
    accuracyScore: 96.8, precisionScore: 97.2, recallScore: 96.4, f1Score: 96.8,
    decisionAccuracy: 95.3, falsePositives: 3, falseNegatives: 4, confidenceAvg: 92.1,
    avgResponseTime: 1.8, avgTokensUsed: 189, costEfficiency: 97.8, throughput: 34.7,
    trend: 'stable', trendValue: 0.3, last7Days: [96, 97, 96, 97, 97, 96, 97], lastUpdated: '2 min ago'
  },
  {
    id: 'cg_copywriter', name: 'Copywriter', coreId: 'content_generation', coreName: 'Content Generation',
    totalTasks: 89, successfulTasks: 86, failedTasks: 3, successRate: 96.6,
    accuracyScore: 88.5, precisionScore: 87.2, recallScore: 89.8, f1Score: 88.5,
    decisionAccuracy: 85.4, falsePositives: 6, falseNegatives: 8, confidenceAvg: 81.2,
    avgResponseTime: 4.2, avgTokensUsed: 456, costEfficiency: 86.3, throughput: 14.8,
    trend: 'up', trendValue: 4.5, last7Days: [82, 84, 85, 87, 88, 89, 90], lastUpdated: '5 min ago'
  },
  {
    id: 'cg_email', name: 'Email Specialist', coreId: 'content_generation', coreName: 'Content Generation',
    totalTasks: 72, successfulTasks: 68, failedTasks: 4, successRate: 94.4,
    accuracyScore: 86.2, precisionScore: 85.8, recallScore: 86.6, f1Score: 86.2,
    decisionAccuracy: 83.7, falsePositives: 9, falseNegatives: 6, confidenceAvg: 79.5,
    avgResponseTime: 3.8, avgTokensUsed: 389, costEfficiency: 84.1, throughput: 12.0,
    trend: 'down', trendValue: -1.8, last7Days: [88, 87, 86, 85, 86, 85, 84], lastUpdated: '5 min ago'
  },
  {
    id: 'cg_social', name: 'Social Media Expert', coreId: 'content_generation', coreName: 'Content Generation',
    totalTasks: 65, successfulTasks: 63, failedTasks: 2, successRate: 96.9,
    accuracyScore: 89.7, precisionScore: 88.9, recallScore: 90.5, f1Score: 89.7,
    decisionAccuracy: 87.2, falsePositives: 5, falseNegatives: 5, confidenceAvg: 83.8,
    avgResponseTime: 2.9, avgTokensUsed: 234, costEfficiency: 90.4, throughput: 16.3,
    trend: 'up', trendValue: 2.8, last7Days: [86, 87, 88, 89, 89, 90, 91], lastUpdated: '8 min ago'
  },
  {
    id: 'fi_revenue', name: 'Revenue Tracker', coreId: 'financial_intelligence', coreName: 'Financial Intelligence',
    totalTasks: 45, successfulTasks: 45, failedTasks: 0, successRate: 100.0,
    accuracyScore: 98.5, precisionScore: 98.8, recallScore: 98.2, f1Score: 98.5,
    decisionAccuracy: 97.8, falsePositives: 1, falseNegatives: 1, confidenceAvg: 95.6,
    avgResponseTime: 1.5, avgTokensUsed: 234, costEfficiency: 98.2, throughput: 30.0,
    trend: 'stable', trendValue: 0.1, last7Days: [98, 98, 99, 98, 98, 99, 98], lastUpdated: '45 min ago'
  },
  {
    id: 'fi_expense', name: 'Expense Analyzer', coreId: 'financial_intelligence', coreName: 'Financial Intelligence',
    totalTasks: 45, successfulTasks: 44, failedTasks: 1, successRate: 97.8,
    accuracyScore: 95.2, precisionScore: 94.8, recallScore: 95.6, f1Score: 95.2,
    decisionAccuracy: 93.5, falsePositives: 3, falseNegatives: 2, confidenceAvg: 91.2,
    avgResponseTime: 1.8, avgTokensUsed: 212, costEfficiency: 95.8, throughput: 25.0,
    trend: 'up', trendValue: 1.5, last7Days: [93, 94, 94, 95, 95, 96, 96], lastUpdated: '45 min ago'
  },
  {
    id: 'cm_manager', name: 'Campaign Manager', coreId: 'campaign_management', coreName: 'Campaign Management',
    totalTasks: 38, successfulTasks: 35, failedTasks: 3, successRate: 92.1,
    accuracyScore: 87.5, precisionScore: 86.2, recallScore: 88.8, f1Score: 87.5,
    decisionAccuracy: 84.3, falsePositives: 7, falseNegatives: 5, confidenceAvg: 80.1,
    avgResponseTime: 4.5, avgTokensUsed: 445, costEfficiency: 82.6, throughput: 8.4,
    trend: 'up', trendValue: 3.8, last7Days: [81, 83, 84, 86, 87, 88, 89], lastUpdated: '15 min ago'
  },
  {
    id: 'ae_analyst', name: 'Data Analyst', coreId: 'analytics_engine', coreName: 'Analytics Engine',
    totalTasks: 52, successfulTasks: 51, failedTasks: 1, successRate: 98.1,
    accuracyScore: 93.8, precisionScore: 93.2, recallScore: 94.4, f1Score: 93.8,
    decisionAccuracy: 91.6, falsePositives: 4, falseNegatives: 3, confidenceAvg: 88.9,
    avgResponseTime: 3.2, avgTokensUsed: 367, costEfficiency: 91.5, throughput: 16.3,
    trend: 'stable', trendValue: 0.5, last7Days: [93, 94, 93, 94, 94, 93, 94], lastUpdated: '30 min ago'
  }
];

const generateTaskExecutions = (): TaskExecution[] => [
  { id: '1', timestamp: '2 min ago', agentId: 'oi_researcher', agentName: 'Market Researcher', coreId: 'offer_intelligence', task: 'Find top finance products', status: 'success', accuracy: 96, confidence: 92, tokensUsed: 315, responseTime: 2.1, feedback: 'positive' },
  { id: '2', timestamp: '5 min ago', agentId: 'cg_copywriter', agentName: 'Copywriter', coreId: 'content_generation', task: 'Create ad copy for crypto course', status: 'success', accuracy: 88, confidence: 85, tokensUsed: 478, responseTime: 4.5, feedback: 'positive' },
  { id: '3', timestamp: '8 min ago', agentId: 'oi_scorer', agentName: 'Scoring Agent', coreId: 'offer_intelligence', task: 'Score 10 products', status: 'success', accuracy: 98, confidence: 95, tokensUsed: 198, responseTime: 1.6, feedback: null },
  { id: '4', timestamp: '12 min ago', agentId: 'cg_email', agentName: 'Email Specialist', coreId: 'content_generation', task: 'Write 5-email sequence', status: 'partial', accuracy: 72, confidence: 68, tokensUsed: 412, responseTime: 3.9, feedback: 'negative' },
  { id: '5', timestamp: '15 min ago', agentId: 'fi_revenue', agentName: 'Revenue Tracker', coreId: 'financial_intelligence', task: 'Analyze monthly revenue', status: 'success', accuracy: 99, confidence: 97, tokensUsed: 245, responseTime: 1.4, feedback: 'positive' },
  { id: '6', timestamp: '20 min ago', agentId: 'cm_manager', agentName: 'Campaign Manager', coreId: 'campaign_management', task: 'Optimize budget allocation', status: 'success', accuracy: 85, confidence: 82, tokensUsed: 456, responseTime: 4.8, feedback: null },
  { id: '7', timestamp: '25 min ago', agentId: 'oi_analyst', agentName: 'Competitor Analyst', coreId: 'offer_intelligence', task: 'Analyze competitor products', status: 'success', accuracy: 91, confidence: 88, tokensUsed: 298, responseTime: 3.2, feedback: 'positive' },
  { id: '8', timestamp: '30 min ago', agentId: 'ae_analyst', agentName: 'Data Analyst', coreId: 'analytics_engine', task: 'Generate performance report', status: 'success', accuracy: 94, confidence: 91, tokensUsed: 378, responseTime: 3.4, feedback: 'positive' },
  { id: '9', timestamp: '35 min ago', agentId: 'cg_social', agentName: 'Social Media Expert', coreId: 'content_generation', task: 'Create Twitter thread', status: 'success', accuracy: 90, confidence: 87, tokensUsed: 245, responseTime: 2.8, feedback: null },
  { id: '10', timestamp: '40 min ago', agentId: 'oi_researcher', agentName: 'Market Researcher', coreId: 'offer_intelligence', task: 'Research health niche', status: 'failed', accuracy: 45, confidence: 42, tokensUsed: 156, responseTime: 1.2, feedback: 'negative' }
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

// Score color helper
const getScoreColor = (score: number): string => {
  if (score >= 95) return 'text-green-500';
  if (score >= 85) return 'text-emerald-500';
  if (score >= 75) return 'text-yellow-500';
  if (score >= 60) return 'text-orange-500';
  return 'text-red-500';
};

const getScoreBg = (score: number): string => {
  if (score >= 95) return 'bg-green-500/10 border-green-500/20';
  if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/20';
  if (score >= 75) return 'bg-yellow-500/10 border-yellow-500/20';
  if (score >= 60) return 'bg-orange-500/10 border-orange-500/20';
  return 'bg-red-500/10 border-red-500/20';
};

export default function AgentAnalytics() {
  const [agents, setAgents] = useState<AgentMetrics[]>(generateAgentMetrics());
  const [executions, setExecutions] = useState<TaskExecution[]>(generateTaskExecutions());
  const [selectedCore, setSelectedCore] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [sortBy, setSortBy] = useState<string>('accuracy');

  // Calculate overall stats
  const overallStats = {
    avgAccuracy: agents.reduce((sum, a) => sum + a.accuracyScore, 0) / agents.length,
    avgSuccessRate: agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length,
    totalTasks: agents.reduce((sum, a) => sum + a.totalTasks, 0),
    totalTokens: agents.reduce((sum, a) => sum + (a.totalTasks * a.avgTokensUsed), 0),
    avgResponseTime: agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / agents.length,
    topPerformer: agents.reduce((best, a) => a.accuracyScore > best.accuracyScore ? a : best, agents[0])
  };

  // Filter agents by core
  const filteredAgents = selectedCore === 'all' 
    ? agents 
    : agents.filter(a => a.coreId === selectedCore);

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'accuracy': return b.accuracyScore - a.accuracyScore;
      case 'success': return b.successRate - a.successRate;
      case 'tasks': return b.totalTasks - a.totalTasks;
      case 'efficiency': return b.costEfficiency - a.costEfficiency;
      default: return 0;
    }
  });

  // Get unique cores
  const cores = Array.from(new Set(agents.map(a => ({ id: a.coreId, name: a.coreName }))))
    .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Agent Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze AI agent performance, accuracy, and decision quality
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallStats.avgAccuracy)}`}>
                  {overallStats.avgAccuracy.toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallStats.avgSuccessRate)}`}>
                  {overallStats.avgSuccessRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{overallStats.totalTasks}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-2xl font-bold">{(overallStats.totalTokens / 1000).toFixed(1)}k</p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{overallStats.avgResponseTime.toFixed(1)}s</p>
              </div>
              <Timer className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-lg font-bold truncate">{overallStats.topPerformer.name}</p>
              </div>
              <Award className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Award className="h-4 w-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="detailed" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Detailed Metrics
          </TabsTrigger>
          <TabsTrigger value="executions" className="gap-2">
            <Activity className="h-4 w-4" />
            Task History
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="cost-roi" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Cost & ROI
          </TabsTrigger>
        </TabsList>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <Select value={selectedCore} onValueChange={setSelectedCore}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Core" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cores</SelectItem>
                {cores.map(core => (
                  <SelectItem key={core.id} value={core.id}>{core.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Accuracy Score</SelectItem>
                <SelectItem value="success">Success Rate</SelectItem>
                <SelectItem value="tasks">Total Tasks</SelectItem>
                <SelectItem value="efficiency">Cost Efficiency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {sortedAgents.map((agent, index) => (
              <Card key={agent.id} className={index === 0 ? 'border-primary/50 bg-primary/5' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-950' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-50' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{agent.name}</span>
                        <Badge variant="outline" className="gap-1">
                          {coreIcons[agent.coreId]}
                          {agent.coreName}
                        </Badge>
                        {agent.trend === 'up' && (
                          <Badge variant="default" className="gap-1 bg-green-500">
                            <ArrowUpRight className="h-3 w-3" />
                            +{agent.trendValue}%
                          </Badge>
                        )}
                        {agent.trend === 'down' && (
                          <Badge variant="destructive" className="gap-1">
                            <ArrowDownRight className="h-3 w-3" />
                            {agent.trendValue}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agent.totalTasks} tasks • {agent.avgTokensUsed} avg tokens • {agent.avgResponseTime}s avg response
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                        <p className={`text-xl font-bold ${getScoreColor(agent.accuracyScore)}`}>
                          {agent.accuracyScore.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Success</p>
                        <p className={`text-xl font-bold ${getScoreColor(agent.successRate)}`}>
                          {agent.successRate.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className={`text-xl font-bold ${getScoreColor(agent.confidenceAvg)}`}>
                          {agent.confidenceAvg.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Efficiency</p>
                        <p className={`text-xl font-bold ${getScoreColor(agent.costEfficiency)}`}>
                          {agent.costEfficiency.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="flex items-end gap-0.5 h-8">
                      {agent.last7Days.map((val, i) => (
                        <div
                          key={i}
                          className={`w-2 rounded-t ${getScoreColor(val).replace('text-', 'bg-')}`}
                          style={{ height: `${(val / 100) * 32}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="detailed" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sortedAgents.slice(0, 6).map(agent => (
              <Card key={agent.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {coreIcons[agent.coreId]}
                      {agent.name}
                    </CardTitle>
                    <Badge variant="outline">{agent.coreName}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Accuracy Metrics */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Accuracy Metrics</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className={getScoreColor(agent.accuracyScore)}>{agent.accuracyScore.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.accuracyScore} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Precision</span>
                          <span className={getScoreColor(agent.precisionScore)}>{agent.precisionScore.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.precisionScore} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Recall</span>
                          <span className={getScoreColor(agent.recallScore)}>{agent.recallScore.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.recallScore} className="h-1" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">F1 Score</span>
                          <span className={getScoreColor(agent.f1Score)}>{agent.f1Score.toFixed(1)}%</span>
                        </div>
                        <Progress value={agent.f1Score} className="h-1" />
                      </div>
                    </div>

                    {/* Decision Quality */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Decision Quality</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className={`p-2 rounded border ${getScoreBg(agent.decisionAccuracy)}`}>
                          <p className="text-xs text-muted-foreground">Decision Acc.</p>
                          <p className={`font-bold ${getScoreColor(agent.decisionAccuracy)}`}>{agent.decisionAccuracy.toFixed(1)}%</p>
                        </div>
                        <div className={`p-2 rounded border ${getScoreBg(agent.confidenceAvg)}`}>
                          <p className="text-xs text-muted-foreground">Confidence</p>
                          <p className={`font-bold ${getScoreColor(agent.confidenceAvg)}`}>{agent.confidenceAvg.toFixed(1)}%</p>
                        </div>
                        <div className="p-2 rounded border bg-red-500/10 border-red-500/20">
                          <p className="text-xs text-muted-foreground">False Positives</p>
                          <p className="font-bold text-red-500">{agent.falsePositives}</p>
                        </div>
                        <div className="p-2 rounded border bg-orange-500/10 border-orange-500/20">
                          <p className="text-xs text-muted-foreground">False Negatives</p>
                          <p className="font-bold text-orange-500">{agent.falseNegatives}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Efficiency Stats */}
                  <Separator className="my-4" />
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                      <p className="font-medium">{agent.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Time</p>
                      <p className="font-medium">{agent.avgResponseTime}s</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Tokens</p>
                      <p className="font-medium">{agent.avgTokensUsed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Throughput</p>
                      <p className="font-medium">{agent.throughput}/hr</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Task History Tab */}
        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Task Executions</CardTitle>
              <CardDescription>View detailed execution history and feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map(exec => (
                    <TableRow key={exec.id}>
                      <TableCell className="text-muted-foreground">{exec.timestamp}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {coreIcons[exec.coreId]}
                          <span>{exec.agentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate">{exec.task}</TableCell>
                      <TableCell>
                        <Badge variant={
                          exec.status === 'success' ? 'default' :
                          exec.status === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {exec.status === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {exec.status === 'partial' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {exec.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                          {exec.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={getScoreColor(exec.accuracy)}>{exec.accuracy}%</TableCell>
                      <TableCell className={getScoreColor(exec.confidence)}>{exec.confidence}%</TableCell>
                      <TableCell>{exec.tokensUsed}</TableCell>
                      <TableCell>{exec.responseTime}s</TableCell>
                      <TableCell>
                        {exec.feedback === 'positive' && <ThumbsUp className="h-4 w-4 text-green-500" />}
                        {exec.feedback === 'negative' && <ThumbsDown className="h-4 w-4 text-red-500" />}
                        {exec.feedback === null && <Minus className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost & ROI Tab */}
        <TabsContent value="cost-roi" className="space-y-4">
          <CostROIAnalysis />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-500">Top Performer: Scoring Agent</p>
                      <p className="text-sm text-muted-foreground">
                        Consistently achieving 96.8% accuracy with the lowest false positive rate. 
                        Consider using this agent's configuration as a template for others.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-500">Attention: Email Specialist</p>
                      <p className="text-sm text-muted-foreground">
                        Accuracy trending down (-1.8% this week). Consider lowering temperature 
                        from 0.7 to 0.5 for more consistent outputs.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-500">Efficiency Opportunity</p>
                      <p className="text-sm text-muted-foreground">
                        Campaign Manager uses 445 tokens/task on average. Switching to GPT-4o-mini 
                        could reduce costs by 85% with minimal accuracy impact.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Increase Scoring Agent Workload</p>
                    <Badge>High Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    With 99.4% success rate and highest throughput (34.7/hr), this agent 
                    can handle more tasks without quality degradation.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Retrain Content Generation Agents</p>
                    <Badge variant="secondary">Medium Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Content agents have higher false positive rates. Adding more examples 
                    to prompts could improve precision by 5-8%.
                  </p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Enable Automation Hub</p>
                    <Badge variant="outline">Low Priority</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automation Hub is currently disabled. Enabling it could automate 
                    30% of manual workflow tasks.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

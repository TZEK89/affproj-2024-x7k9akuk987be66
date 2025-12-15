'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  MessageSquare
} from 'lucide-react';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  coreExecuted?: string;
}

interface AICore {
  id: string;
  name: string;
  description: string;
  primary_framework: string;
  agents: string[];
}

interface SystemStatus {
  initialized: boolean;
  connected: boolean;
  frameworks: {
    langgraph: boolean;
    llamaindex: boolean;
    autogen: boolean;
    crewai: boolean;
  };
  cores: string[];
}

// API Service
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const aiService = {
  async chat(message: string, sessionId: string = 'default'): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId })
    });
    return response.json();
  },

  async getCores(): Promise<{ cores: AICore[] }> {
    const response = await fetch(`${API_BASE}/ai/cores`);
    return response.json();
  },

  async getStatus(): Promise<SystemStatus> {
    const response = await fetch(`${API_BASE}/ai/status`);
    return response.json();
  },

  async executeCore(core: string, task: string): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ core, task })
    });
    return response.json();
  },

  async queryKnowledge(question: string, category?: string): Promise<any> {
    const response = await fetch(`${API_BASE}/ai/knowledge/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, category })
    });
    return response.json();
  }
};

// Core Icon mapping
const coreIcons: Record<string, React.ReactNode> = {
  offer_intelligence: <Brain className="h-4 w-4" />,
  content_generation: <FileText className="h-4 w-4" />,
  campaign_management: <TrendingUp className="h-4 w-4" />,
  analytics_engine: <Activity className="h-4 w-4" />,
  automation_hub: <Zap className="h-4 w-4" />,
  financial_intelligence: <DollarSign className="h-4 w-4" />,
  integration_layer: <Database className="h-4 w-4" />,
  personalization_engine: <Settings className="h-4 w-4" />
};

// Main Component
export default function AICommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cores, setCores] = useState<AICore[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [selectedCore, setSelectedCore] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coresData, statusData] = await Promise.all([
          aiService.getCores(),
          aiService.getStatus()
        ]);
        setCores(coresData.cores || []);
        setStatus(statusData);
      } catch (error) {
        console.error('Failed to fetch AI system data:', error);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiService.chat(input);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'No response received',
        timestamp: new Date(),
        coreExecuted: response.core_executed
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute specific core
  const handleExecuteCore = async (coreId: string, task: string) => {
    setIsLoading(true);
    try {
      const response = await aiService.executeCore(coreId, task);
      
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: JSON.stringify(response.result, null, 2),
        timestamp: new Date(),
        coreExecuted: coreId
      };

      setMessages(prev => [...prev, resultMessage]);
    } catch (error) {
      console.error('Core execution error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick action buttons
  const quickActions = [
    { label: 'Find Top Products', core: 'offer_intelligence', task: 'Find top 10 affiliate products with highest potential' },
    { label: 'Generate Ad Copy', core: 'content_generation', task: 'Create compelling ad copy for a finance product' },
    { label: 'Analyze Finances', core: 'financial_intelligence', task: 'Analyze my financial performance for this month' },
    { label: 'Check SOPs', core: 'knowledge', task: 'What are the best practices for selecting affiliate offers?' }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Control your 8-Core AI Affiliate Marketing System
          </p>
        </div>
        
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {status?.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Cores */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Cores</CardTitle>
              <CardDescription>8 specialized AI systems</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {cores.map((core) => (
                <Button
                  key={core.id}
                  variant={selectedCore === core.id ? 'default' : 'outline'}
                  className="w-full justify-start gap-2"
                  onClick={() => setSelectedCore(core.id)}
                >
                  {coreIcons[core.id] || <Zap className="h-4 w-4" />}
                  <span className="truncate">{core.name}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Framework Status */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Frameworks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {status?.frameworks && Object.entries(status.frameworks).map(([name, active]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="capitalize">{name}</span>
                  <Badge variant={active ? 'default' : 'secondary'}>
                    {active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main chat area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat Interface</CardTitle>
                  <CardDescription>
                    Talk to your AI system in natural language
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {quickActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (action.core === 'knowledge') {
                          setInput(action.task);
                        } else {
                          handleExecuteCore(action.core, action.task);
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Bot className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">Welcome to AI Command Center</p>
                    <p className="text-sm mt-2">
                      Ask me anything about affiliate marketing, or use the quick actions above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.coreExecuted && (
                            <Badge variant="outline" className="mt-2">
                              {message.coreExecuted}
                            </Badge>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary animate-pulse" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce" />
                            <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                            <div className="h-2 w-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {/* Input area */}
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything... (e.g., 'Find top finance products with 50%+ commission')"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

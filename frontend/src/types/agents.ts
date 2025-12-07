export interface Mission {
  id: number;
  user_id: number;
  mission_type: 'research' | 'analysis' | 'comparison';
  platform: 'hotmart' | 'impact' | 'clickbank' | 'sharesale';
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agents: string[];
  parameters: {
    userId?: number;
    language?: string;
    getDetails?: boolean;
    maxProducts?: number;
    [key: string]: any;
  };
  results: any[];
  aggregated_results: any;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  logs?: AgentLog[];
  discoveredProducts?: DiscoveredProduct[];
  jobStatus?: JobStatus;
}

export interface AgentLog {
  id: number;
  mission_id: number;
  agent_name: string;
  log_type: 'info' | 'action' | 'observation' | 'decision' | 'error';
  message: string;
  metadata: any;
  created_at: string;
}

export interface DiscoveredProduct {
  id: number;
  mission_id: number;
  agent_name: string;
  platform: string;
  product_name: string;
  product_url: string;
  price: number;
  currency: string;
  commission_rate: number;
  commission_amount: number;
  category: string;
  description: string;
  image_url: string | null;
  ai_score: number;
  ai_strengths: string[];
  ai_weaknesses: string[];
  ai_recommendation: string;
  market_competition: string | null;
  target_audience: string | null;
  estimated_conversion_rate: number | null;
  status: 'pending' | 'reviewed' | 'promoted' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface JobStatus {
  jobId: string;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  attemptsMade: number;
  processedOn: number | null;
  finishedOn: number | null;
  failedReason: string | null;
}

export interface AgentStatus {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  failedMissions: number;
  totalDiscoveredProducts: number;
  queueStatus: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export interface CreateMissionRequest {
  prompt: string;
  platform: 'hotmart' | 'impact' | 'clickbank' | 'sharesale';
  agents?: string[];
  parameters?: {
    language?: string;
    getDetails?: boolean;
    maxProducts?: number;
    [key: string]: any;
  };
}

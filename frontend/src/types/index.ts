export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Network {
  id: number;
  name: string;
  slug: string;
  api_endpoint?: string;
  is_active: boolean;
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface Offer {
  id: number;
  network_id: number;
  network?: Network;
  name: string;
  description?: string;
  url: string;
  niche: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  epc?: number;
  conversion_rate?: number;
  refund_rate?: number;
  quality_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  offer_id: number;
  offer?: Offer;
  platform_id: number;
  platform?: Platform;
  landing_page_id?: number;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  daily_budget: number;
  total_budget?: number;
  target_roas: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Performance metrics
  spend?: number;
  revenue?: number;
  profit?: number;
  roas?: number;
  clicks?: number;
  conversions?: number;
  health_status?: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface Asset {
  id: number;
  offer_id?: number;
  type: 'image' | 'video' | 'audio' | 'text';
  name: string;
  description?: string;
  file_url: string;
  ai_tool?: string;
  ai_prompt?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface LandingPage {
  id: number;
  offer_id: number;
  offer?: Offer;
  name: string;
  url: string;
  template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Performance metrics
  views?: number;
  conversions?: number;
  conversion_rate?: number;
}

export interface DashboardMetrics {
  total_revenue: number;
  total_profit: number;
  total_spend: number;
  avg_roas: number;
  total_campaigns: number;
  active_campaigns: number;
  total_offers: number;
  total_landing_pages: number;
  total_clicks: number;
  total_conversions: number;
}

export interface RevenueByPlatform {
  platform: string;
  campaign_count: number;
  total_spend: number;
  total_revenue: number;
  total_profit: number;
  roas: number;
}

export interface RevenueByNiche {
  niche: string;
  campaign_count: number;
  offer_count: number;
  total_spend: number;
  total_revenue: number;
  total_profit: number;
  roas: number;
}

export interface PerformanceTrend {
  date: string;
  spend: number;
  revenue: number;
  profit: number;
  roas: number;
  clicks: number;
  conversions: number;
}


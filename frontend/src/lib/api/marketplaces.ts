// frontend/src/lib/api/marketplaces.ts

import { apiClient } from '../api';

// Types
export interface PlatformPreset {
  id: string;
  name: string;
  baseUrl: string;
  icon: string;
  languages: string[];
  categories: string[];
  defaultScraperType: string;
  features: string[];
  description: string;
}

export interface ScraperType {
  type: string;
  name: string;
  available: boolean;
  comingSoon?: boolean;
  description: string;
}

export interface Marketplace {
  id: number;
  user_id: number;
  platform: string;
  name: string;
  base_url: string;
  language?: string;
  category_filter?: string;
  scraper_type: string;
  agent_id?: number;
  icon_url?: string;
  status: 'ready' | 'scraping' | 'error';
  products_count: number;
  last_scraped_at?: string;
  avg_scrape_duration?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ScrapeSession {
  id: string;
  marketplace_id: number;
  scraper_type: string;
  agent_id?: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at?: string;
  completed_at?: string;
  products_found: number;
  products_new: number;
  products_updated: number;
  error_message?: string;
  progress: number;
  duration_seconds?: number;
  config_snapshot: Record<string, any>;
  logs: any[];
  created_at: string;
}

export interface MarketplaceCreateData {
  platform: string;
  name: string;
  base_url: string;
  language?: string;
  category_filter?: string;
  scraper_type?: string;
  scraper_config?: Record<string, any>;
  agent_id?: number;
  max_products?: number;
  icon_url?: string;
}

export interface MarketplaceUpdateData {
  name?: string;
  base_url?: string;
  language?: string;
  category_filter?: string;
  scraper_type?: string;
  scraper_config?: Record<string, any>;
  agent_id?: number;
  max_products?: number;
  icon_url?: string;
}

export interface MarketplaceProduct {
  id: number;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  image_url?: string;
  product_url: string;
  network: string;
  temperature?: number;
  gravity?: number;
  category?: string;
  stage: string;
  ai_score?: number;
  ai_reasoning?: string;
  scraped_at?: string;
}

// API Client
export const marketplacesApi = {
  // Get platform presets
  getPresets: async (): Promise<{ success: boolean; presets: Record<string, PlatformPreset> }> => {
    const response = await apiClient.get('/marketplaces/config/presets');
    return response.data;
  },

  // Get scraper types
  getScraperTypes: async (): Promise<{ success: boolean; types: ScraperType[] }> => {
    const response = await apiClient.get('/marketplaces/config/scraper-types');
    return response.data;
  },

  // Get all marketplaces
  getAll: async (): Promise<{ success: boolean; marketplaces: Marketplace[] }> => {
    const response = await apiClient.get('/marketplaces');
    return response.data;
  },

  // Get single marketplace
  getById: async (id: number): Promise<{ success: boolean; marketplace: Marketplace }> => {
    const response = await apiClient.get(`/marketplaces/${id}`);
    return response.data;
  },

  // Create marketplace
  create: async (data: MarketplaceCreateData): Promise<{ success: boolean; marketplace: Marketplace }> => {
    const response = await apiClient.post('/marketplaces', data);
    return response.data;
  },

  // Update marketplace
  update: async (id: number, data: MarketplaceUpdateData): Promise<{ success: boolean; marketplace: Marketplace }> => {
    const response = await apiClient.put(`/marketplaces/${id}`, data);
    return response.data;
  },

  // Delete marketplace
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete(`/marketplaces/${id}`);
    return response.data;
  },

  // Trigger scrape
  triggerScrape: async (id: number): Promise<{
    success: boolean;
    sessionId: string;
    jobId: string | null;
    message: string;
  }> => {
    const response = await apiClient.post(`/marketplaces/${id}/scrape`);
    return response.data;
  },

  // Get scrape status
  getStatus: async (id: number): Promise<{
    success: boolean;
    status: string;
    lastScrapedAt?: string;
    productsCount: number;
    errorMessage?: string;
    session?: ScrapeSession;
  }> => {
    const response = await apiClient.get(`/marketplaces/${id}/status`);
    return response.data;
  },

  // Get products for marketplace
  getProducts: async (id: number, params?: {
    limit?: number;
    offset?: number;
    stage?: string;
  }): Promise<{
    success: boolean;
    products: MarketplaceProduct[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const response = await apiClient.get(`/marketplaces/${id}/products`, { params });
    return response.data;
  },

  // Cancel scrape
  cancelScrape: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`/marketplaces/${id}/cancel`);
    return response.data;
  },
};

export default marketplacesApi;

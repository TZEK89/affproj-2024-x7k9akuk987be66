import { apiClient } from './api';

// Products API
export const productsApi = {
  getAll: async (params?: { limit?: number; offset?: number; category?: string }) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// Landing Pages API
export const landingPagesApi = {
  getAll: async (params?: { limit?: number; offset?: number }) => {
    const response = await apiClient.get('/landing-pages', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/landing-pages/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/landing-pages', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/landing-pages/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/landing-pages/${id}`);
    return response.data;
  },
  trackConversion: async (id: string, data: any) => {
    const response = await apiClient.post(`/landing-pages/${id}/conversion`, data);
    return response.data;
  },
};

// Campaigns API
export const campaignsApi = {
  getAll: async (params?: { limit?: number; offset?: number; status?: string }) => {
    const response = await apiClient.get('/campaigns', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/campaigns/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/campaigns', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/campaigns/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/campaigns/${id}`);
    return response.data;
  },
  getStats: async (id: string) => {
    const response = await apiClient.get(`/campaigns/${id}/stats`);
    return response.data;
  },
};

// Subscribers API
export const subscribersApi = {
  getAll: async (params?: { limit?: number; offset?: number; status?: string }) => {
    const response = await apiClient.get('/subscribers', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/subscribers/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/subscribers', data);
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/subscribers/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/subscribers/${id}`);
    return response.data;
  },
};

// Conversions API
export const conversionsApi = {
  getAll: async (params?: { 
    limit?: number; 
    offset?: number; 
    startDate?: string; 
    endDate?: string;
    productId?: string;
    campaignId?: string;
  }) => {
    const response = await apiClient.get('/conversions', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/conversions/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/conversions', data);
    return response.data;
  },
  getRevenue: async (params?: { 
    startDate?: string; 
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const response = await apiClient.get('/conversions/revenue', { params });
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  getDashboard: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data;
  },
  getTopProducts: async (params?: { limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics/top-products', { params });
    return response.data;
  },
  getTopCampaigns: async (params?: { limit?: number; startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/analytics/top-campaigns', { params });
    return response.data;
  },
  getConversionTrends: async (params?: { 
    startDate?: string; 
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => {
    const response = await apiClient.get('/analytics/conversion-trends', { params });
    return response.data;
  },
};


// Integrations API
export const integrationsApi = {
  // Impact.com integration
  getImpactStatus: async () => {
    const response = await apiClient.get('/integrations/impact/status');
    return response.data;
  },
  syncImpact: async (options?: {
    fullSync?: boolean;
    campaignId?: string;
    maxProducts?: number;
    inStockOnly?: boolean;
    requireImage?: boolean;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    withPromotions?: boolean;
  }) => {
    const response = await apiClient.post('/integrations/impact/sync', options);
    return response.data;
  },
  getImpactSyncStatus: async () => {
    const response = await apiClient.get('/integrations/impact/sync/status');
    return response.data;
  },
  getImpactCatalogs: async () => {
    const response = await apiClient.get('/integrations/impact/catalogs');
    return response.data;
  },
  testImpactConnection: async () => {
    const response = await apiClient.get('/integrations/impact/test');
    return response.data;
  },
  
  // Hotmart integration
  getHotmartStatus: async () => {
    const response = await apiClient.get('/hotmart/status');
    return response.data;
  },
  syncHotmart: async (options?: {
    generateImages?: boolean;
    batchSize?: number;
  }) => {
    const response = await apiClient.post('/hotmart/sync', options);
    return response.data;
  },
  testHotmartConnection: async () => {
    const response = await apiClient.get('/hotmart/test');
    return response.data;
  },
  getHotmartProducts: async () => {
    const response = await apiClient.get('/hotmart/products');
    return response.data;
  },
  
  // General integrations
  getStats: async () => {
    const response = await apiClient.get('/integrations/stats');
    return response.data;
  },
};

// Agents & Missions API
export const agentsApi = {
  // Missions
  getAllMissions: async (params?: { limit?: number; offset?: number; status?: string }) => {
    const response = await apiClient.get('/agents/missions', { params });
    return response.data;
  },
  getMissionById: async (id: string) => {
    const response = await apiClient.get(`/agents/missions/${id}`);
    return response.data;
  },
  createMission: async (data: {
    prompt: string;
    platform: string;
    agents?: string[];
    parameters?: any;
  }) => {
    const response = await apiClient.post('/agents/missions', data);
    return response.data;
  },
  deleteMission: async (id: string) => {
    const response = await apiClient.delete(`/agents/missions/${id}`);
    return response.data;
  },
  getMissionJobStatus: async (id: string) => {
    const response = await apiClient.get(`/agents/missions/${id}/job-status`);
    return response.data;
  },
  
  // Discovered Products
  getDiscoveredProducts: async (params?: { 
    limit?: number; 
    offset?: number; 
    missionId?: string;
    minScore?: number;
  }) => {
    const response = await apiClient.get('/agents/discovered-products', { params });
    return response.data;
  },
  promoteProduct: async (id: string) => {
    const response = await apiClient.post(`/agents/discovered-products/${id}/convert`);
    return response.data;
  },
  updateDiscoveredProduct: async (id: string, data: any) => {
    const response = await apiClient.put(`/agents/discovered-products/${id}`, data);
    return response.data;
  },
  affiliateWithProduct: async (id: string) => {
    const response = await apiClient.post(`/agents/discovered-products/${id}/affiliate`);
    return response.data;
  },
  
  // Agent Status
  getAgentStatus: async () => {
    const response = await apiClient.get('/agents');
    return response.data;
  },
  
  // Execution
  executeAgenticMission: async (id: string, credentials?: any) => {
    const response = await apiClient.post(`/agents/execute-agentic/${id}`, { credentials });
    return response.data;
  },
  executeScriptedMission: async (id: string) => {
    const response = await apiClient.post(`/agents/execute/${id}`);
    return response.data;
  },
};

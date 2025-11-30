import apiClient from './api';

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

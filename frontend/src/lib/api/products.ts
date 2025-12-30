// frontend/src/lib/api/products.ts

import { apiClient } from '../api';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
  product_url: string;
  platform: string;
  marketplace_id: number | null;

  // Platform metrics
  temperature: number | null;
  gravity: number | null;

  // Scores
  demand_score: number | null;
  description_score: number | null;
  price_score: number | null;
  niche_score: number | null;
  competition_score: number | null;
  visual_score: number | null;
  overall_score: number | null;
  score_breakdown: Record<string, any> | null;

  // User input
  commission_rate: number | null;
  commission_amount: number | null;
  is_affiliated: boolean;
  affiliate_link: string | null;
  user_notes: string | null;

  // Promotion (Offers)
  is_promoted: boolean;
  promotion_summary: string | null;
  target_audience: string | null;
  promotion_strategy: string | null;
  roi_projection: {
    min: number;
    avg: number;
    max: number;
    assumptions: string[];
  } | null;

  // Stage
  stage: 'discovery' | 'offer' | 'archived';
  category: string | null;

  // Timestamps
  scraped_at: string | null;
  promoted_at: string | null;
  affiliated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  stage?: 'discovery' | 'offer' | 'archived';
  platform?: string;
  marketplace_id?: number;
  is_affiliated?: boolean;
  is_promoted?: boolean;
  min_score?: number;
  max_score?: number;
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductsResponse {
  success: boolean;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AnalysisResult {
  summary: string;
  target_audience: string;
  promotion_strategy: string;
  roi_projection: {
    min: number;
    avg: number;
    max: number;
    assumptions: string[];
  };
}

export const discoveryProductsApi = {
  // Get products with filters (for Discovery/Offers)
  async getAll(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await apiClient.get(`/products/discovery?${params.toString()}`);
    return response.data;
  },

  // Get single product
  async getById(id: number): Promise<{ success: boolean; product: Product }> {
    const response = await apiClient.get(`/products/discovery/${id}`);
    return response.data;
  },

  // Update product
  async update(id: number, updates: Partial<Product>): Promise<{ success: boolean; product: Product }> {
    const response = await apiClient.patch(`/products/discovery/${id}`, updates);
    return response.data;
  },

  // Promote to Offers
  async promote(id: number): Promise<{ success: boolean; product: Product }> {
    const response = await apiClient.post(`/products/discovery/${id}/promote`);
    return response.data;
  },

  // Deep analysis
  async deepAnalysis(id: number): Promise<{ success: boolean; analysis: AnalysisResult }> {
    const response = await apiClient.post(`/products/discovery/${id}/analyze`);
    return response.data;
  },

  // Archive product
  async archive(id: number): Promise<{ success: boolean; product: Product }> {
    const response = await apiClient.post(`/products/discovery/${id}/archive`);
    return response.data;
  },

  // Rescore products
  async rescore(ids?: number[]): Promise<{ success: boolean; count: number }> {
    const response = await apiClient.post('/products/discovery/rescore', { ids });
    return response.data;
  },

  // Get platform options
  async getPlatforms(): Promise<{ success: boolean; platforms: string[] }> {
    const response = await apiClient.get('/products/discovery/platforms');
    return response.data;
  },

  // Get category options
  async getCategories(): Promise<{ success: boolean; categories: string[] }> {
    const response = await apiClient.get('/products/discovery/categories');
    return response.data;
  },
};

export default discoveryProductsApi;

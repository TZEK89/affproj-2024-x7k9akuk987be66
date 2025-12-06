const axios = require('axios');

/**
 * Hotmart API Service - Updated for Affiliate Focus
 * 
 * Handles OAuth 2.0 authentication and API requests to Hotmart
 * Documentation: https://developers.hotmart.com/
 * 
 * IMPORTANT: Hotmart API does NOT provide marketplace browsing.
 * This service focuses on:
 * 1. Getting products you're already affiliated with (via sales/commissions)
 * 2. Tracking performance of those products
 * 3. Managing your affiliate sales data
 */
class HotmartService {
  constructor() {
    this.baseURL = 'https://developers.hotmart.com';
    this.sandboxURL = 'https://sandbox.hotmart.com';
    this.clientId = process.env.HOTMART_CLIENT_ID;
    this.clientSecret = process.env.HOTMART_CLIENT_SECRET;
    this.useSandbox = process.env.HOTMART_SANDBOX === 'true';
    
    // In-memory token storage (should be moved to database in production)
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get the base URL based on environment
   */
  getBaseURL() {
    return this.useSandbox ? this.sandboxURL : this.baseURL;
  }

  /**
   * Authenticate with Hotmart using OAuth 2.0 Client Credentials flow
   * @returns {Promise<string>} Access token
   */
  async authenticate() {
    try {
      const response = await axios.post(
        `${this.getBaseURL()}/security/oauth/token`,
        null,
        {
          params: {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      this.accessToken = response.data.access_token;
      // Token expires in seconds, store expiry time
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      console.log('✅ Hotmart authentication successful');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Hotmart authentication failed:', error.response?.data || error.message);
      throw new Error(`Hotmart authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   * @returns {Promise<string>} Valid access token
   */
  async getAccessToken() {
    // Check if token exists and is still valid (with 5 minute buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < (this.tokenExpiry - 300000)) {
      return this.accessToken;
    }

    // Token expired or doesn't exist, get a new one
    return await this.authenticate();
  }

  /**
   * Make an authenticated API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} params - Query parameters
   * @param {Object} data - Request body
   * @returns {Promise<Object>} API response data
   */
  async makeRequest(method, endpoint, params = {}, data = null) {
    try {
      const token = await this.getAccessToken();
      
      const response = await axios({
        method,
        url: `${this.getBaseURL()}${endpoint}`,
        params,
        data,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ Hotmart API request failed: ${method} ${endpoint}`, error.response?.data || error.message);
      
      // If unauthorized, try to refresh token once
      if (error.response?.status === 401) {
        console.log('🔄 Token expired, refreshing...');
        this.accessToken = null; // Force refresh
        const token = await this.getAccessToken();
        
        // Retry the request
        const response = await axios({
          method,
          url: `${this.getBaseURL()}${endpoint}`,
          params,
          data,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      }
      
      throw error;
    }
  }

  /**
   * Get affiliate products from sales/commissions data
   * This is the ONLY way to get products you're affiliated with via API
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products data extracted from commissions
   */
  async getAffiliateProducts(options = {}) {
    try {
      // Get last 90 days of commissions to find products
      const endDate = Date.now();
      const startDate = endDate - (90 * 24 * 60 * 60 * 1000); // 90 days ago

      const commissions = await this.getCommissions({
        startDate,
        endDate,
        role: 'AFFILIATE', // Only get commissions where you're the affiliate
        maxResults: options.maxResults || 100
      });

      // Extract unique products from commissions
      const productsMap = new Map();
      
      if (commissions.items) {
        commissions.items.forEach(commission => {
          const productId = commission.product?.id;
          if (productId && !productsMap.has(productId)) {
            productsMap.set(productId, {
              id: commission.product.id,
              name: commission.product.name,
              ucode: commission.product.ucode,
              has_co_production: commission.product.has_co_production,
              // Add commission data
              commission_percentage: commission.commission_percentage,
              currency: commission.purchase?.price?.currency_value,
              // Aggregate stats (will be calculated later)
              total_sales: 0,
              total_commission: 0
            });
          }
          
          // Update stats
          if (productId && productsMap.has(productId)) {
            const product = productsMap.get(productId);
            product.total_sales++;
            product.total_commission += commission.commission_value || 0;
          }
        });
      }

      return {
        items: Array.from(productsMap.values()),
        page_info: {
          total_results: productsMap.size,
          results_per_page: productsMap.size
        }
      };
    } catch (error) {
      console.error('Failed to get affiliate products:', error.message);
      return {
        items: [],
        page_info: { total_results: 0, results_per_page: 0 }
      };
    }
  }

  /**
   * Get list of products (YOUR products as a producer)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Products data
   */
  async getProducts(options = {}) {
    const params = {
      max_results: options.maxResults || 50,
      page_token: options.pageToken || undefined
    };

    return await this.makeRequest('GET', '/products/api/v1/products', params);
  }

  /**
   * Get product details by ID
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Product details
   */
  async getProduct(productId) {
    return await this.makeRequest('GET', `/products/api/v1/products/${productId}`);
  }

  /**
   * Get product offers (pricing and special deals)
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Product offers
   */
  async getProductOffers(productId) {
    return await this.makeRequest('GET', `/products/api/v1/products/${productId}/offers`);
  }

  /**
   * Get product subscription plans
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} Subscription plans
   */
  async getProductPlans(productId) {
    return await this.makeRequest('GET', `/products/api/v1/products/${productId}/plans`);
  }

  /**
   * Get sales commissions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Commission data
   */
  async getCommissions(options = {}) {
    const params = {
      product_id: options.productId,
      start_date: options.startDate, // milliseconds since epoch
      end_date: options.endDate, // milliseconds since epoch
      transaction: options.transactionId,
      commission_as: options.role, // PRODUCER, COPRODUCER, AFFILIATE
      transaction_status: options.status, // APPROVED, COMPLETE, etc.
      max_results: options.maxResults || 50,
      page_token: options.pageToken
    };

    // Remove undefined values
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    return await this.makeRequest('GET', '/payments/api/v1/sales/commissions', params);
  }

  /**
   * Get sales history
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Sales history
   */
  async getSalesHistory(options = {}) {
    const params = {
      start_date: options.startDate,
      end_date: options.endDate,
      max_results: options.maxResults || 50,
      page_token: options.pageToken
    };

    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    return await this.makeRequest('GET', '/payments/api/v1/sales/history', params);
  }

  /**
   * Get sales summary
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Sales summary
   */
  async getSalesSummary(options = {}) {
    const params = {
      start_date: options.startDate,
      end_date: options.endDate,
      product_id: options.productId
    };

    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    return await this.makeRequest('GET', '/payments/api/v1/sales/summary', params);
  }

  /**
   * Get subscriptions
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Subscriptions data
   */
  async getSubscriptions(options = {}) {
    const params = {
      subscriber_code: options.subscriberCode,
      product_id: options.productId,
      subscription_status: options.status, // ACTIVE, CANCELLED, OVERDUE, etc.
      max_results: options.maxResults || 50,
      page_token: options.pageToken
    };

    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

    return await this.makeRequest('GET', '/payments/api/v1/subscriptions', params);
  }

  /**
   * Transform Hotmart product data to our database schema
   * @param {Object} hotmartProduct - Product data from Hotmart API
   * @returns {Object} Transformed product data
   */
  transformProduct(hotmartProduct) {
    return {
      external_id: hotmartProduct.id?.toString(),
      name: hotmartProduct.name,
      description: hotmartProduct.description || '',
      price: hotmartProduct.price?.value || 0,
      original_price: hotmartProduct.price?.original_value || hotmartProduct.price?.value || 0,
      currency: hotmartProduct.currency || hotmartProduct.price?.currency || 'USD',
      image_url: hotmartProduct.image_url || null,
      product_url: hotmartProduct.affiliate_link || `https://app.hotmart.com/marketplace/products/${hotmartProduct.id}`,
      category: hotmartProduct.category || 'Digital Products',
      network: 'hotmart',
      network_id: hotmartProduct.id?.toString(),
      network_name: 'Hotmart',
      advertiser_name: hotmartProduct.producer?.name || 'Unknown',
      commission_rate: hotmartProduct.commission_percentage || 0,
      stock_status: 'InStock', // Digital products are always in stock
      metadata: {
        product_type: hotmartProduct.product_type,
        producer_ucode: hotmartProduct.producer?.ucode,
        has_subscription: hotmartProduct.has_subscription || false,
        language: hotmartProduct.language,
        rating: hotmartProduct.rating,
        sales_count: hotmartProduct.sales_count || hotmartProduct.total_sales,
        total_commission: hotmartProduct.total_commission
      }
    };
  }

  /**
   * Test API connection
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection() {
    try {
      await this.authenticate();
      
      // Try to get affiliate products from commissions
      const affiliateProducts = await this.getAffiliateProducts({ maxResults: 10 });
      
      // Also try to get producer products
      const producerProducts = await this.getProducts({ maxResults: 1 });
      
      return {
        success: true,
        message: 'Successfully connected to Hotmart',
        affiliateProductCount: affiliateProducts.page_info?.total_results || 0,
        producerProductCount: producerProducts.page_info?.total_results || 0,
        note: 'Affiliate products are discovered from sales/commissions data (last 90 days)'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = HotmartService;

const axios = require('axios');

/**
 * Impact.com API Service
 * Handles authentication and API requests to Impact.com Partner API
 */
class ImpactService {
  constructor() {
    this.baseURL = 'https://api.impact.com';
    this.accountSID = process.env.IMPACT_ACCOUNT_SID;
    this.authToken = process.env.IMPACT_AUTH_TOKEN;
    
    if (!this.accountSID || !this.authToken) {
      console.warn('Impact.com credentials not configured. Set IMPACT_ACCOUNT_SID and IMPACT_AUTH_TOKEN environment variables.');
    }

    // Create axios instance with basic auth
    this.client = axios.create({
      baseURL: this.baseURL,
      auth: {
        username: this.accountSID,
        password: this.authToken
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * List all catalogs available to the partner
   * @param {string} campaignId - Optional campaign ID to filter catalogs
   * @returns {Promise<Array>} Array of catalog objects
   */
  async listCatalogs(campaignId = null) {
    try {
      const url = `/Mediapartners/${this.accountSID}/Catalogs`;
      const params = campaignId ? { CampaignId: campaignId } : {};
      
      const response = await this.client.get(url, { params });
      return response.data.Catalogs || [];
    } catch (error) {
      console.error('Error fetching catalogs from Impact.com:', error.message);
      throw new Error(`Failed to fetch catalogs: ${error.message}`);
    }
  }

  /**
   * List all items (products) for a specific catalog
   * @param {string} catalogId - The catalog ID
   * @param {Object} options - Query options
   * @param {string} options.query - Filter query (e.g., "CurrentPrice > 10.00")
   * @param {string} options.sort - Sort order (e.g., "CurrentPrice ASC")
   * @param {number} options.pageSize - Number of items per page (max 200)
   * @param {number} options.page - Page number
   * @returns {Promise<Object>} Object containing items array and pagination info
   */
  async listCatalogItems(catalogId, options = {}) {
    try {
      const url = `/Mediapartners/${this.accountSID}/Catalogs/${catalogId}/Items`;
      const params = {
        Query: options.query || undefined,
        Sort: options.sort || undefined,
        PageSize: options.pageSize || 100,
        Page: options.page || 1
      };
      
      const response = await this.client.get(url, { params });
      return {
        items: response.data.Items || [],
        page: parseInt(response.data['@page']) || 1,
        pageSize: parseInt(response.data['@pagesize']) || 100,
        totalRecords: parseInt(response.data['@numpages']) * parseInt(response.data['@pagesize']) || 0
      };
    } catch (error) {
      console.error(`Error fetching items for catalog ${catalogId}:`, error.message);
      throw new Error(`Failed to fetch catalog items: ${error.message}`);
    }
  }

  /**
   * Fetch all items from a catalog (handles pagination automatically)
   * @param {string} catalogId - The catalog ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of all items
   */
  async fetchAllCatalogItems(catalogId, options = {}) {
    const allItems = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listCatalogItems(catalogId, { ...options, page });
      allItems.push(...result.items);
      
      // Check if there are more pages
      hasMore = result.items.length === result.pageSize;
      page++;
      
      // Safety limit to prevent infinite loops
      if (page > 100) {
        console.warn(`Reached page limit (100) for catalog ${catalogId}`);
        break;
      }
    }

    return allItems;
  }

  /**
   * Search for items across all catalogs
   * @param {Object} options - Search options
   * @param {string} options.query - Filter query
   * @param {string} options.sort - Sort order
   * @param {number} options.pageSize - Number of items per page
   * @returns {Promise<Object>} Object containing items array and pagination info
   */
  async searchCatalogItems(options = {}) {
    try {
      const url = `/Mediapartners/${this.accountSID}/Catalogs/ItemSearch`;
      const params = {
        Query: options.query || undefined,
        Sort: options.sort || undefined,
        PageSize: options.pageSize || 100
      };
      
      const response = await this.client.get(url, { params });
      return {
        items: response.data.Items || [],
        page: parseInt(response.data['@page']) || 1,
        pageSize: parseInt(response.data['@pagesize']) || 100
      };
    } catch (error) {
      console.error('Error searching catalog items:', error.message);
      throw new Error(`Failed to search catalog items: ${error.message}`);
    }
  }

  /**
   * Get conversion actions (sales/commissions)
   * @param {Object} options - Query options
   * @param {string} options.startDate - Start date (YYYY-MM-DD)
   * @param {string} options.endDate - End date (YYYY-MM-DD)
   * @param {string} options.status - Action status filter
   * @returns {Promise<Array>} Array of action objects
   */
  async getActions(options = {}) {
    try {
      const url = `/Mediapartners/${this.accountSID}/Actions`;
      const params = {
        StartDate: options.startDate || undefined,
        EndDate: options.endDate || undefined,
        ActionStatus: options.status || undefined
      };
      
      const response = await this.client.get(url, { params });
      return response.data.Actions || [];
    } catch (error) {
      console.error('Error fetching actions from Impact.com:', error.message);
      throw new Error(`Failed to fetch actions: ${error.message}`);
    }
  }

  /**
   * Transform Impact.com product to our database schema
   * @param {Object} impactProduct - Product from Impact.com API
   * @param {Object} catalog - Catalog information
   * @returns {Object} Product in our schema format
   */
  transformProduct(impactProduct, catalog) {
    return {
      external_id: impactProduct.Id,
      name: impactProduct.Name,
      description: impactProduct.Description || '',
      price: parseFloat(impactProduct.CurrentPrice) || 0,
      original_price: parseFloat(impactProduct.OriginalPrice) || null,
      currency: impactProduct.Currency || 'USD',
      image_url: impactProduct.ImageUrl || null,
      product_url: impactProduct.Url || null,
      category: impactProduct.Category || null,
      subcategory: impactProduct.SubCategory || null,
      network: 'impact',
      network_id: catalog.CampaignId,
      network_name: catalog.CampaignName,
      advertiser_name: catalog.AdvertiserName || impactProduct.CampaignName,
      stock_status: impactProduct.StockAvailability || 'Unknown',
      commission_rate: null, // Not available in catalog API
      commission_type: null,
      metadata: {
        catalog_id: impactProduct.CatalogId,
        catalog_item_id: impactProduct.CatalogItemId,
        manufacturer: impactProduct.Manufacturer,
        promotions: impactProduct.Promotions || [],
        gtin: impactProduct.Gtin,
        asin: impactProduct.Asin,
        colors: impactProduct.Colors || [],
        size: impactProduct.Size,
        gender: impactProduct.Gender,
        condition: impactProduct.Condition
      }
    };
  }
}

module.exports = new ImpactService();

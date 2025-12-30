// backend/services/marketplace/MarketplaceService.js

const crypto = require('crypto');
const db = require('../../db');

class MarketplaceService {
  /**
   * Get all marketplaces for a user
   */
  static async getByUser(userId) {
    const query = `
      SELECT
        m.*,
        a.name as agent_name,
        a.model as agent_model
      FROM marketplaces m
      LEFT JOIN ai_agents a ON m.agent_id = a.id
      WHERE m.user_id = $1
      ORDER BY m.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    return result.rows.map(m => ({
      ...m,
      scraper_config: this.parseJsonField(m.scraper_config),
      agent: m.agent_id ? {
        id: m.agent_id,
        name: m.agent_name,
        model: m.agent_model
      } : null
    }));
  }

  /**
   * Get single marketplace by ID
   */
  static async getById(id) {
    const result = await db.query(
      'SELECT * FROM marketplaces WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;

    const marketplace = result.rows[0];
    marketplace.scraper_config = this.parseJsonField(marketplace.scraper_config);
    return marketplace;
  }

  /**
   * Create new marketplace
   */
  static async create(data) {
    const {
      user_id,
      platform,
      name,
      base_url,
      language,
      category_filter,
      scraper_type,
      scraper_config,
      agent_id,
      max_products,
      icon_url
    } = data;

    // Encrypt sensitive config if present
    let configToStore = scraper_config || {};
    if (scraper_config?.apiKey) {
      configToStore = {
        ...scraper_config,
        apiKey: this.encryptValue(scraper_config.apiKey)
      };
    }

    const query = `
      INSERT INTO marketplaces (
        user_id, platform, name, base_url, language, category_filter,
        scraper_type, scraper_config, agent_id, max_products, icon_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const result = await db.query(query, [
      user_id,
      platform,
      name,
      base_url,
      language,
      category_filter,
      scraper_type || 'playwright',
      JSON.stringify(configToStore),
      agent_id || null,
      max_products || 100,
      icon_url,
      'ready'
    ]);

    return result.rows[0];
  }

  /**
   * Update marketplace
   */
  static async update(id, data) {
    // Build dynamic update query
    const allowedFields = [
      'platform', 'name', 'base_url', 'language', 'category_filter',
      'scraper_type', 'scraper_config', 'agent_id', 'max_products',
      'icon_url', 'scrape_frequency', 'auto_scrape_enabled', 'status'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        if (key === 'scraper_config') {
          // Handle scraper config with encryption
          let configToStore = value || {};
          if (value?.apiKey) {
            configToStore = {
              ...value,
              apiKey: this.encryptValue(value.apiKey)
            };
          }
          updates.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(configToStore));
        } else {
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return this.getById(id);
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    values.push(id);
    const query = `
      UPDATE marketplaces
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete marketplace
   */
  static async delete(id) {
    await db.query('DELETE FROM marketplaces WHERE id = $1', [id]);
    return true;
  }

  /**
   * Update marketplace status
   */
  static async updateStatus(id, status, errorMessage = null) {
    const query = `
      UPDATE marketplaces
      SET status = $1,
          error_message = $2,
          updated_at = $3
      WHERE id = $4
    `;

    await db.query(query, [
      status,
      status === 'error' ? errorMessage : null,
      new Date(),
      id
    ]);
  }

  /**
   * Update scrape completion stats
   */
  static async updateScrapeStats(id, stats) {
    const query = `
      UPDATE marketplaces
      SET last_scraped_at = $1,
          last_scrape_duration = $2,
          products_count = $3,
          status = 'ready',
          error_message = NULL,
          updated_at = $4
      WHERE id = $5
    `;

    await db.query(query, [
      new Date(),
      stats.duration,
      stats.productsCount,
      new Date(),
      id
    ]);
  }

  /**
   * Get latest scrape session for marketplace
   */
  static async getLatestSession(marketplaceId) {
    const result = await db.query(
      `SELECT * FROM scrape_sessions
       WHERE marketplace_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [marketplaceId]
    );

    if (result.rows.length === 0) return null;

    const session = result.rows[0];
    session.logs = this.parseJsonField(session.logs);
    session.config_snapshot = this.parseJsonField(session.config_snapshot);
    session.agent_observations = this.parseJsonField(session.agent_observations);
    return session;
  }

  /**
   * Create scrape session
   */
  static async createSession(data) {
    const sessionId = crypto.randomUUID();

    const query = `
      INSERT INTO scrape_sessions (
        id, user_id, marketplace_id, scraper_type, agent_id, config_snapshot, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    await db.query(query, [
      sessionId,
      data.user_id,
      data.marketplace_id,
      data.scraper_type,
      data.agent_id || null,
      JSON.stringify(data.config_snapshot || {}),
      'pending'
    ]);

    return sessionId;
  }

  /**
   * Update scrape session
   */
  static async updateSession(sessionId, data) {
    const updates = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = [
      'status', 'progress', 'products_found', 'products_new', 'products_updated',
      'started_at', 'completed_at', 'duration_seconds', 'error_message'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    // Handle JSON fields separately
    if (data.logs) {
      updates.push(`logs = $${paramCount}`);
      values.push(JSON.stringify(data.logs));
      paramCount++;
    }

    if (data.agent_observations) {
      updates.push(`agent_observations = $${paramCount}`);
      values.push(JSON.stringify(data.agent_observations));
      paramCount++;
    }

    if (updates.length === 0) return;

    values.push(sessionId);
    const query = `UPDATE scrape_sessions SET ${updates.join(', ')} WHERE id = $${paramCount}`;
    await db.query(query, values);
  }

  /**
   * Get scrape session by ID
   */
  static async getSession(sessionId) {
    const result = await db.query(
      'SELECT * FROM scrape_sessions WHERE id = $1',
      [sessionId]
    );

    if (result.rows.length === 0) return null;

    const session = result.rows[0];
    session.logs = this.parseJsonField(session.logs);
    session.config_snapshot = this.parseJsonField(session.config_snapshot);
    session.agent_observations = this.parseJsonField(session.agent_observations);
    return session;
  }

  /**
   * Encrypt sensitive values
   */
  static encryptValue(value) {
    if (!value) return null;
    const key = process.env.ENCRYPTION_KEY || process.env.SESSION_ENCRYPTION_KEY;
    if (!key) {
      console.warn('No encryption key found, storing value as-is');
      return value;
    }

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error('Encryption failed:', error);
      return value;
    }
  }

  /**
   * Decrypt sensitive values
   */
  static decryptValue(encrypted) {
    if (!encrypted) return null;
    const key = process.env.ENCRYPTION_KEY || process.env.SESSION_ENCRYPTION_KEY;
    if (!key) return encrypted;

    // Check if value is encrypted (has the format iv:authTag:data)
    if (!encrypted.includes(':')) return encrypted;

    try {
      const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Get decrypted scraper config
   */
  static async getDecryptedConfig(marketplaceId) {
    const marketplace = await this.getById(marketplaceId);
    if (!marketplace) return null;

    let config = marketplace.scraper_config || {};

    if (config.apiKey) {
      config.apiKey = this.decryptValue(config.apiKey);
    }

    return config;
  }

  /**
   * Parse JSON field safely
   */
  static parseJsonField(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Get products for a marketplace
   */
  static async getProducts(marketplaceId, options = {}) {
    const { limit = 50, offset = 0, stage } = options;

    let query = `
      SELECT * FROM products
      WHERE marketplace_id = $1
    `;
    const params = [marketplaceId];
    let paramCount = 2;

    if (stage) {
      query += ` AND stage = $${paramCount}`;
      params.push(stage);
      paramCount++;
    }

    query += ` ORDER BY overall_score DESC NULLS LAST, created_at DESC`;
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = MarketplaceService;

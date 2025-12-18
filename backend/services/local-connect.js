const crypto = require('crypto');
const logger = require('../config/logger');
const { supabase } = require('../config/supabase');

/**
 * Local Connect Service
 * 
 * Manages token-based session upload for local Playwright connector.
 * Users run Playwright headed on their machine, then upload storageState.
 */

class LocalConnectService {
  constructor() {
    this.encryptionKey = process.env.SESSION_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('SESSION_ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Generate a short-lived connect token
   */
  async generateConnectToken(userId, platform) {
    try {
      // Generate secure random token
      const connectToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      logger.info(`[Local Connect] Generating connect token for user ${userId}, platform ${platform}`);

      // Store token in database (upsert to handle existing sessions)
      const { data, error } = await supabase
        .from('integration_sessions')
        .upsert({
          user_id: userId,
          platform,
          connect_token: connectToken,
          connect_token_expires_at: expiresAt.toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        })
        .select();

      if (error) {
        logger.error('[Local Connect] Database error:', error);
        throw error;
      }

      return {
        success: true,
        connectToken,
        expiresAt: expiresAt.toISOString(),
        expiresIn: 600 // seconds
      };
    } catch (error) {
      logger.error('[Local Connect] Error generating token:', error);
      throw error;
    }
  }

  /**
   * Upload and store storageState from local connector
   */
  async uploadStorageState(connectToken, storageState) {
    try {
      logger.info(`[Local Connect] Receiving storageState upload for token ${connectToken.substring(0, 8)}...`);

      // Find session by connect token
      const { data: session, error: findError } = await supabase
        .from('integration_sessions')
        .select('*')
        .eq('connect_token', connectToken)
        .single();

      if (findError || !session) {
        logger.warn('[Local Connect] Invalid or expired connect token');
        return {
          success: false,
          error: 'Invalid or expired connect token'
        };
      }

      // Check if token is expired
      if (new Date(session.connect_token_expires_at) < new Date()) {
        logger.warn('[Local Connect] Connect token expired');
        return {
          success: false,
          error: 'Connect token expired. Please request a new token.'
        };
      }

      // Validate storageState structure
      if (!storageState.cookies || !Array.isArray(storageState.cookies)) {
        logger.error('[Local Connect] Invalid storageState format');
        return {
          success: false,
          error: 'Invalid storageState format. Must include cookies array.'
        };
      }

      const cookieCount = storageState.cookies.length;
      logger.info(`[Local Connect] Received ${cookieCount} cookies`);

      // Encrypt storageState
      const storageStateJson = JSON.stringify(storageState);
      const encryptedStorageState = this.encrypt(storageStateJson);

      // Calculate expiry (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Update session in database
      const { data, error } = await supabase
        .from('integration_sessions')
        .update({
          storage_state_json_encrypted: encryptedStorageState,
          cookie_count: cookieCount,
          status: 'active',
          expires_at: expiresAt.toISOString(),
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          connect_token: null, // Clear token after use
          connect_token_expires_at: null,
          last_error: null // Clear any previous errors
        })
        .eq('user_id', session.user_id)
        .eq('platform', session.platform)
        .select();

      if (error) {
        logger.error('[Local Connect] Database error:', error);
        throw error;
      }

      logger.info(`[Local Connect] Successfully stored session for user ${session.user_id}, platform ${session.platform}`);

      return {
        success: true,
        message: 'Session uploaded successfully',
        cookieCount,
        expiresAt: expiresAt.toISOString(),
        platform: session.platform
      };
    } catch (error) {
      logger.error('[Local Connect] Error uploading storageState:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(userId, platform) {
    try {
      const { data, error } = await supabase
        .from('integration_sessions')
        .select('status, cookie_count, last_used_at, expires_at, last_error, last_url, updated_at')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single();

      if (error || !data) {
        return {
          connected: false,
          status: 'not_connected',
          cookieCount: 0
        };
      }

      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();

      return {
        connected: data.status === 'active' && !isExpired,
        status: isExpired ? 'expired' : data.status,
        cookieCount: data.cookie_count || 0,
        lastUsedAt: data.last_used_at,
        expiresAt: data.expires_at,
        needsReconnect: data.status === 'needs_reconnect' || data.status === 'pending' || isExpired,
        lastError: data.last_error,
        lastUrl: data.last_url,
        updatedAt: data.updated_at
      };
    } catch (error) {
      logger.error('[Local Connect] Error getting session status:', error);
      return {
        connected: false,
        status: 'error',
        cookieCount: 0,
        lastError: error.message
      };
    }
  }

  /**
   * Load saved session for scraping
   */
  async loadSession(userId, platform) {
    try {
      const { data, error } = await supabase
        .from('integration_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        logger.warn(`[Local Connect] No active session found for user ${userId}, platform ${platform}`);
        return null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        logger.warn(`[Local Connect] Session expired for user ${userId}, platform ${platform}`);
        await this.markSessionExpired(userId, platform);
        return null;
      }

      // Decrypt storage state
      const storageStateJson = this.decrypt(data.storage_state_json_encrypted);
      const storageState = JSON.parse(storageStateJson);

      // Update last_used_at
      await supabase
        .from('integration_sessions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('platform', platform);

      logger.info(`[Local Connect] Loaded session for user ${userId}, platform ${platform} (${data.cookie_count} cookies)`);

      return storageState;
    } catch (error) {
      logger.error('[Local Connect] Error loading session:', error);
      return null;
    }
  }

  /**
   * Mark session as needing reconnect
   */
  async markSessionNeedsReconnect(userId, platform, error) {
    try {
      await supabase
        .from('integration_sessions')
        .update({
          status: 'needs_reconnect',
          last_error: error,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform);

      logger.info(`[Local Connect] Marked session as needs_reconnect for user ${userId}, platform ${platform}`);
    } catch (err) {
      logger.error('[Local Connect] Error marking session:', err);
    }
  }

  /**
   * Mark session as expired
   */
  async markSessionExpired(userId, platform) {
    try {
      await supabase
        .from('integration_sessions')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('platform', platform);

      logger.info(`[Local Connect] Marked session as expired for user ${userId}, platform ${platform}`);
    } catch (err) {
      logger.error('[Local Connect] Error marking session as expired:', err);
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedText) {
    const { iv, encryptedData, authTag } = JSON.parse(encryptedText);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.encryptionKey, 'hex'),
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = new LocalConnectService();

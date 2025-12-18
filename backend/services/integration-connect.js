const { chromium } = require('playwright');
const crypto = require('crypto');
const logger = require('../config/logger');
const { supabase } = require('../config/supabase');

/**
 * Integration Connect Service
 * 
 * Implements a production-grade "Connect once → save session → scrape headless forever" system
 * with human-in-the-loop authentication for 2FA support.
 */

// In-memory store for active connect sessions
// In production, use Redis for multi-instance support
const activeConnectSessions = new Map();

// Platform configurations
const PLATFORM_CONFIGS = {
  hotmart: {
    loginUrl: 'https://app.hotmart.com/login',
    loginCheckPattern: /dashboard|home|marketplace/,
    loginCheckSelector: '[data-testid="user-menu"], .user-profile, [class*="dashboard"]',
    sessionExpiry: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  clickbank: {
    loginUrl: 'https://accounts.clickbank.com/login',
    loginCheckPattern: /account|dashboard/,
    loginCheckSelector: '.account-menu, [data-testid="account"]',
    sessionExpiry: 14 * 24 * 60 * 60 * 1000 // 14 days
  }
};

class IntegrationConnectService {
  constructor() {
    this.encryptionKey = process.env.SESSION_ENCRYPTION_KEY;
    if (!this.encryptionKey) {
      throw new Error('SESSION_ENCRYPTION_KEY environment variable is required');
    }
  }

  /**
   * Phase 1: Start the connect flow
   * Launches a HEADED browser for human interaction
   */
  async startConnect(userId, platform) {
    try {
      const config = PLATFORM_CONFIGS[platform];
      if (!config) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      logger.info(`[Connect Service] Starting connect flow for user ${userId}, platform ${platform}`);

      // Generate unique session ID
      const connectSessionId = crypto.randomBytes(16).toString('hex');

      // Launch browser in HEADED mode (visible UI)
      const browser = await chromium.launch({
        headless: false, // IMPORTANT: User needs to see the browser
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      });

      // Create browser context
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const page = await context.newPage();

      // Navigate to login page
      await page.goto(config.loginUrl, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      logger.info(`[Connect Service] Browser launched, navigated to ${config.loginUrl}`);

      // Store session in memory
      activeConnectSessions.set(connectSessionId, {
        userId,
        platform,
        browser,
        context,
        page,
        config,
        startedAt: Date.now()
      });

      // Auto-cleanup after 10 minutes if not completed
      setTimeout(() => {
        if (activeConnectSessions.has(connectSessionId)) {
          logger.warn(`[Connect Service] Auto-cleaning up abandoned session ${connectSessionId}`);
          this.cleanupSession(connectSessionId);
        }
      }, 10 * 60 * 1000);

      return {
        success: true,
        connectSessionId,
        message: 'Browser launched. Please complete login and click "I finished login" button.',
        loginUrl: config.loginUrl
      };
    } catch (error) {
      logger.error('[Connect Service] Error starting connect flow:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Complete the connect flow
   * Verifies login, saves session, closes browser
   */
  async completeConnect(connectSessionId) {
    try {
      const session = activeConnectSessions.get(connectSessionId);
      if (!session) {
        throw new Error('Connect session not found or expired');
      }

      const { userId, platform, context, page, config, browser } = session;

      logger.info(`[Connect Service] Completing connect for session ${connectSessionId}`);

      // Check if user is logged in
      const currentUrl = page.url();
      const isLoggedIn = config.loginCheckPattern.test(currentUrl);

      if (!isLoggedIn) {
        // Try to find login indicator element
        const loginElement = await page.$(config.loginCheckSelector).catch(() => null);
        if (!loginElement) {
          return {
            success: false,
            message: 'Login not detected. Please complete login first.',
            currentUrl
          };
        }
      }

      logger.info(`[Connect Service] Login detected at ${currentUrl}`);

      // Extract and save storage state
      const storageState = await context.storageState();
      const storageStateJson = JSON.stringify(storageState);

      // Encrypt storage state
      const encryptedStorageState = this.encrypt(storageStateJson);

      // Save to database
      const expiresAt = new Date(Date.now() + config.sessionExpiry);
      
      const { data, error } = await supabase
        .from('integration_sessions')
        .upsert({
          user_id: userId,
          platform,
          storage_state_json_encrypted: encryptedStorageState,
          status: 'active',
          last_used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          last_url: currentUrl
        }, {
          onConflict: 'user_id,platform'
        })
        .select();

      if (error) {
        logger.error('[Connect Service] Database error:', error);
        throw error;
      }

      logger.info(`[Connect Service] Session saved successfully for user ${userId}, platform ${platform}`);

      // Close browser safely
      await this.cleanupSession(connectSessionId);

      return {
        success: true,
        message: 'Connection successful! Session saved.',
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      logger.error('[Connect Service] Error completing connect:', error);
      throw error;
    }
  }

  /**
   * Get status of an active connect session
   */
  async getConnectStatus(connectSessionId) {
    const session = activeConnectSessions.get(connectSessionId);
    if (!session) {
      return {
        found: false,
        message: 'Session not found or expired'
      };
    }

    const { page, config } = session;
    const currentUrl = page.url();
    const isLoggedIn = config.loginCheckPattern.test(currentUrl);

    return {
      found: true,
      currentUrl,
      isLoggedIn,
      message: isLoggedIn ? 'Login detected' : 'Waiting for login'
    };
  }

  /**
   * Load saved session for a user and platform
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
        logger.warn(`[Connect Service] No active session found for user ${userId}, platform ${platform}`);
        return null;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        logger.warn(`[Connect Service] Session expired for user ${userId}, platform ${platform}`);
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

      logger.info(`[Connect Service] Loaded session for user ${userId}, platform ${platform}`);

      return storageState;
    } catch (error) {
      logger.error('[Connect Service] Error loading session:', error);
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

      logger.info(`[Connect Service] Marked session as needs_reconnect for user ${userId}, platform ${platform}`);
    } catch (err) {
      logger.error('[Connect Service] Error marking session:', err);
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

      logger.info(`[Connect Service] Marked session as expired for user ${userId}, platform ${platform}`);
    } catch (err) {
      logger.error('[Connect Service] Error marking session as expired:', err);
    }
  }

  /**
   * Get session status from database
   */
  async getSessionStatus(userId, platform) {
    try {
      const { data, error } = await supabase
        .from('integration_sessions')
        .select('status, last_used_at, expires_at, last_error, updated_at')
        .eq('user_id', userId)
        .eq('platform', platform)
        .single();

      if (error || !data) {
        return {
          connected: false,
          status: 'not_connected'
        };
      }

      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();

      return {
        connected: data.status === 'active' && !isExpired,
        status: isExpired ? 'expired' : data.status,
        lastUsedAt: data.last_used_at,
        expiresAt: data.expires_at,
        needsReconnect: data.status === 'needs_reconnect' || isExpired,
        lastError: data.last_error,
        updatedAt: data.updated_at
      };
    } catch (error) {
      logger.error('[Connect Service] Error getting session status:', error);
      return {
        connected: false,
        status: 'error',
        lastError: error.message
      };
    }
  }

  /**
   * Cleanup active connect session
   */
  async cleanupSession(connectSessionId) {
    const session = activeConnectSessions.get(connectSessionId);
    if (session) {
      try {
        if (session.page) await session.page.close().catch(() => {});
        if (session.context) await session.context.close().catch(() => {});
        if (session.browser) await session.browser.close().catch(() => {});
      } catch (error) {
        logger.error('[Connect Service] Error during cleanup:', error);
      }
      activeConnectSessions.delete(connectSessionId);
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

module.exports = new IntegrationConnectService();

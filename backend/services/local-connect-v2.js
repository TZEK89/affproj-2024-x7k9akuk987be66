const { supabase } = require('../config/supabase');
const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * LocalConnect Service V2
 * 
 * Updated with:
 * - Session fingerprinting
 * - Explicit reconnect semantics
 * - Hard evidence collection
 */

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;
const TOKEN_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 30;

class LocalConnectService {
  /**
   * Generate a short-lived connect token
   */
  async generateConnectToken(userId, platform) {
    const connectToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Store token in database
    const { error } = await supabase
      .from('integration_sessions')
      .upsert({
        user_id: userId,
        platform,
        connect_token: connectToken,
        connect_token_expires_at: expiresAt.toISOString(),
        status: 'pending_connect',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) {
      logger.error('[LocalConnect] Error generating token:', error);
      throw new Error('Failed to generate connect token');
    }

    logger.info(`[LocalConnect] Generated token for ${platform}, user ${userId}`);

    return {
      success: true,
      connectToken,
      expiresIn: TOKEN_EXPIRY_MINUTES * 60,
      platform
    };
  }

  /**
   * Upload storageState with fingerprint
   */
  async uploadStorageState(connectToken, storageState, fingerprint) {
    // Validate token
    const { data: session, error: fetchError } = await supabase
      .from('integration_sessions')
      .select('*')
      .eq('connect_token', connectToken)
      .single();

    if (fetchError || !session) {
      logger.error('[LocalConnect] Invalid token');
      return {
        success: false,
        error: 'Invalid or expired connect token'
      };
    }

    // Check token expiry
    if (new Date(session.connect_token_expires_at) < new Date()) {
      logger.error('[LocalConnect] Token expired');
      return {
        success: false,
        error: 'Connect token has expired'
      };
    }

    // Encrypt storageState
    const encryptedSession = this.encrypt(JSON.stringify(storageState));

    // Calculate expiry
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // Count cookies
    const cookieCount = storageState.cookies ? storageState.cookies.length : 0;

    // Update session
    const { error: updateError } = await supabase
      .from('integration_sessions')
      .update({
        encrypted_session: encryptedSession,
        fingerprint: fingerprint || null,
        cookie_count: cookieCount,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        connect_token: null, // Clear token after use
        connect_token_expires_at: null,
        last_verified_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
        meta: {
          connected_at: new Date().toISOString(),
          cookie_count: cookieCount,
          fingerprint_provided: !!fingerprint
        }
      })
      .eq('user_id', session.user_id)
      .eq('platform', session.platform);

    if (updateError) {
      logger.error('[LocalConnect] Error uploading session:', updateError);
      throw new Error('Failed to upload session');
    }

    logger.info(`[LocalConnect] Session uploaded for ${session.platform}, user ${session.user_id}, ${cookieCount} cookies`);

    return {
      success: true,
      platform: session.platform,
      cookieCount,
      expiresAt: expiresAt.toISOString()
    };
  }

  /**
   * Get session status with explicit reconnect semantics
   */
  async getSessionStatus(userId, platform) {
    const { data: session, error } = await supabase
      .from('integration_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !session) {
      return {
        connected: false,
        status: 'not_connected',
        needsReconnect: true,
        platform,
        cookieCount: 0,
        reason: 'NO_SESSION'
      };
    }

    // Check if session expired
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return {
        connected: false,
        status: 'expired',
        needsReconnect: true,
        platform,
        cookieCount: session.cookie_count || 0,
        sessionExpiresAt: session.expires_at,
        lastVerifiedAt: session.last_verified_at,
        lastError: 'SESSION_EXPIRED',
        reason: 'SESSION_EXPIRED'
      };
    }

    // Check if marked as needs reconnect
    if (session.status === 'needs_reconnect') {
      return {
        connected: false,
        status: 'needs_reconnect',
        needsReconnect: true,
        platform,
        cookieCount: session.cookie_count || 0,
        sessionExpiresAt: session.expires_at,
        lastVerifiedAt: session.last_verified_at,
        lastError: session.last_error,
        lastUrl: session.last_url,
        reason: session.last_error || 'NEEDS_RECONNECT'
      };
    }

    // Session is active
    return {
      connected: true,
      status: 'active',
      needsReconnect: false,
      platform,
      cookieCount: session.cookie_count || 0,
      sessionExpiresAt: session.expires_at,
      lastVerifiedAt: session.last_verified_at,
      lastUsedAt: session.last_used_at,
      lastUrl: session.last_url
    };
  }

  /**
   * Load session for scraping
   */
  async loadSession(userId, platform) {
    const { data: session, error } = await supabase
      .from('integration_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .single();

    if (error || !session) {
      logger.warn(`[LocalConnect] No session found for ${platform}, user ${userId}`);
      return null;
    }

    // Check status
    if (session.status !== 'active') {
      logger.warn(`[LocalConnect] Session status is ${session.status}, not active`);
      return null;
    }

    // Check expiry
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      logger.warn(`[LocalConnect] Session expired`);
      await this.markSessionNeedsReconnect(userId, platform, 'SESSION_EXPIRED');
      return null;
    }

    // Decrypt session
    try {
      const decrypted = this.decrypt(session.encrypted_session);
      const storageState = JSON.parse(decrypted);

      logger.info(`[LocalConnect] Loaded session for ${platform}, user ${userId}`);

      return {
        storageState,
        fingerprint: session.fingerprint
      };
    } catch (error) {
      logger.error('[LocalConnect] Error decrypting session:', error);
      return null;
    }
  }

  /**
   * Mark session as needs reconnect
   */
  async markSessionNeedsReconnect(userId, platform, reason, evidence = {}) {
    const meta = {
      marked_needs_reconnect_at: new Date().toISOString(),
      reason,
      ...evidence
    };

    const { error } = await supabase
      .from('integration_sessions')
      .update({
        status: 'needs_reconnect',
        last_error: reason,
        last_url: evidence.currentUrl || null,
        meta,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      logger.error('[LocalConnect] Error marking needs reconnect:', error);
    } else {
      logger.info(`[LocalConnect] Marked ${platform} as needs reconnect: ${reason}`);
    }
  }

  /**
   * Update session metadata after successful scrape
   */
  async updateSessionMetadata(userId, platform, metadata) {
    const { error } = await supabase
      .from('integration_sessions')
      .update({
        last_verified_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
        last_url: metadata.lastUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    if (error) {
      logger.error('[LocalConnect] Error updating metadata:', error);
    }
  }

  /**
   * Encrypt data
   */
  encrypt(text) {
    if (!ENCRYPTION_KEY) {
      throw new Error('SESSION_ENCRYPTION_KEY not set');
    }

    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted,
      authTag: authTag.toString('hex')
    });
  }

  /**
   * Decrypt data
   */
  decrypt(encryptedData) {
    if (!ENCRYPTION_KEY) {
      throw new Error('SESSION_ENCRYPTION_KEY not set');
    }

    const { iv, data, authTag } = JSON.parse(encryptedData);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

module.exports = new LocalConnectService();

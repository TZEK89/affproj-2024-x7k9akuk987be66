const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { supabase } = require('../config/supabase');

// Encryption configuration - validate required
if (!process.env.SESSION_ENCRYPTION_KEY) {
  throw new Error('SESSION_ENCRYPTION_KEY environment variable is required');
}

if (!/^[0-9a-f]{64}$/i.test(process.env.SESSION_ENCRYPTION_KEY)) {
  throw new Error('SESSION_ENCRYPTION_KEY must be a 64-character hexadecimal string');
}

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const SESSION_DIR = path.join(__dirname, '../.sessions');

class PlaywrightSessionManager {
  constructor() {
    this.ensureSessionDir();
  }

  async ensureSessionDir() {
    try {
      await fs.mkdir(SESSION_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating session directory:', error);
    }
  }

  /**
   * Encrypt session state before storing
   */
  encryptSessionState(sessionState) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
      iv
    );

    const sessionJson = JSON.stringify(sessionState);
    let encrypted = cipher.update(sessionJson, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt session state
   */
  decryptSessionState(encryptedData) {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  /**
   * Save session state to database and file system
   */
  async saveSession(platformId, sessionState) {
    try {
      // Encrypt session state
      const encryptedData = this.encryptSessionState(sessionState);

      // Save to file system
      const sessionFile = path.join(SESSION_DIR, `${platformId}.json`);
      await fs.writeFile(sessionFile, JSON.stringify(encryptedData, null, 2));

      // Save metadata to database
      const { data, error } = await supabase
        .from('platform_connections')
        .upsert({
          platform_id: platformId,
          status: 'connected',
          session_file: sessionFile,
          last_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'platform_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving session to database:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  /**
   * Load session state from file system
   */
  async loadSession(platformId) {
    try {
      // Get session metadata from database
      const { data: connection, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform_id', platformId)
        .eq('status', 'connected')
        .single();

      if (error || !connection) {
        return null;
      }

      // Check if session is expired (older than 30 days)
      const sessionAge = Date.now() - new Date(connection.last_verified_at).getTime();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      if (sessionAge > thirtyDays) {
        await this.markSessionExpired(platformId);
        return null;
      }

      // Load encrypted session from file
      const sessionFile = path.join(SESSION_DIR, `${platformId}.json`);
      const encryptedData = JSON.parse(await fs.readFile(sessionFile, 'utf8'));

      // Decrypt and return
      const sessionState = this.decryptSessionState(encryptedData);
      return sessionState;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Verify session is still valid by loading a protected page
   */
  async verifySession(platformId, testUrl, loggedInSelector) {
    try {
      // This will be implemented using Playwright MCP
      // For now, just update the last_verified_at timestamp
      const { error } = await supabase
        .from('platform_connections')
        .update({ last_verified_at: new Date().toISOString() })
        .eq('platform_id', platformId);

      if (error) {
        console.error('Error updating verification timestamp:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error verifying session:', error);
      return false;
    }
  }

  /**
   * Mark session as expired
   */
  async markSessionExpired(platformId) {
    try {
      const { error } = await supabase
        .from('platform_connections')
        .update({ status: 'expired' })
        .eq('platform_id', platformId);

      if (error) {
        console.error('Error marking session as expired:', error);
      }

      // Delete session file
      const sessionFile = path.join(SESSION_DIR, `${platformId}.json`);
      await fs.unlink(sessionFile).catch(() => {});
    } catch (error) {
      console.error('Error marking session as expired:', error);
    }
  }

  /**
   * Delete session
   */
  async deleteSession(platformId) {
    try {
      // Delete from database
      await supabase
        .from('platform_connections')
        .delete()
        .eq('platform_id', platformId);

      // Delete session file
      const sessionFile = path.join(SESSION_DIR, `${platformId}.json`);
      await fs.unlink(sessionFile).catch(() => {});

      return { success: true };
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(platformId) {
    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('platform_id', platformId)
        .single();

      if (error || !data) {
        return { status: 'disconnected' };
      }

      // Check if session is expired
      if (data.status === 'connected') {
        const sessionAge = Date.now() - new Date(data.last_verified_at).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (sessionAge > thirtyDays) {
          await this.markSessionExpired(platformId);
          return { status: 'expired', lastVerified: data.last_verified_at };
        }
      }

      return {
        status: data.status,
        lastVerified: data.last_verified_at,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error('Error getting session status:', error);
      return { status: 'error', error: error.message };
    }
  }
}

module.exports = new PlaywrightSessionManager();

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const crypto = require('crypto');

// Platform configurations
const PLATFORMS = {
  hotmart: {
    id: 'hotmart',
    name: 'Hotmart',
    loginUrl: 'https://sso.hotmart.com/login',
    marketplaceUrl: 'https://app.hotmart.com/market',
    loggedInSelectors: [
      '[data-testid="user-menu"]',
      '.user-profile',
      '[class*="UserMenu"]'
    ]
  },
  impact: {
    id: 'impact',
    name: 'Impact.com',
    loginUrl: 'https://app.impact.com/login',
    marketplaceUrl: 'https://app.impact.com/secure/advertiser/marketplace',
    loggedInSelectors: [
      '.user-profile',
      '[class*="UserProfile"]',
      'button[aria-label*="user"]'
    ]
  },
  clickbank: {
    id: 'clickbank',
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    marketplaceUrl: 'https://accounts.clickbank.com/marketplace',
    loggedInSelectors: [
      '.account-menu',
      '[class*="AccountMenu"]'
    ]
  },
  cj: {
    id: 'cj',
    name: 'CJ Affiliate',
    loginUrl: 'https://members.cj.com/member/login',
    marketplaceUrl: 'https://members.cj.com/member/publisher/searchAdvertisers.do',
    loggedInSelectors: [
      '.user-info',
      '[class*="UserInfo"]'
    ]
  }
};

/**
 * Initiate connection - This endpoint is called by the frontend
 * It returns a connection ID that can be used to check status
 */
router.post('/initiate', async (req, res) => {
  try {
    const { platformId } = req.body;
    const platform = PLATFORMS[platformId];

    if (!platform) {
      return res.status(400).json({ error: 'Invalid platform ID' });
    }

    // Create a pending connection record
    const connectionId = crypto.randomUUID();
    
    const { error } = await supabase
      .from('platform_connections')
      .insert({
        id: connectionId,
        platform_id: platformId,
        platform_name: platform.name,
        status: 'pending',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating connection record:', error);
      return res.status(500).json({ error: 'Failed to create connection' });
    }

    res.json({
      success: true,
      connectionId,
      platform: platform.name,
      message: 'Connection initiated. Manus will open the browser for login.'
    });
  } catch (error) {
    console.error('Error initiating connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Check connection status
 */
router.get('/status/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const { data, error } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json({
      status: data.status,
      platformId: data.platform_id,
      platformName: data.platform_name,
      createdAt: data.created_at,
      lastVerified: data.last_verified_at
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get platform connection status by platform ID
 */
router.get('/platform/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;

    const { data, error } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('platform_id', platformId)
      .eq('status', 'connected')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return res.json({ status: 'disconnected' });
    }

    // Check if session is expired (30 days)
    const sessionAge = Date.now() - new Date(data.last_verified_at || data.created_at).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    if (sessionAge > thirtyDays) {
      // Mark as expired
      await supabase
        .from('platform_connections')
        .update({ status: 'expired' })
        .eq('id', data.id);

      return res.json({ status: 'expired', lastVerified: data.last_verified_at });
    }

    res.json({
      status: 'connected',
      connectionId: data.id,
      lastVerified: data.last_verified_at,
      createdAt: data.created_at
    });
  } catch (error) {
    console.error('Error getting platform status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Save captured session data (called by Manus after successful login)
 */
router.post('/save-session', async (req, res) => {
  try {
    const { connectionId, sessionData } = req.body;

    if (!connectionId || !sessionData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Encrypt session data
    const encryptionKey = process.env.SESSION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(encryptionKey.slice(0, 64), 'hex'), iv);

    let encrypted = cipher.update(JSON.stringify(sessionData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const encryptedSession = {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };

    // Update connection record
    const { error } = await supabase
      .from('platform_connections')
      .update({
        status: 'connected',
        session_data: encryptedSession,
        last_verified_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (error) {
      console.error('Error saving session:', error);
      return res.status(500).json({ error: 'Failed to save session' });
    }

    res.json({
      success: true,
      message: 'Session saved successfully'
    });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Disconnect platform
 */
router.post('/disconnect/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;

    const { error } = await supabase
      .from('platform_connections')
      .update({
        status: 'disconnected',
        session_data: null
      })
      .eq('platform_id', platformId);

    if (error) {
      console.error('Error disconnecting:', error);
      return res.status(500).json({ error: 'Failed to disconnect' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

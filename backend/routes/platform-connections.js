const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const platformConnector = require('../services/platform-connector');

// Platform configurations
const PLATFORMS = {
  hotmart: {
    id: 'hotmart',
    name: 'Hotmart',
    loginUrl: 'https://sso.hotmart.com/login',
    marketplaceUrl: 'https://app.hotmart.com/market'
  },
  clickbank: {
    id: 'clickbank',
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    marketplaceUrl: 'https://accounts.clickbank.com/marketplace'
  },
  jvzoo: {
    id: 'jvzoo',
    name: 'JVZoo',
    loginUrl: 'https://www.jvzoo.com/login',
    marketplaceUrl: 'https://www.jvzoo.com/affiliates/marketplace'
  },
  warriorplus: {
    id: 'warriorplus',
    name: 'Warrior Plus',
    loginUrl: 'https://warriorplus.com/login',
    marketplaceUrl: 'https://warriorplus.com/marketplace'
  },
  impact: {
    id: 'impact',
    name: 'Impact',
    loginUrl: 'https://app.impact.com/login',
    marketplaceUrl: 'https://app.impact.com/secure/advertiser/marketplace'
  },
  cj: {
    id: 'cj',
    name: 'CJ Affiliate',
    loginUrl: 'https://members.cj.com/member/login',
    marketplaceUrl: 'https://members.cj.com/member/publisher/searchAdvertisers.do'
  },
  shareasale: {
    id: 'shareasale',
    name: 'ShareASale',
    loginUrl: 'https://account.shareasale.com/a-login.cfm',
    marketplaceUrl: 'https://account.shareasale.com/a-merchants.cfm'
  },
  rakuten: {
    id: 'rakuten',
    name: 'Rakuten',
    loginUrl: 'https://rakutenadvertising.com/login',
    marketplaceUrl: 'https://rakutenadvertising.com/publishers/advertisers'
  },
  awin: {
    id: 'awin',
    name: 'Awin',
    loginUrl: 'https://ui.awin.com/awin-ui/login',
    marketplaceUrl: 'https://ui.awin.com/merchant-profile/advertiser-directory'
  },
  digistore24: {
    id: 'digistore24',
    name: 'Digistore24',
    loginUrl: 'https://www.digistore24.com/login',
    marketplaceUrl: 'https://www.digistore24.com/affiliate/marketplace'
  }
};

// Initiate login flow with Playwright
router.post('/initiate-login', async (req, res) => {
  try {
    const { platformId } = req.body;

    // Use new Playwright connector
    const result = await platformConnector.initiateConnection(platformId);

    res.json(result);
  } catch (error) {
    console.error('Error initiating login:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to initiate login'
    });
  }
});

// Capture session after manual login
router.post('/capture-session', async (req, res) => {
  try {
    const { platformId } = req.body;

    const result = await platformConnector.captureSession(platformId);

    res.json(result);
  } catch (error) {
    console.error('Error capturing session:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to capture session'
    });
  }
});

// Check connection status
router.get('/status/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;

    const status = await platformConnector.getConnectionStatus(platformId);

    res.json(status);
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Internal server error'
    });
  }
});

// Verify connection
router.post('/verify/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;

    const isValid = await platformConnector.verifyConnection(platformId);

    res.json({
      success: true,
      isValid,
      status: isValid ? 'connected' : 'expired'
    });
  } catch (error) {
    console.error('Error verifying connection:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to verify connection'
    });
  }
});

// Save session after manual login
router.post('/save-session', async (req, res) => {
  try {
    const { platformId, sessionData } = req.body;

    const { data, error } = await supabase
      .from('platform_connections')
      .upsert({
        platform_id: platformId,
        platform_name: PLATFORMS[platformId]?.name,
        status: 'connected',
        session_data: sessionData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'platform_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving session:', error);
      return res.status(500).json({ error: 'Failed to save session' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disconnect platform
router.post('/disconnect/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;

    const result = await platformConnector.disconnect(platformId);

    res.json(result);
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start scraping with saved session
router.post('/scrape', async (req, res) => {
  try {
    const { platformId } = req.body;

    // Get saved session
    const { data: connection, error } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('platform_id', platformId)
      .eq('status', 'connected')
      .single();

    if (error || !connection) {
      return res.status(400).json({ error: 'Platform not connected' });
    }

    // Trigger scraping job (this would be handled by a background worker)
    // For now, we'll just return success
    // In production, this would call the Python scraper with the saved session

    res.json({
      success: true,
      message: `Scraping started for ${PLATFORMS[platformId]?.name}`,
      jobId: `scrape_${platformId}_${Date.now()}`
    });
  } catch (error) {
    console.error('Error starting scrape:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all platforms with connection status
router.get('/platforms', async (req, res) => {
  try {
    const { data: connections, error } = await supabase
      .from('platform_connections')
      .select('*');

    if (error) {
      console.error('Error fetching connections:', error);
      return res.status(500).json({ error: 'Failed to fetch platforms' });
    }

    // Merge with platform configs
    const platforms = Object.values(PLATFORMS).map(platform => {
      const connection = connections?.find(c => c.platform_id === platform.id);
      return {
        ...platform,
        status: connection?.status || 'disconnected',
        lastConnected: connection?.created_at,
        productsScraped: 0 // TODO: Get from database
      };
    });

    res.json({ platforms });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

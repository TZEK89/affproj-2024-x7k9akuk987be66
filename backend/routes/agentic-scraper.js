const express = require('express');
const router = express.Router();
const agenticScraper = require('../services/agentic-scraper');

/**
 * Create a new scraping mission
 * POST /api/agentic-scraper/missions
 */
router.post('/missions', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;
    const { platformId, goal, constraints } = req.body;

    if (!platformId || !goal) {
      return res.status(400).json({
        success: false,
        error: 'platformId and goal are required'
      });
    }

    const result = await agenticScraper.createMission(userId, platformId, goal, constraints);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error creating mission:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all missions
 * GET /api/agentic-scraper/missions
 */
router.get('/missions', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;

    const { data, error } = await require('../config/supabase').supabase
      .from('scraping_missions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      missions: data || []
    });
  } catch (error) {
    console.error('Error getting missions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get mission by ID
 * GET /api/agentic-scraper/missions/:id
 */
router.get('/missions/:id', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;
    const { id } = req.params;

    const { data, error } = await require('../config/supabase').supabase
      .from('scraping_missions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      mission: data
    });
  } catch (error) {
    console.error('Error getting mission:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get decrypted session for scraping (called by Manus)
 * GET /api/agentic-scraper/session/:connectionId
 */
router.get('/session/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const result = await agenticScraper.getSession(connectionId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Save scraping results (called by Manus)
 * POST /api/agentic-scraper/results
 */
router.post('/results', async (req, res) => {
  try {
    const { missionId, products, strategy } = req.body;

    if (!missionId || !products || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'missionId, products, and strategy are required'
      });
    }

    const result = await agenticScraper.saveResults(missionId, products, strategy);
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error saving results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get learned strategy for a platform
 * GET /api/agentic-scraper/strategy/:platformId
 */
router.get('/strategy/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const result = await agenticScraper.getLearnedStrategy(platformId);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error getting strategy:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

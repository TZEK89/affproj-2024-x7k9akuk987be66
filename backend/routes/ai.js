/**
 * AI Routes
 * API endpoints for AI image generation, content creation, analysis, and chat
 */

const express = require('express');
const router = express.Router();
const AIService = require('../services/ai/AIService');
const authenticateToken = require('../middleware/auth');

/**
 * GET /api/ai
 * Get AI service overview and available capabilities
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      name: 'AI Services',
      version: '1.0.0',
      capabilities: {
        imageGeneration: {
          description: 'Generate images using AI',
          endpoint: 'POST /api/ai/generate-image',
          providers: ['stability', 'midjourney']
        },
        contentGeneration: {
          description: 'Generate text content (descriptions, ads, emails)',
          endpoint: 'POST /api/ai/generate-content',
          providers: ['manus', 'openai']
        },
        dataAnalysis: {
          description: 'Analyze performance data and get insights',
          endpoint: 'POST /api/ai/analyze',
          providers: ['manus', 'openai']
        },
        chat: {
          description: 'Chat with AI assistant',
          endpoint: 'POST /api/ai/chat',
          providers: ['manus', 'openai']
        }
      },
      endpoints: [
        'GET /api/ai - This overview',
        'GET /api/ai/providers - List available AI providers',
        'GET /api/ai/settings - Get your AI settings',
        'PUT /api/ai/settings/:provider - Update provider settings',
        'GET /api/ai/history - Generation history',
        'GET /api/ai/stats - Usage statistics',
        'POST /api/ai/generate-image - Generate images',
        'POST /api/ai/generate-content - Generate text',
        'POST /api/ai/analyze - Analyze data',
        'POST /api/ai/chat - Chat with AI',
        'POST /api/ai/test-connection - Test provider connection'
      ]
    });
  } catch (error) {
    console.error('AI overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/ai/generate-image
 * Generate an image using AI
 */
router.post('/generate-image', async (req, res) => {
  try {
    const {
      provider = 'auto',
      prompt,
      style,
      size,
      productId,
      apiKey
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    const result = await AIService.generateImage({
      provider,
      prompt,
      style,
      size,
      userId: req.user.userId,
      productId,
      apiKey
    });

    res.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai/generate-content
 * Generate text content using AI
 */
router.post('/generate-content', async (req, res) => {
  try {
    const {
      provider = 'auto',
      type = 'description',
      context,
      length,
      tone,
      productId,
      apiKey
    } = req.body;

    if (!context) {
      return res.status(400).json({
        success: false,
        message: 'Context is required'
      });
    }

    const result = await AIService.generateContent({
      provider,
      type,
      context,
      length,
      tone,
      userId: req.user.userId,
      productId,
      apiKey
    });

    res.json(result);
  } catch (error) {
    console.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai/analyze
 * Analyze data using AI
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      provider = 'auto',
      type = 'performance',
      data,
      apiKey
    } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required'
      });
    }

    const result = await AIService.analyzeData({
      provider,
      type,
      data,
      userId: req.user.userId,
      apiKey
    });

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai/chat
 * Chat with AI assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const {
      provider = 'auto',
      message,
      context,
      apiKey
    } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const result = await AIService.chat({
      provider,
      message,
      context,
      userId: req.user.userId,
      apiKey
    });

    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai/providers
 * Get available AI providers
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = await AIService.getAvailableProviders();
    
    res.json({
      success: true,
      providers: providers.map(p => ({
        name: p.name,
        displayName: p.display_name,
        types: p.type,
        isEnabled: p.is_enabled,
        priority: p.priority
      }))
    });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai/settings
 * Get user's AI settings
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await AIService.getUserSettings(req.user.userId);
    
    res.json({
      success: true,
      settings: settings.map(s => ({
        provider: s.provider_name,
        hasApiKey: !!s.api_key,
        preferences: s.preferences,
        defaults: {
          image: s.is_default_image,
          text: s.is_default_text,
          analysis: s.is_default_analysis,
          chat: s.is_default_chat
        }
      }))
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/ai/settings/:provider
 * Update user's AI settings for a provider
 */
router.put('/settings/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const {
      apiKey,
      preferences,
      isDefaultImage,
      isDefaultText,
      isDefaultAnalysis,
      isDefaultChat
    } = req.body;

    const result = await AIService.updateUserSettings(
      req.user.userId,
      provider,
      {
        apiKey,
        preferences,
        isDefaultImage,
        isDefaultText,
        isDefaultAnalysis,
        isDefaultChat
      }
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: result
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai/history
 * Get AI generation history
 */
router.get('/history', async (req, res) => {
  try {
    const {
      provider,
      type,
      productId,
      limit = 50
    } = req.query;

    const history = await AIService.getGenerationHistory(
      req.user.userId,
      {
        providerName: provider,
        generationType: type,
        productId: productId ? parseInt(productId) : undefined
      }
    );

    res.json({
      success: true,
      history: history.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/ai/stats
 * Get AI usage statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate = new Date().toISOString().split('T')[0]
    } = req.query;

    const stats = await AIService.getUsageStats(
      req.user.userId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      stats,
      period: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/ai/test-connection
 * Test API connection for a provider
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Provider and API key are required'
      });
    }

    const providerInstance = await AIService.getProvider(provider, 'image', null);
    const isConnected = await providerInstance.testConnection(apiKey);

    res.json({
      success: true,
      connected: isConnected,
      provider
    });
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      connected: false
    });
  }
});

module.exports = router;

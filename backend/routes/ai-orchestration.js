/**
 * AI Orchestration API Routes
 * Connects the Node.js backend to the Python AI system
 */

const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const axios = require('axios');

// AI System base URL (Python FastAPI server)
const AI_SYSTEM_URL = process.env.AI_SYSTEM_URL || 'http://localhost:8000';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Make a request to the AI system
 */
async function aiRequest(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${AI_SYSTEM_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`AI System Error: ${error.message}`);
        return { 
            success: false, 
            error: error.response?.data?.detail || error.message 
        };
    }
}

// =============================================================================
// CHAT ENDPOINTS
// =============================================================================

/**
 * POST /api/ai/chat
 * Main chat interface for the AI command center
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, sessionId, userId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        const result = await aiRequest('/chat', 'POST', {
            message,
            session_id: sessionId || 'default',
            user_id: userId || req.user?.id || 'anonymous'
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to process chat message' });
    }
});

// =============================================================================
// CORE EXECUTION ENDPOINTS
// =============================================================================

/**
 * GET /api/ai/cores
 * List all available AI cores
 */
router.get('/cores', async (req, res) => {
    try {
        const result = await aiRequest('/cores');
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Cores list error:', error);
        res.status(500).json({ error: 'Failed to fetch cores' });
    }
});

/**
 * POST /api/ai/execute
 * Execute a specific AI core
 */
router.post('/execute', async (req, res) => {
    try {
        const { core, task, parameters } = req.body;
        
        if (!core || !task) {
            return res.status(400).json({ error: 'Core and task are required' });
        }
        
        const result = await aiRequest('/execute', 'POST', {
            core,
            task,
            parameters: parameters || {}
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Execute error:', error);
        res.status(500).json({ error: 'Failed to execute core' });
    }
});

/**
 * POST /api/ai/offer-intelligence
 * Execute Offer Intelligence core
 */
router.post('/offer-intelligence', async (req, res) => {
    try {
        const { query, niche, minCommission, platforms } = req.body;
        
        const task = `Find affiliate products: ${query || 'top products'}
            ${niche ? `Niche: ${niche}` : ''}
            ${minCommission ? `Minimum commission: ${minCommission}%` : ''}
            ${platforms ? `Platforms: ${platforms.join(', ')}` : ''}`;
        
        const result = await aiRequest('/execute', 'POST', {
            core: 'offer_intelligence',
            task,
            parameters: { niche, minCommission, platforms }
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Offer intelligence error:', error);
        res.status(500).json({ error: 'Failed to execute offer intelligence' });
    }
});

/**
 * POST /api/ai/content-generation
 * Execute Content Generation core
 */
router.post('/content-generation', async (req, res) => {
    try {
        const { productName, productPrice, niche, contentTypes } = req.body;
        
        if (!productName) {
            return res.status(400).json({ error: 'Product name is required' });
        }
        
        const task = `Create marketing content for: ${productName}
            Price: ${productPrice || 'Not specified'}
            Niche: ${niche || 'General'}
            Content types: ${contentTypes?.join(', ') || 'All types'}`;
        
        const result = await aiRequest('/execute', 'POST', {
            core: 'content_generation',
            task,
            parameters: { productName, productPrice, niche, contentTypes }
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

/**
 * POST /api/ai/financial-analysis
 * Execute Financial Intelligence core
 */
router.post('/financial-analysis', async (req, res) => {
    try {
        const { period, platforms, includeForecasts } = req.body;
        
        const task = `Analyze financial performance
            Period: ${period || 'Last 30 days'}
            Platforms: ${platforms?.join(', ') || 'All platforms'}
            ${includeForecasts ? 'Include 3-month forecasts' : ''}`;
        
        const result = await aiRequest('/execute', 'POST', {
            core: 'financial_intelligence',
            task,
            parameters: { period, platforms, includeForecasts }
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Financial analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze finances' });
    }
});

// =============================================================================
// KNOWLEDGE BASE ENDPOINTS
// =============================================================================

/**
 * POST /api/ai/knowledge/query
 * Query the knowledge base
 */
router.post('/knowledge/query', async (req, res) => {
    try {
        const { question, category } = req.body;
        
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        
        const result = await aiRequest('/knowledge/query', 'POST', {
            question,
            category
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Knowledge query error:', error);
        res.status(500).json({ error: 'Failed to query knowledge base' });
    }
});

/**
 * POST /api/ai/knowledge/add
 * Add a document to the knowledge base
 */
router.post('/knowledge/add', async (req, res) => {
    try {
        const { title, content, category, docType } = req.body;
        
        if (!title || !content || !category) {
            return res.status(400).json({ 
                error: 'Title, content, and category are required' 
            });
        }
        
        const result = await aiRequest('/knowledge/add', 'POST', {
            title,
            content,
            category,
            doc_type: docType || 'custom'
        });
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Knowledge add error:', error);
        res.status(500).json({ error: 'Failed to add to knowledge base' });
    }
});

/**
 * GET /api/ai/knowledge/list
 * List all documents in the knowledge base
 */
router.get('/knowledge/list', async (req, res) => {
    try {
        const result = await aiRequest('/knowledge/list');
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Knowledge list error:', error);
        res.status(500).json({ error: 'Failed to list knowledge base' });
    }
});

// =============================================================================
// STATUS & MONITORING ENDPOINTS
// =============================================================================

/**
 * GET /api/ai/status
 * Get AI system status
 */
router.get('/status', async (req, res) => {
    try {
        const result = await aiRequest('/status');
        
        if (result.success) {
            res.json({
                ...result.data,
                aiSystemUrl: AI_SYSTEM_URL,
                connected: true
            });
        } else {
            res.json({
                initialized: false,
                connected: false,
                error: result.error
            });
        }
    } catch (error) {
        res.json({
            initialized: false,
            connected: false,
            error: error.message
        });
    }
});

/**
 * GET /api/ai/history
 * Get task execution history
 */
router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const result = await aiRequest(`/history?limit=${limit}`);
        
        if (result.success) {
            res.json(result.data);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('History error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;

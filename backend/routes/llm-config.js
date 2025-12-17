const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const crypto = require('crypto');

// Encryption for API keys
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

function encryptApiKey(apiKey) {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decryptApiKey(encryptedData) {
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Get all LLM configurations
 * GET /api/llm-config
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;

    const { data, error } = await supabase
      .from('llm_configurations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Don't send encrypted API keys to frontend
    const configs = (data || []).map(config => ({
      id: config.id,
      provider: config.provider,
      model: config.model,
      displayName: config.display_name,
      isActive: config.is_active,
      hasApiKey: !!config.api_key_encrypted,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    }));

    res.json({ success: true, configurations: configs });
  } catch (error) {
    console.error('Error getting LLM configurations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Add new LLM configuration
 * POST /api/llm-config
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;
    const { provider, model, displayName, apiKey, baseUrl } = req.body;

    if (!provider || !model || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'provider, model, and apiKey are required'
      });
    }

    // Encrypt API key
    const encryptedKey = encryptApiKey(apiKey);

    const { data, error } = await supabase
      .from('llm_configurations')
      .insert({
        user_id: userId,
        provider,
        model,
        display_name: displayName || `${provider} ${model}`,
        api_key_encrypted: encryptedKey,
        base_url: baseUrl,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      configuration: {
        id: data.id,
        provider: data.provider,
        model: data.model,
        displayName: data.display_name,
        isActive: data.is_active
      }
    });
  } catch (error) {
    console.error('Error adding LLM configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update LLM configuration
 * PUT /api/llm-config/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;
    const { id } = req.params;
    const { displayName, apiKey, baseUrl, isActive } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (displayName !== undefined) updates.display_name = displayName;
    if (baseUrl !== undefined) updates.base_url = baseUrl;
    if (isActive !== undefined) updates.is_active = isActive;
    
    if (apiKey) {
      updates.api_key_encrypted = encryptApiKey(apiKey);
    }

    const { data, error} = await supabase
      .from('llm_configurations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      configuration: {
        id: data.id,
        provider: data.provider,
        model: data.model,
        displayName: data.display_name,
        isActive: data.is_active
      }
    });
  } catch (error) {
    console.error('Error updating LLM configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete LLM configuration
 * DELETE /api/llm-config/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.userId || 1;
    const { id } = req.params;

    const { error } = await supabase
      .from('llm_configurations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting LLM configuration:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get decrypted API key for internal use (not exposed to frontend)
 * Used by backend services to make LLM API calls
 */
async function getDecryptedApiKey(configId, userId) {
  const { data, error } = await supabase
    .from('llm_configurations')
    .select('api_key_encrypted')
    .eq('id', configId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('LLM configuration not found');
  }

  return decryptApiKey(data.api_key_encrypted);
}

module.exports = router;
module.exports.getDecryptedApiKey = getDecryptedApiKey;

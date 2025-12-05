-- AI Providers Table
CREATE TABLE IF NOT EXISTS ai_providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(50)[] NOT NULL, -- Array of types: 'image', 'text', 'analysis', 'chat'
    api_endpoint TEXT,
    is_enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User AI Settings Table
CREATE TABLE IF NOT EXISTS user_ai_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    api_key TEXT,
    preferences JSONB DEFAULT '{}',
    is_default_image BOOLEAN DEFAULT false,
    is_default_text BOOLEAN DEFAULT false,
    is_default_analysis BOOLEAN DEFAULT false,
    is_default_chat BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider_name)
);

-- AI Generation History Table
CREATE TABLE IF NOT EXISTS ai_generation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    provider_name VARCHAR(50) NOT NULL,
    generation_type VARCHAR(50) NOT NULL, -- 'image', 'description', 'marketing', 'analysis', 'chat'
    prompt TEXT,
    result TEXT,
    result_url TEXT,
    metadata JSONB DEFAULT '{}',
    cost DECIMAL(10, 4),
    duration_ms INTEGER,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Usage Stats Table
CREATE TABLE IF NOT EXISTS ai_usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    generation_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 4) DEFAULT 0,
    total_duration_ms BIGINT DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider_name, date)
);

-- Insert default AI providers
INSERT INTO ai_providers (name, display_name, type, api_endpoint, is_enabled, priority, config) VALUES
('manus', 'Manus AI', ARRAY['image', 'text', 'analysis', 'chat'], 'https://api.manus.im/v1', true, 1, '{"supports_batch": true, "max_concurrent": 5}'),
('openai', 'OpenAI', ARRAY['image', 'text'], 'https://api.openai.com/v1', true, 2, '{"models": {"image": "dall-e-3", "text": "gpt-4"}}'),
('stability', 'Stability AI', ARRAY['image'], 'https://api.stability.ai/v1', false, 3, '{"model": "stable-diffusion-xl-1024-v1-0"}')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_settings_user_id ON user_ai_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_user_id ON ai_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_product_id ON ai_generation_history(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_provider ON ai_generation_history(provider_name);
CREATE INDEX IF NOT EXISTS idx_ai_generation_history_created_at ON ai_generation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_stats_user_provider_date ON ai_usage_stats(user_id, provider_name, date);

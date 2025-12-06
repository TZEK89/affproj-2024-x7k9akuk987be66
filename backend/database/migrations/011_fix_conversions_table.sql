-- Drop and recreate conversions table without foreign key constraints
DROP TABLE IF EXISTS conversions CASCADE;

CREATE TABLE conversions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    user_id INTEGER,
    campaign_id INTEGER,
    
    -- Network and transaction info
    network VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    external_id VARCHAR(255),
    
    -- Financial data
    sale_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    commission_amount DECIMAL(10, 2),
    commission_rate DECIMAL(5, 2),
    
    -- Status and dates
    status VARCHAR(50) DEFAULT 'pending',
    conversion_date TIMESTAMP,
    approved_date TIMESTAMP,
    paid_date TIMESTAMP,
    
    -- Customer info (optional)
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    
    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_conversions_product_id ON conversions(product_id);
CREATE INDEX idx_conversions_user_id ON conversions(user_id);
CREATE INDEX idx_conversions_campaign_id ON conversions(campaign_id);
CREATE INDEX idx_conversions_network ON conversions(network);
CREATE INDEX idx_conversions_transaction_id ON conversions(network, transaction_id);
CREATE INDEX idx_conversions_status ON conversions(status);
CREATE INDEX idx_conversions_conversion_date ON conversions(conversion_date);

-- Unique constraint to prevent duplicate conversions
CREATE UNIQUE INDEX idx_conversions_unique ON conversions(network, transaction_id);

-- Comments
COMMENT ON TABLE conversions IS 'Tracks affiliate sales and commissions from all networks';
COMMENT ON COLUMN conversions.network IS 'Affiliate network (hotmart, impact, shareasale, etc.)';
COMMENT ON COLUMN conversions.transaction_id IS 'Unique transaction ID from the affiliate network';
COMMENT ON COLUMN conversions.status IS 'Status: pending, completed, approved, canceled, refunded, chargeback';
COMMENT ON COLUMN conversions.metadata IS 'Additional conversion data in JSON format';

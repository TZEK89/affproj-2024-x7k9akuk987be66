-- Update products table to support multiple affiliate networks
-- This migration adds columns needed for Hotmart, Impact.com, and other networks

-- Add new columns for network support
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS network VARCHAR(50),
ADD COLUMN IF NOT EXISTS network_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS network_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_url TEXT,
ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS category VARCHAR(255),
ADD COLUMN IF NOT EXISTS advertiser_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS stock_status VARCHAR(50) DEFAULT 'InStock',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Migrate existing data from old columns to new columns
UPDATE products 
SET 
  network = source,
  network_id = source_id,
  external_id = source_id,
  product_url = affiliate_link
WHERE network IS NULL;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_network ON products(network);
CREATE INDEX IF NOT EXISTS idx_products_network_id ON products(network, network_id);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(stock_status);

-- Add unique constraint to prevent duplicate products from same network
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_network_unique 
ON products(network, network_id) 
WHERE network IS NOT NULL AND network_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN products.network IS 'Affiliate network name (hotmart, impact, shareasale, etc.)';
COMMENT ON COLUMN products.network_id IS 'Product ID in the affiliate network';
COMMENT ON COLUMN products.external_id IS 'External product identifier';
COMMENT ON COLUMN products.metadata IS 'Additional product data in JSON format';

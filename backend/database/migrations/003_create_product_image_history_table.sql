-- Create product_image_history table
CREATE TABLE IF NOT EXISTS product_image_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    source VARCHAR(50) NOT NULL,
    prompt TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_image_history_product_id ON product_image_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_image_history_is_current ON product_image_history(product_id, is_current);

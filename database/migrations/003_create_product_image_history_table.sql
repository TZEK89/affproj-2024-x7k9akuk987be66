-- Create product_image_history table for tracking image changes

CREATE TABLE IF NOT EXISTS product_image_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  generation_method VARCHAR(50) NOT NULL, -- 'ai_generated', 'manual_upload', 'external_url'
  prompt TEXT, -- The prompt used for AI generation (if applicable)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for better query performance
CREATE INDEX idx_product_image_history_product_id ON product_image_history(product_id);
CREATE INDEX idx_product_image_history_created_at ON product_image_history(created_at DESC);

-- Add comments
COMMENT ON TABLE product_image_history IS 'Tracks the history of product image changes';
COMMENT ON COLUMN product_image_history.generation_method IS 'Method used to generate/obtain the image: ai_generated, manual_upload, or external_url';
COMMENT ON COLUMN product_image_history.prompt IS 'The AI prompt used to generate the image (only for ai_generated method)';

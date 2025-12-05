# Hybrid AI + Manual Image System Integration Guide

## 1. Overview

This guide explains how to implement the hybrid image system, which combines automatic AI-generated product covers with manual user control. This system enhances your affiliate marketing dashboard by providing professional, relevant images for all your products, which can be used for both management and ad creative inspiration.

### Key Features:
- **Automatic AI Image Generation:** When syncing products from Hotmart, a professional cover image is automatically generated using DALL-E 3.
- **Manual Image Upload:** Users can upload their own custom images to replace the AI-generated ones.
- **AI Image Regeneration:** Users can regenerate images with custom prompts to get different styles or variations.
- **Image History:** All image changes are tracked, allowing users to revert to previous versions.
- **Product Notes:** Users can add notes and comments to products for better organization.

## 2. Architecture

The system consists of three main components:

**1. Backend Services:**
   - `imageGenerationService.js`: Handles all interactions with the DALL-E 3 API.
   - `hotmartService.js`: Fetches product data from Hotmart.
   - `syncHotmartOffers.js`: The job that orchestrates product syncing and triggers image generation.

**2. API Routes:**
   - `/api/hotmart`: Routes for managing the Hotmart integration (sync, status, etc.).
   - `/api/products/:id/images`: Routes for managing product images (generate, upload, history).
   - `/api/products/:id/notes`: Route for adding notes to products.

**3. Database:**
   - `products` table: Stores the current `image_url` for each product.
   - `product_image_history` table: Tracks all image changes for auditing and versioning.

## 3. Implementation Steps

### Step 1: Update Backend Dependencies

Install the necessary npm packages for the backend:

```bash
cd /path/to/your/backend
npm install openai multer
```

### Step 2: Add New Backend Files

Place the following files in your backend directory:

- `services/imageGenerationService.js`
- `routes/productImages.js`

### Step 3: Update Existing Backend Files

1.  **`jobs/syncHotmartOffers.js`:**
    -   Update the sync job to call the `ImageGenerationService` when new products are found.
    -   This will automatically generate images for new products.

2.  **`server.js`:**
    -   Register the new `productImages` routes to expose the image management endpoints.

### Step 4: Update Database

Run the following SQL migration to create the `product_image_history` table:

```sql
-- Create product_image_history table
CREATE TABLE IF NOT EXISTS product_image_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  generation_method VARCHAR(50) NOT NULL, -- e.g., 'ai_generated', 'manual_upload'
  prompt TEXT, -- The prompt used for AI generation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_product_image_history_product_id ON product_image_history(product_id);
```

### Step 5: Configure Environment Variables

Add your OpenAI API key to your backend `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

## 4. How to Use

**1. Automatic Image Generation:**
   - When you run the Hotmart sync job, new products will automatically have a DALL-E 3 generated image.

**2. Manual Image Management (via API):**
   - **Upload a custom image:**
     - `POST /api/products/{id}/images/upload`
     - Send a `multipart/form-data` request with an `image` file.

   - **Regenerate an image with a custom prompt:**
     - `POST /api/products/{id}/images/generate`
     - Send a JSON body with `{"customPrompt": "Your new prompt here"}`.

   - **View image history:**
     - `GET /api/products/{id}/images/history`

   - **Add a note:**
     - `POST /api/products/{id}/notes`
     - Send a JSON body with `{"note": "This is a test note."}`.

## 5. Next Steps

With the backend complete, the next step is to build the frontend UI to interact with these new features:

- **Update the Offers page** to display product images.
- **Create an image management modal** with options to upload, regenerate, and view history.
- **Add a notes section** to the product details view.

This hybrid system provides a powerful and flexible way to manage your product visuals, combining the best of AI automation and manual control.

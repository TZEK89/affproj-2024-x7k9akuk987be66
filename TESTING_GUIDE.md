# Complete System Testing Guide

## Overview

This guide will walk you through testing the complete affiliate marketing system with Hotmart integration, AI image generation, and the Image Manager Modal.

## Prerequisites

Before testing, ensure you have:

- ✅ PostgreSQL database running
- ✅ Backend server running on port 5000
- ✅ Frontend dev server running on port 3000
- ✅ Environment variables configured
- ✅ Hotmart API credentials
- ✅ OpenAI API key

## Environment Setup

### Backend `.env`

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/affiliate_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Hotmart
HOTMART_CLIENT_ID=your_hotmart_client_id
HOTMART_CLIENT_SECRET=your_hotmart_client_secret
HOTMART_SANDBOX=false

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Server
PORT=5000
NODE_ENV=development
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Database Setup

1. **Run migrations:**
   ```bash
   cd backend
   psql -U your_user -d affiliate_db -f database/migrations/001_create_users_table.sql
   psql -U your_user -d affiliate_db -f database/migrations/002_create_products_table.sql
   psql -U your_user -d affiliate_db -f database/migrations/003_create_product_image_history_table.sql
   ```

2. **Verify tables:**
   ```bash
   psql -U your_user -d affiliate_db -c "\dt"
   ```

   You should see:
   - users
   - products
   - product_image_history
   - product_notes
   - campaigns
   - conversions
   - subscribers
   - landing_pages

## Starting the Servers

### Backend

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
Server running on port 5000
Database connected successfully
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000
```

## Test Sequence

### Phase 1: Authentication (5 minutes)

#### Test 1.1: Register New User

1. Navigate to `http://localhost:3000/register`
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!
3. Click "Register"

**Expected Result:**
- ✅ Redirect to dashboard
- ✅ JWT token stored in localStorage
- ✅ Welcome message displayed

#### Test 1.2: Logout and Login

1. Click user menu → Logout
2. Navigate to `http://localhost:3000/login`
3. Enter credentials from Test 1.1
4. Click "Login"

**Expected Result:**
- ✅ Redirect to dashboard
- ✅ User data loaded correctly

### Phase 2: Hotmart Integration (10 minutes)

#### Test 2.1: Navigate to Integrations

1. Click "Integrations" in the sidebar
2. Scroll to "Affiliate Networks" section

**Expected Result:**
- ✅ See Hotmart card with 🔥 icon
- ✅ Status shows "disconnected"
- ✅ "Connect" button visible

#### Test 2.2: Test Hotmart Connection

1. Click "Connect" on Hotmart card
2. Wait for API test

**Expected Result:**
- ✅ Success alert: "Successfully connected to Hotmart!"
- ✅ Status changes to "connected"
- ✅ "Sync Offers" button appears

**If it fails:**
- Check Hotmart credentials in `.env`
- Check backend logs for error details
- Verify Hotmart API is accessible

#### Test 2.3: Sync Hotmart Products

1. Click "Sync Offers" on Hotmart card
2. Watch the progress message

**Expected Result:**
- ✅ Message: "Starting Hotmart sync with AI image generation..."
- ✅ Sync completes within 2-5 minutes
- ✅ Success message: "Sync completed successfully!"
- ✅ Product count updates (e.g., "150 products")

**Backend logs should show:**
```
Fetching Hotmart products...
Generating image for: [Product Name]
DALL-E 3 generated image: https://...
Product saved: [Product ID]
Sync complete: 150 products processed
```

### Phase 3: Offers Page (5 minutes)

#### Test 3.1: View Products

1. Click "Offers" in the sidebar

**Expected Result:**
- ✅ Beautiful product cards displayed in 3-column grid
- ✅ Each card shows AI-generated image
- ✅ Product name, price, commission visible
- ✅ Network badge shows "Hotmart"
- ✅ Status badge shows "Active"

#### Test 3.2: Filter Products

1. Click "Hotmart" filter tab

**Expected Result:**
- ✅ Only Hotmart products shown
- ✅ Product count updates

2. Click "Active" filter tab

**Expected Result:**
- ✅ Only active products shown

#### Test 3.3: Hover Effects

1. Hover over a product card

**Expected Result:**
- ✅ Card shadow increases
- ✅ Dark overlay appears on image
- ✅ "Change Image" button becomes visible

### Phase 4: Image Manager Modal (15 minutes)

#### Test 4.1: Open Modal

1. Hover over a product card
2. Click "Change Image" button

**Expected Result:**
- ✅ Modal opens with 4 tabs: Upload, AI Generate, History, Notes
- ✅ Product name displayed in header
- ✅ "Upload" tab active by default

#### Test 4.2: Upload Custom Image

1. Click the upload area or drag an image file
2. Select a JPG/PNG image (< 5MB)
3. Preview appears
4. Click "Upload Image"

**Expected Result:**
- ✅ Upload progress shown
- ✅ Success message: "Image uploaded successfully!"
- ✅ Product card image updates immediately
- ✅ Modal can be closed

**Test error handling:**
- Try uploading a file > 5MB → Error: "File size must be less than 5MB"
- Try uploading a PDF → Error: "Only JPG, PNG, and WebP images are allowed"

#### Test 4.3: AI Image Generation

1. Open modal again
2. Click "AI Generate" tab
3. Edit the prompt (e.g., "Modern minimalist product cover for [product name], blue and white color scheme")
4. Click "Generate New Image"

**Expected Result:**
- ✅ Button shows "Generating with DALL-E 3..."
- ✅ Takes 5-10 seconds
- ✅ Success message: "Image generated successfully!"
- ✅ Product card updates with new AI image

**Backend logs should show:**
```
Generating image with DALL-E 3...
Prompt: Modern minimalist product cover...
Image URL: https://oaidalleapiprodscus.blob.core.windows.net/...
```

#### Test 4.4: Image History

1. Click "History" tab

**Expected Result:**
- ✅ See all previous images (uploaded + AI-generated)
- ✅ Each shows source (🎨 AI Generated or 📤 Uploaded)
- ✅ AI-generated images show the prompt used
- ✅ Date displayed for each

2. Click "Restore This Image" on an old image

**Expected Result:**
- ✅ Success message: "Image restored successfully!"
- ✅ Product card updates to show restored image

#### Test 4.5: Product Notes

1. Click "Notes" tab
2. Type some notes (e.g., "Target audience: young professionals, best for Facebook ads")
3. Click "Save Notes"

**Expected Result:**
- ✅ Success message: "Notes saved successfully!"

4. Close modal and reopen it
5. Go to Notes tab

**Expected Result:**
- ✅ Notes are still there (persisted)

### Phase 5: End-to-End Workflow (10 minutes)

#### Test 5.1: Complete Product Setup

1. Go to Integrations
2. Sync Hotmart products
3. Go to Offers
4. Select a product
5. Generate a custom AI image
6. Add product notes
7. Close modal

**Expected Result:**
- ✅ Product has professional AI-generated image
- ✅ Notes saved for future reference
- ✅ Ready to create campaigns

#### Test 5.2: Multiple Products

1. Open 3 different products
2. Generate different AI images for each
3. Verify all images persist

**Expected Result:**
- ✅ Each product has unique image
- ✅ No conflicts or overwrites

## Performance Testing

### Test 6.1: Large Product Sync

1. Sync 500+ products from Hotmart
2. Monitor backend logs
3. Check memory usage

**Expected Result:**
- ✅ Sync completes without crashes
- ✅ Images generated for all products
- ✅ Database handles large insert volume

### Test 6.2: Image Generation Speed

1. Generate 10 AI images in a row
2. Measure time for each

**Expected Result:**
- ✅ Each takes 5-10 seconds
- ✅ No rate limiting errors from OpenAI
- ✅ All images display correctly

## Error Handling Testing

### Test 7.1: Network Errors

1. Disconnect internet
2. Try to sync products

**Expected Result:**
- ✅ Error message: "Failed to connect to Hotmart"
- ✅ No crash
- ✅ Can retry after reconnecting

### Test 7.2: Invalid API Keys

1. Change Hotmart credentials to invalid values
2. Try to connect

**Expected Result:**
- ✅ Error message: "Invalid credentials"
- ✅ Status remains "disconnected"

### Test 7.3: OpenAI Rate Limits

1. Generate 20 images rapidly

**Expected Result:**
- ✅ Graceful handling if rate limited
- ✅ Error message shown to user
- ✅ Can retry after waiting

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

## Mobile Responsiveness

1. Open on mobile device or use Chrome DevTools
2. Test all features

**Expected Result:**
- ✅ Cards stack vertically
- ✅ Modal is scrollable
- ✅ Buttons are touch-friendly
- ✅ Images scale correctly

## Security Testing

### Test 9.1: Authentication Required

1. Logout
2. Try to access `http://localhost:3000/offers` directly

**Expected Result:**
- ✅ Redirect to login page

### Test 9.2: JWT Expiration

1. Login
2. Wait 7 days (or manually expire token)
3. Try to access protected route

**Expected Result:**
- ✅ Redirect to login
- ✅ Message: "Session expired"

## Troubleshooting

### Issue: "Failed to load products"

**Solution:**
1. Check backend is running: `curl http://localhost:5000/api/products`
2. Check database connection
3. Check JWT token in localStorage

### Issue: "Image generation failed"

**Solution:**
1. Verify OpenAI API key is valid
2. Check OpenAI account has credits
3. Check backend logs for specific error

### Issue: "Upload failed"

**Solution:**
1. Check file size (< 5MB)
2. Check file format (JPG, PNG, WebP only)
3. Check backend has write permissions for uploads directory

### Issue: Modal doesn't open

**Solution:**
1. Check browser console for errors
2. Verify ImageManagerModal component is imported
3. Check z-index conflicts with other modals

## Success Criteria

✅ All authentication flows work
✅ Hotmart connection and sync successful
✅ Products display with AI-generated images
✅ Image Manager Modal opens and closes
✅ Upload custom images works
✅ AI image generation works
✅ Image history displays correctly
✅ Product notes save and load
✅ No console errors
✅ No memory leaks
✅ Mobile responsive
✅ Fast performance (< 3s page loads)

## Next Steps After Testing

Once all tests pass:

1. **Deploy to staging:**
   - Deploy backend to your server
   - Deploy frontend to Vercel
   - Test in staging environment

2. **Get real Hotmart account:**
   - Apply for Hotmart affiliate account
   - Get approved by some programs
   - Sync real products

3. **Build remaining features:**
   - Campaign management
   - Email marketing integration
   - Landing page generation
   - Analytics dashboard

## Support

If you encounter issues during testing:

1. Check backend logs: `tail -f backend/logs/app.log`
2. Check browser console for frontend errors
3. Review this guide's troubleshooting section
4. Check the API documentation in each integration guide

---

**Happy Testing! 🚀**

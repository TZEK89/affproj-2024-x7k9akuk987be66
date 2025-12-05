# Phase 1 Setup Guide: Authentication & Basic Functionality

This guide will help you set up and test the authentication system we just built.

## What We've Built

✅ **Backend Authentication System:**
- JWT-based authentication
- Secure password hashing with bcrypt
- Login and registration endpoints
- Auth middleware for protecting routes
- Users table migration

✅ **Frontend Authentication Pages:**
- Professional login page
- Registration page
- Auth context for state management
- API client with automatic token handling

---

## Setup Instructions

### Step 1: Set Up Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set:
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your-secret-key-here-make-it-long-and-random
PORT=3000
NODE_ENV=development
```

**Frontend (.env.local):**
```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` and set:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 2: Create the Users Table

Run the migration to create the users table in your database:

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run the migration
\i database/migrations/001_create_users_table.sql

# Verify the table was created
\dt users
\d users

# Exit psql
\q
```

### Step 3: Start the Backend Server

```bash
cd backend
npm install  # If you haven't already
npm run dev  # or: node server.js
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 3000
```

### Step 4: Start the Frontend

```bash
cd frontend
npm install  # If you haven't already
npm run dev
```

The frontend should start on `http://localhost:3001`

---

## Testing the Authentication System

### Test 1: Register a New User

1. Open your browser to `http://localhost:3001/register`
2. Fill in the registration form:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
3. Click "Sign up"
4. You should be redirected to the dashboard (`/`)

### Test 2: Logout and Login

1. Open browser console and run:
   ```javascript
   localStorage.clear()
   window.location.reload()
   ```
2. You should be redirected to `/login`
3. Login with:
   - Email: test@example.com
   - Password: password123
4. You should be redirected back to the dashboard

### Test 3: API Authentication

Test the protected endpoints using curl:

```bash
# Try to access a protected endpoint without auth (should fail)
curl http://localhost:3000/api/products

# Register a user and get a token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "password123",
    "name": "API Test User"
  }'

# Copy the token from the response, then use it:
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## What's Next

Now that authentication is working, we can move to **Phase 1, Task 2: Connect Frontend to Backend**.

This will involve:
1. Updating the dashboard pages to fetch real data from the API
2. Creating proper data fetching hooks
3. Adding loading states and error handling

Are you ready to continue?

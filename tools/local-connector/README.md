# Local Connector - Affiliate Marketing System

**A CLI tool to authenticate to affiliate platforms on your local machine and upload sessions to the backend.**

---

## Why Local Connector?

The backend is deployed on Railway (headless environment). You cannot complete 2FA or CAPTCHA on Railway. This tool solves that problem:

1. **Run Playwright headed on your machine** - You see the browser and complete login
2. **Upload session to backend** - Backend stores encrypted session in Supabase
3. **Backend scrapes headlessly** - Uses your saved session, no login needed

---

## Installation

```bash
cd tools/local-connector
npm install
```

---

## Usage

### Option 1: Interactive Mode (Recommended)

```bash
npm run connect
```

This will:
1. Ask you to select a platform (Hotmart, ClickBank, ShareASale)
2. Request a connect token from your backend
3. Launch a browser window
4. Wait for you to log in (including 2FA)
5. Extract and upload your session
6. Close the browser

### Option 2: Direct Command

```bash
node connector.js
```

### Option 3: With Custom API URL

```bash
node connector.js https://your-backend.up.railway.app/api
```

Or set environment variable:

```bash
export API_URL=https://your-backend.up.railway.app/api
npm run connect
```

---

## Supported Platforms

- ✅ **Hotmart** - Digital products marketplace
- ✅ **ClickBank** - Affiliate network
- ✅ **ShareASale** - Affiliate network

More platforms can be added by editing `PLATFORMS` in `connector.js`.

---

## How It Works

### Step 1: Request Token

The tool requests a short-lived `connectToken` from your backend:

```
POST /api/local-connect/:platform/token
```

This token expires in 10 minutes.

### Step 2: Launch Browser

A **headed** (visible) Chromium browser launches and navigates to the platform's login page.

### Step 3: You Log In

You complete the login process manually:
- Enter username/password
- Complete 2FA if required
- Wait until you see the dashboard

### Step 4: Extract Session

The tool extracts `storageState` from Playwright, which includes:
- Cookies
- LocalStorage
- SessionStorage

### Step 5: Upload Session

The tool uploads the `storageState` to your backend:

```
POST /api/local-connect/:platform/upload
{
  "connectToken": "...",
  "storageState": { ... }
}
```

The backend:
- Validates the token
- Encrypts the session (AES-256-GCM)
- Stores it in Supabase
- Returns success

### Step 6: Backend Scrapes

Your backend can now scrape the platform headlessly:

```
POST /api/scraper/:platform/scrape
```

The scraper:
- Loads your saved session from Supabase
- Launches headless browser with session
- Scrapes marketplace
- Saves products to database

**No login required!**

---

## Troubleshooting

### Error: "Could not connect to backend"

**Solution:** Make sure your backend is running and accessible. Check the API URL:

```bash
export API_URL=https://your-backend.up.railway.app/api
npm run connect
```

### Error: "Login validation failed"

**Solution:** Make sure you are fully logged in and on the dashboard page before clicking "Yes" in the prompt.

### Error: "Invalid or expired connect token"

**Solution:** The token expires in 10 minutes. If you take too long to log in, request a new token by running the tool again.

### Browser doesn't launch

**Solution:** Install Playwright browsers:

```bash
npx playwright install chromium
```

---

## Security Notes

- **Your credentials never leave your machine** - You type them directly in the browser
- **Sessions are encrypted** - AES-256-GCM encryption before storage
- **Tokens expire quickly** - Connect tokens are valid for 10 minutes only
- **Sessions expire** - Saved sessions expire after 30 days (configurable)

---

## Development

### Add a New Platform

Edit `connector.js` and add to the `PLATFORMS` object:

```javascript
myplatform: {
  name: 'My Platform',
  loginUrl: 'https://myplatform.com/login',
  dashboardUrl: 'https://myplatform.com/dashboard',
  loginSelector: 'input[name="email"]',
  dashboardSelector: '.dashboard'
}
```

### Test Locally

```bash
# Start your backend locally
cd backend
npm run dev

# In another terminal, run the connector
cd tools/local-connector
export API_URL=http://localhost:5000/api
npm run connect
```

---

## License

MIT

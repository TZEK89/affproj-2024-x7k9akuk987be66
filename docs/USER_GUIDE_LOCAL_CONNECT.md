# User Guide: Local Connect

**Connect to affiliate platforms like Hotmart, ClickBank, and ShareASale with full support for 2FA and CAPTCHA.**

---

## The Problem

Our backend runs on Railway, a headless environment. You cannot complete a graphical login with 2FA on Railway. This tool solves that problem by letting you log in on your own machine, then securely uploading the session to the backend.

---

## How It Works

1. **You run a simple command** in your terminal.
2. **A browser window opens** on your computer.
3. **You log in** to the affiliate platform (e.g., Hotmart).
4. **The tool saves your session** (cookies, etc.) and uploads it to our backend.
5. **The backend can now scrape** that platform for you, headlessly, until the session expires.

---

## Requirements

- Node.js and npm installed on your computer
- The project codebase downloaded from GitHub

---

## One-Time Setup

1. **Open your terminal** or command prompt.
2. **Navigate to the project folder:**
   ```bash
   cd /path/to/affiliate-marketing-system
   ```
3. **Navigate to the local connector tool:**
   ```bash
   cd tools/local-connector
   ```
4. **Install dependencies:**
   ```bash
   npm install
   ```

---

## How to Connect (Example: Hotmart)

### Step 1: Run the Connector

In your terminal (inside `tools/local-connector`), run:

```bash
npm run connect
```

### Step 2: Select Platform

The tool will ask you to select a platform. Use the arrow keys to select **Hotmart** and press Enter.

```
🚀 Affiliate Marketing System - Local Connector

? Select the platform to connect: › - Use arrow-keys. Return to submit.
❯   Hotmart
    ClickBank
    ShareASale
```

### Step 3: Log In

A new browser window will open and navigate to the Hotmart login page.

- **Log in as you normally would.**
- **Complete 2FA** if prompted.
- **Wait until you see the main Hotmart dashboard.**

### Step 4: Confirm Login

Go back to your terminal. It will be waiting for your confirmation:

```
⚠️  Please complete the login process in the browser window.
   - Enter your credentials
   - Complete 2FA if required
   - Wait until you see the dashboard

? Have you completed the login? › (Y/n)
```

Press **Enter** to confirm.

### Step 5: Success!

The tool will validate your login, extract the session, upload it, and show a success message:

```
✔ Validating login... › Login validated successfully
✔ Extracting session data... › Extracted session data (15 cookies)
✔ Uploading session to backend... › Session uploaded successfully

✅ Successfully connected to Hotmart!

   Platform: hotmart
   Cookies: 15
   Expires: 1/17/2026, 3:45:00 PM

Your backend can now scrape this platform headlessly without login!
```

**That's it!** The connection is complete.

---

## What Happens Next?

- **The integration page will update** to show a "Connected" status for Hotmart, along with the number of cookies and session expiry date.
- **You can now trigger scraping runs** from the dashboard (coming soon) or via the API.
- **The backend will use your saved session** to scrape Hotmart headlessly.

---

## Reconnecting

Sessions typically last for 30 days. When a session expires:

- The integration status will change to **"Needs Reconnect"**.
- Simply run the local connector tool again to get a fresh session.

---

## Troubleshooting

### Error: "Could not connect to backend"

**Solution:** Make sure your backend is running and accessible. If you are running the backend locally, you may need to set the API URL:

```bash
export API_URL=http://localhost:5000/api
npm run connect
```

### Error: "Login validation failed"

**Solution:** Make sure you are fully logged in and on the main dashboard page before confirming in the terminal.

### Browser doesn't launch

**Solution:** The tool uses Playwright. You may need to install the browser dependencies manually:

```bash
cd tools/local-connector
npx playwright install chromium
```

---

This process provides a secure and reliable way to connect to any affiliate platform, giving our system the access it needs to automate your offer intelligence.

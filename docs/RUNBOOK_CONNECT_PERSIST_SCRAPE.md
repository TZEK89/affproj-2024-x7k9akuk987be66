# Runbook: Connect + Persist + Scrape System

**Objective:** To provide clear instructions for deploying, testing, and troubleshooting the new human-in-the-loop authentication and persistent scraping system.

---

## 1. Deployment

### 1.1. Backend (Railway)

**Environment Variables:**

Ensure the following environment variable is set in your Railway service:

-   `SESSION_ENCRYPTION_KEY`: A 64-character hex string for encrypting session data. You can generate one with:
    ```bash
    node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"
    ```

**Database Migration:**

The new `integration_sessions` table needs to be created. If your Railway deployment is connected to your GitHub repository, this should happen automatically when you merge the changes. If not, you will need to run the migration manually:

```sql
-- Paste the contents of backend/database/migrations/015_create_integration_sessions_table.sql
```

**Chromium on Railway:**

Playwright requires additional system dependencies to run Chromium. Add the following to your `nixpacks.toml` file or your Railway service's Nixpacks configuration:

```toml
[phases.setup]
aptPkgs = ["libnss3", "libnspr4", "libdbus-1-3", "libatk1.0-0", "libatk-bridge2.0-0", "libcups2", "libdrm2", "libxkbcommon0", "libxcomposite1", "libxdamage1", "libxfixes3", "libxrandr2", "libgbm1", "libxshmfence1", "libasound2"]
```

### 1.2. Frontend (Railway)

**Environment Variables:**

Ensure the `NEXT_PUBLIC_API_URL` is correctly pointing to your backend service URL.

-   `NEXT_PUBLIC_API_URL`: `https://your-backend-service-name.up.railway.app/api`

---

## 2. Testing the Flow

### Step 1: Open the Integrations Page

Navigate to `https://your-frontend-service-name.up.railway.app/integrations`.

### Step 2: Start the Connection

-   Click the "Connect" button on the Hotmart integration card.
-   A modal window titled "Connect to Hotmart" should appear.
-   Simultaneously, a **headed (visible) Chromium browser window** should open on the server. Since this is running on Railway, you won't see it, but it is running.

### Step 3: Complete the Login (Human-in-the-Loop)

-   The modal will show instructions: "A browser window has opened... Complete the login process...".
-   The backend is now waiting. You need to manually log into your Hotmart account in your **local browser**.
-   **This is the human-in-the-loop part.** The system is waiting for you to create a valid session.

### Step 4: Complete the Connection

-   Once you are logged into Hotmart in your local browser, go back to the modal in the integrations page.
-   The modal should show "✅ Login detected!".
-   Click the **"I Finished Login"** button.

### Step 5: Verify Success

-   The modal will show "Verifying login and saving session...".
-   Then, "✅ Connection successful! Session saved.".
-   The modal will close, and the Hotmart integration card will now show a "Connected" status.

### Step 6: Test the Scraper

-   Create a new button or trigger for scraping (or use a direct API call for now).
-   Call `POST /api/scraper/hotmart/scrape`.
-   **Expected Result:** The backend will now launch a **headless** browser, load your saved session, and start scraping the marketplace without requiring any login.

---

## 3. Troubleshooting

### Problem: Modal shows "Login not detected"

-   **Cause:** You haven't logged into Hotmart yet, or the login check pattern failed.
-   **Solution:** Make sure you are fully logged in and on the Hotmart dashboard or marketplace page. Try again.

### Problem: Headed browser does not launch on Railway

-   **Cause:** Missing system dependencies for Chromium.
-   **Solution:** Ensure you have added the `aptPkgs` to your Nixpacks configuration as described in section 1.1.

### Problem: Scraping fails with `needsReconnect: true`

-   **Cause:** The saved session has expired or was invalidated by Hotmart.
-   **Solution:** This is expected behavior. The UI should prompt you to reconnect. Go through the connect flow again to get a fresh session.

### Problem: Encryption/Decryption errors

-   **Cause:** The `SESSION_ENCRYPTION_KEY` is missing, invalid, or different between services if you are running multiple instances.
-   **Solution:** Ensure the key is a 64-character hex string and is identical across all backend instances.

---

This system provides a robust way to handle authentication for any platform that requires a login, including those with 2FA, by leveraging a one-time human-in-the-loop step to establish a persistent, persistent, and reusable session.

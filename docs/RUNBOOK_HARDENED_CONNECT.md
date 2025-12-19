# Runbook: Hardened Local Connect Verification

This runbook details how to verify the hardened Local Connect system, including deterministic login checks, session fingerprinting, and hard evidence collection.

---

## 🎯 Objective

Verify that the system is:
- **Deterministic:** No false positives for connection status.
- **Resilient:** Recovers gracefully from session invalidation.
- **Debuggable:** Provides hard evidence on failure.
- **Scalable:** Ready to support multiple platforms.

---

## 📋 Verification Steps

### Step 1: Verify Local Connect (Success Path)

1.  **Run the local connector:**
    ```bash
    cd tools/local-connector
    npm install
    export API_URL=https://your-backend.railway.app/api
    npm run connect-v2
    ```

2.  **Select Hotmart** and log in when the browser opens.

3.  **Confirm login** by pressing Enter in the terminal.

4.  **Expected Output:**
    -   ✅ `Login verified successfully`
    -   ✅ `Fingerprint captured`
    -   ✅ `Session uploaded successfully`
    -   ✅ `Connection successful!` with cookie count and expiry date.

5.  **Check Supabase:**
    -   Go to the `integration_sessions` table.
    -   Verify the row for `{user_id, hotmart}` has:
        -   `status` = `active`
        -   `encrypted_session` is not null.
        -   `fingerprint` JSONB is populated with `userAgent`, `locale`, `timezone`.
        -   `cookie_count` > 0.

### Step 2: Verify Headless Scraping (Success Path)

1.  **Trigger a scrape:**
    ```bash
    curl -X POST https://your-backend.railway.app/api/hardened-scraper/hotmart/scrape
    ```

2.  **Check Backend Logs (Railway):**
    -   Look for: `[Hardened Scraper] Starting scrape...`
    -   Look for: `[LocalConnect] Loaded session for hotmart...`
    -   Look for: `[hotmart] Using fingerprint: ...`
    -   Look for: `[hotmart] Login verified successfully`
    -   Look for: `[Hardened Scraper] Scrape complete: X products saved`

3.  **Check Supabase:**
    -   Go to the `products` table.
    -   Verify that new products have been added or updated.

### Step 3: Verify Session Invalidation (Failure Path)

1.  **Manually invalidate the session:**
    -   Go to Hotmart in your regular browser and log out.
    -   Or, go to "Active Sessions" and revoke the session.

2.  **Trigger a scrape again:**
    ```bash
    curl -X POST https://your-backend.railway.app/api/hardened-scraper/hotmart/scrape
    ```

3.  **Expected API Response (401 Unauthorized):**
    ```json
    {
      "success": false,
      "needsReconnect": true,
      "platform": "hotmart",
      "reason": "SELECTOR_NOT_FOUND",
      "message": "Session expired or invalid. Please reconnect...",
      "evidence": {
        "timestamp": "...",
        "currentUrl": "https://app-vlc.hotmart.com/login",
        "cookieCount": 5,
        "hasScreenshot": true
      }
    }
    ```

4.  **Check Supabase:**
    -   Go to the `integration_sessions` table.
    -   Verify the row for `{user_id, hotmart}` has:
        -   `status` = `needs_reconnect`
        -   `last_error` = `SELECTOR_NOT_FOUND` or `URL_CHECK_FAILED`.
        -   `meta` field contains the `evidence` object.

5.  **Check Frontend:**
    -   Refresh the integrations dashboard.
    -   Verify the Hotmart card shows a **"Reconnect Needed"** warning with the exact command to run.

### Step 4: Verify Reconnect Flow

1.  **Run the local connector again** as in Step 1.

2.  **Log in and confirm.**

3.  **Check Supabase:**
    -   Verify the row for `{user_id, hotmart}` is now `status` = `active` again.

4.  **Trigger a scrape again** as in Step 2.

5.  **Expected Result:** The scrape should now succeed.

---

## ✅ Success Criteria

-   The system correctly identifies valid and invalid sessions.
-   The backend gracefully handles session expiry and prompts for reconnect.
-   The frontend clearly communicates the need to reconnect.
-   Hard evidence (metadata, screenshots) is collected on failure.
-   The entire loop (connect → scrape → invalidate → reconnect → scrape) works as expected.

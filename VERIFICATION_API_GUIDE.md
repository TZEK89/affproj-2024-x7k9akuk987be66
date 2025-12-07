# 🔐 Hotmart Verification Code API - Usage Guide

**Endpoint**: `POST /api/browser/hotmart/verify`  
**Purpose**: Enter the 6-digit email verification code while browser is waiting  
**Status**: ✅ Ready to deploy

---

## 📋 API Specification

### Endpoint
```
POST /api/browser/hotmart/verify
```

### Request Body
```json
{
  "sessionId": "session-1733519823456-abc123def",
  "code": "912370"
}
```

### Response (Success)
```json
{
  "success": true,
  "message": "Verification code entered",
  "verified": true,
  "url": "https://app.hotmart.com/dashboard"
}
```

### Response (Error - Session Not Found)
```json
{
  "success": false,
  "error": "Session not found"
}
```

### Response (Error - Input Field Not Found)
```json
{
  "success": false,
  "error": "Could not find verification code input field"
}
```

---

## 🎯 How It Works

### Step 1: Start Browser Session
```bash
curl -X POST https://your-railway-backend.railway.app/api/browser/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "hotmart",
    "options": { "headless": true }
  }'
```

**Response**:
```json
{
  "success": true,
  "sessionId": "session-1733519823456-abc123def",
  "message": "Browser session started"
}
```

### Step 2: Login to Hotmart
```bash
curl -X POST https://your-railway-backend.railway.app/api/browser/hotmart/login \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1733519823456-abc123def",
    "email": "ibeautyglamour@gmail.com",
    "password": "your_password"
  }'
```

**Response** (if verification required):
```json
{
  "success": false,
  "error": "Email verification timeout - please complete verification within 120 seconds"
}
```

**OR** the login will pause and wait for verification...

### Step 3: Check Email for Code
1. Open email: `ibeautyglamour@gmail.com`
2. Find email from Hotmart with subject "Two-step verification"
3. Copy the 6-digit code (e.g., `912370`)

### Step 4: Enter Verification Code via API
```bash
curl -X POST https://your-railway-backend.railway.app/api/browser/hotmart/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-1733519823456-abc123def",
    "code": "912370"
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Verification code entered",
  "verified": true,
  "url": "https://app.hotmart.com/dashboard"
}
```

### Step 5: Continue with Mission
The browser session is now logged in and cookies are saved. Subsequent logins will skip verification!

---

## 🧪 Testing Flow

### Test 1: Manual Verification via API

1. **Start session**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/browser/session/start \
  -H "Content-Type: application/json" \
  -d '{"platform": "hotmart"}' | jq -r '.sessionId')

echo "Session ID: $SESSION_ID"
```

2. **Login** (this will trigger verification):
```bash
curl -X POST http://localhost:3001/api/browser/hotmart/login \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"email\": \"ibeautyglamour@gmail.com\",
    \"password\": \"your_password\"
  }"
```

3. **Check email** and get the 6-digit code

4. **Enter code**:
```bash
curl -X POST http://localhost:3001/api/browser/hotmart/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"code\": \"912370\"
  }"
```

5. **Verify success**:
```bash
curl -X GET http://localhost:3001/api/browser/session/status \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\"}"
```

---

## 🔧 Implementation Details

### Input Field Detection

The endpoint tries multiple strategies to find the verification code input:

1. **Single input field** (most common):
   - Selectors: `input[type="text"]`, `input[type="number"]`, `input[maxlength="6"]`
   - Fills the entire 6-digit code at once

2. **Individual digit inputs** (6 separate fields):
   - Selector: `input[maxlength="1"]`
   - Fills each digit separately (code[0], code[1], ..., code[5])

### Button Detection

After entering the code, the endpoint clicks the submit button:

- Selectors tried:
  - `button:has-text("Verification & Login")`
  - `button:has-text("Verify")`
  - `button:has-text("Continue")`
  - `button:has-text("Submit")`

### Verification Check

After submission, the endpoint waits 5 seconds and checks the URL:
- If URL no longer contains "verification" or "verify" → Success
- If still on verification page → May need retry

---

## 🎨 Frontend Integration

### React Component Example

```typescript
// components/VerificationCodeModal.tsx
import { useState } from 'react';

interface Props {
  sessionId: string;
  onSuccess: () => void;
}

export function VerificationCodeModal({ sessionId, onSuccess }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/browser/hotmart/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code })
      });

      const data = await response.json();

      if (data.success && data.verified) {
        onSuccess();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <h2>Email Verification Required</h2>
      <p>Check your email for the 6-digit code</p>
      
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Enter 6-digit code"
        maxLength={6}
      />
      
      <button onClick={handleSubmit} disabled={loading || code.length !== 6}>
        {loading ? 'Verifying...' : 'Verify'}
      </button>
      
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Usage in Mission Detail Page

```typescript
// pages/missions/[id].tsx
const [showVerificationModal, setShowVerificationModal] = useState(false);
const [sessionId, setSessionId] = useState('');

// Detect verification requirement from mission logs
useEffect(() => {
  const lastLog = mission.logs[mission.logs.length - 1];
  if (lastLog?.message.includes('EMAIL VERIFICATION REQUIRED')) {
    setShowVerificationModal(true);
    // Extract session ID from logs or mission metadata
    setSessionId(mission.sessionId);
  }
}, [mission.logs]);

return (
  <div>
    {/* Mission details */}
    
    {showVerificationModal && (
      <VerificationCodeModal
        sessionId={sessionId}
        onSuccess={() => {
          setShowVerificationModal(false);
          // Refresh mission status
        }}
      />
    )}
  </div>
);
```

---

## 🚀 Deployment Checklist

- [x] Add endpoint to `backend/routes/browserController.js`
- [ ] Test endpoint locally
- [ ] Commit and push to GitHub
- [ ] Verify Railway deployment
- [ ] Test end-to-end with real Hotmart login
- [ ] Add frontend modal for code entry
- [ ] Update mission detail page to detect verification requirement

---

## 📊 Expected Behavior

### Scenario 1: First Login (No Cookies)
```
1. POST /api/browser/session/start → sessionId
2. POST /api/browser/hotmart/login → Waits for verification
3. User checks email → Gets code "912370"
4. POST /api/browser/hotmart/verify → Code entered
5. Login completes → Cookies saved
```

### Scenario 2: Subsequent Logins (With Cookies)
```
1. POST /api/browser/session/start → sessionId
2. POST /api/browser/hotmart/login → Cookies loaded
3. Login completes immediately → No verification needed!
```

---

## 🔒 Security Considerations

1. **Session Validation**: Always validate sessionId exists before entering code
2. **Code Validation**: Ensure code is exactly 6 digits
3. **Rate Limiting**: Consider adding rate limits to prevent brute force
4. **Session Timeout**: Sessions auto-expire after 30 minutes of inactivity
5. **HTTPS Only**: Always use HTTPS in production to protect verification codes

---

## 🐛 Troubleshooting

### Issue: "Session not found"
**Cause**: Session expired or invalid sessionId  
**Solution**: Start a new session with `/api/browser/session/start`

### Issue: "Could not find verification code input field"
**Cause**: Page structure changed or not on verification page  
**Solution**: Check current URL, may need to retry login

### Issue: Code entered but verification fails
**Cause**: Code expired or incorrect  
**Solution**: Request new code from Hotmart and retry

### Issue: Button not found warning
**Cause**: Submit button selector doesn't match  
**Solution**: Code is entered, may auto-submit or need manual click

---

## 📝 Example: Complete First Login Flow

```bash
#!/bin/bash

# Step 1: Start session
echo "Starting browser session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3001/api/browser/session/start \
  -H "Content-Type: application/json" \
  -d '{"platform": "hotmart"}')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.sessionId')
echo "Session ID: $SESSION_ID"

# Step 2: Login
echo "Logging in to Hotmart..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/browser/hotmart/login \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"email\": \"ibeautyglamour@gmail.com\",
    \"password\": \"your_password\"
  }")

echo "Login response: $LOGIN_RESPONSE"

# Step 3: Wait for user to provide code
echo "⚠️  Check your email for the verification code!"
read -p "Enter the 6-digit code: " CODE

# Step 4: Enter verification code
echo "Entering verification code..."
VERIFY_RESPONSE=$(curl -s -X POST http://localhost:3001/api/browser/hotmart/verify \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"code\": \"$CODE\"
  }")

echo "Verification response: $VERIFY_RESPONSE"

# Step 5: Check if verified
IS_VERIFIED=$(echo $VERIFY_RESPONSE | jq -r '.verified')
if [ "$IS_VERIFIED" = "true" ]; then
  echo "✅ Login successful! Cookies saved."
else
  echo "❌ Verification failed. Please try again."
fi
```

---

**🎉 With this API, users can now enter verification codes while the headless browser waits!**

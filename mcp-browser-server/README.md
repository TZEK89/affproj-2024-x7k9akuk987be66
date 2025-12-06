# Affiliate Browser MCP Server

This MCP server allows Claude (in Claude Desktop) to directly control browser automation for affiliate marketplace research.

## How It Works

```
Claude Desktop (you chat with me)
    ↓
MCP Server (runs on your computer)
    ↓
Railway Backend (runs Playwright browser)
    ↓
Hotmart Marketplace (real browser automation)
    ↓
Results back to Claude
```

## Setup Instructions

### Step 1: Create a folder for the MCP server

```bash
mkdir ~/affiliate-browser-mcp
cd ~/affiliate-browser-mcp
```

### Step 2: Create the files

Save these files to the folder:

**package.json:**
```json
{
  "name": "affiliate-browser-mcp",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0",
    "node-fetch": "^2.7.0"
  }
}
```

**index.js:** (Copy from index.js in this folder)

### Step 3: Install dependencies

```bash
cd ~/affiliate-browser-mcp
npm install
```

### Step 4: Get your Auth Token

You need to login to get an auth token:

```bash
curl -X POST https://affiliate-backend-production-df21.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

Copy the token from the response.

### Step 5: Configure Claude Desktop

Open your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration (merge with existing if you have other MCP servers):

```json
{
  "mcpServers": {
    "affiliate-browser": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/affiliate-browser-mcp/index.js"],
      "env": {
        "AFFILIATE_BACKEND_URL": "https://affiliate-backend-production-df21.up.railway.app",
        "AFFILIATE_AUTH_TOKEN": "YOUR_TOKEN_FROM_STEP_4",
        "HOTMART_EMAIL": "ibeautyglamour@gmail.com",
        "HOTMART_PASSWORD": "Hekay(*)1903"
      }
    }
  }
}
```

**Important:** Replace `/Users/YOUR_USERNAME/` with your actual path!

### Step 6: Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

## Available Tools

Once set up, Claude can use these tools:

| Tool | Description |
|------|-------------|
| `start_browser_session` | Start a new browser session |
| `hotmart_login` | Login to Hotmart |
| `hotmart_search` | Search the marketplace |
| `hotmart_extract_products` | Extract products from results |
| `hotmart_get_details` | Get detailed product info |
| `hotmart_research_niche` | Complete niche research in one call |
| `take_screenshot` | Capture current page |
| `end_browser_session` | Close the browser |

## Example Conversation

After setup, you can say:

> "Research the weight loss niche on Hotmart and find me the top 5 products with high commissions"

Claude will:
1. Start a browser session
2. Login to Hotmart
3. Search for weight loss products
4. Extract and analyze the results
5. Recommend the best products

## Troubleshooting

### "MCP server not found"
- Check the path in claude_desktop_config.json is correct
- Make sure you ran `npm install`

### "Authentication failed"
- Get a fresh auth token from Step 4
- Update the AFFILIATE_AUTH_TOKEN in config

### "Browser automation not available"
- The Railway backend might be redeploying
- Wait a minute and try again

## Security Note

Your Hotmart credentials are stored in the config file. Keep this file secure and don't share it.

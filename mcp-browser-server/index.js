#!/usr/bin/env node

/**
 * Affiliate Browser MCP Server
 * 
 * This MCP server allows Claude (in Claude Desktop) to directly control
 * browser automation for affiliate marketplace research.
 * 
 * It connects to the Railway backend which runs Playwright for actual
 * browser control.
 * 
 * Tools provided:
 * - start_browser_session: Start a new browser session
 * - hotmart_login: Login to Hotmart
 * - hotmart_search: Search the marketplace
 * - hotmart_extract_products: Extract products from current page
 * - hotmart_get_details: Get detailed product info
 * - take_screenshot: Capture current page
 * - end_browser_session: Close the browser
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const fetch = require("node-fetch");

// Configuration - Railway backend URL
const BACKEND_URL = process.env.AFFILIATE_BACKEND_URL || "https://affiliate-backend-production-df21.up.railway.app";
const AUTH_TOKEN = process.env.AFFILIATE_AUTH_TOKEN || "";

// Store active session
let currentSessionId = null;

/**
 * Make API call to backend
 */
async function callBackend(endpoint, method = "POST", body = null) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${AUTH_TOKEN}`;
  }
  
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Define the tools
const TOOLS = [
  {
    name: "start_browser_session",
    description: "Start a new browser session for marketplace research. Must be called before any other browser operation. Returns a sessionId that must be used for subsequent calls.",
    inputSchema: {
      type: "object",
      properties: {
        platform: {
          type: "string",
          enum: ["hotmart"],
          description: "The affiliate platform to research (currently only Hotmart supported)"
        }
      },
      required: ["platform"]
    }
  },
  {
    name: "hotmart_login",
    description: "Login to Hotmart using stored credentials (set in environment variables). Must have an active session.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID from start_browser_session"
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "hotmart_search",
    description: "Search the Hotmart marketplace for products matching keywords. Must be logged in first.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        },
        keywords: {
          type: "string",
          description: "Search keywords (e.g., 'weight loss', 'keto diet', 'fitness')"
        },
        language: {
          type: "string",
          enum: ["pt", "en", "es"],
          description: "Filter by product language (optional)"
        },
        sortBy: {
          type: "string",
          enum: ["best_sellers", "newest", "highest_commission"],
          description: "How to sort results (optional)"
        }
      },
      required: ["sessionId", "keywords"]
    }
  },
  {
    name: "hotmart_extract_products",
    description: "Extract product information from the current search results page. Call this after searching to see the products.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        },
        maxProducts: {
          type: "number",
          description: "Maximum number of products to extract (1-20)",
          default: 10
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "hotmart_get_details",
    description: "Get detailed information about a specific product by visiting its page.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        },
        productUrl: {
          type: "string",
          description: "The URL of the product to get details for"
        }
      },
      required: ["sessionId", "productUrl"]
    }
  },
  {
    name: "hotmart_research_niche",
    description: "Perform complete niche research in one call. Combines login, search, and extraction. Use this for quick research.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        },
        niche: {
          type: "string",
          description: "The niche to research (e.g., 'weight loss', 'keto', 'fitness')"
        },
        maxProducts: {
          type: "number",
          description: "Maximum products to find",
          default: 10
        },
        language: {
          type: "string",
          enum: ["pt", "en", "es"],
          description: "Filter by language (optional)"
        }
      },
      required: ["sessionId", "niche"]
    }
  },
  {
    name: "take_screenshot",
    description: "Take a screenshot of the current browser page. Useful for debugging or seeing what the page looks like.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID"
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "end_browser_session",
    description: "Close the browser session. Always call this when done with research to free up resources.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID to close"
        }
      },
      required: ["sessionId"]
    }
  },
  {
    name: "list_browser_sessions",
    description: "List all active browser sessions.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

/**
 * Execute a tool
 */
async function executeTool(name, args) {
  switch (name) {
    case "start_browser_session": {
      const result = await callBackend("/api/browser/session/start", "POST", {
        platform: args.platform || "hotmart"
      });
      if (result.success && result.sessionId) {
        currentSessionId = result.sessionId;
      }
      return result;
    }
    
    case "hotmart_login": {
      // Use environment credentials
      const result = await callBackend("/api/browser/hotmart/login", "POST", {
        sessionId: args.sessionId,
        email: process.env.HOTMART_EMAIL,
        password: process.env.HOTMART_PASSWORD
      });
      return result;
    }
    
    case "hotmart_search": {
      return await callBackend("/api/browser/hotmart/search", "POST", {
        sessionId: args.sessionId,
        keywords: args.keywords,
        filters: {
          language: args.language,
          sortBy: args.sortBy
        }
      });
    }
    
    case "hotmart_extract_products": {
      return await callBackend("/api/browser/hotmart/extract", "POST", {
        sessionId: args.sessionId,
        maxProducts: args.maxProducts || 10
      });
    }
    
    case "hotmart_get_details": {
      return await callBackend("/api/browser/hotmart/details", "POST", {
        sessionId: args.sessionId,
        productUrl: args.productUrl
      });
    }
    
    case "hotmart_research_niche": {
      return await callBackend("/api/browser/hotmart/research", "POST", {
        sessionId: args.sessionId,
        niche: args.niche,
        options: {
          maxProducts: args.maxProducts || 10,
          language: args.language
        }
      });
    }
    
    case "take_screenshot": {
      return await callBackend("/api/browser/screenshot", "POST", {
        sessionId: args.sessionId
      });
    }
    
    case "end_browser_session": {
      const result = await callBackend("/api/browser/session/end", "POST", {
        sessionId: args.sessionId
      });
      if (args.sessionId === currentSessionId) {
        currentSessionId = null;
      }
      return result;
    }
    
    case "list_browser_sessions": {
      return await callBackend("/api/browser/sessions", "GET");
    }
    
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Create and run the server
async function main() {
  const server = new Server(
    {
      name: "affiliate-browser-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await executeTool(name, args || {});
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: error.message }),
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Affiliate Browser MCP Server running...");
}

main().catch(console.error);

/**
 * Manus Browser Controller
 * 
 * This service is called BY MANUS (not by the backend directly)
 * When user messages "Connect to [platform]", Manus calls these functions
 * to control the browser, take screenshots, and capture sessions.
 */

const crypto = require('crypto');

class ManusBrowserController {
  constructor() {
    this.activeSessions = new Map();
    this.ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  /**
   * Platform configurations
   */
  getPlatformConfig(platformId) {
    const configs = {
      'hotmart': {
        name: 'Hotmart',
        loginUrl: 'https://app-vlc.hotmart.com/login',
        loginSuccessIndicators: [
          '.user-menu',
          '[data-testid="user-avatar"]',
          'text=Meu perfil'
        ],
        marketplaceUrl: 'https://app-vlc.hotmart.com/market'
      },
      'impact': {
        name: 'Impact.com',
        loginUrl: 'https://app.impact.com/login',
        loginSuccessIndicators: [
          '.header-user-menu',
          '[data-test="user-menu"]'
        ],
        marketplaceUrl: 'https://app.impact.com/advertiser-advertiser-info/list-advertisers.ihtml'
      },
      'cj': {
        name: 'CJ Affiliate',
        loginUrl: 'https://members.cj.com/member/login',
        loginSuccessIndicators: [
          '.user-profile',
          '#userMenu'
        ],
        marketplaceUrl: 'https://members.cj.com/member/publisher/searchAdvertisers.do'
      },
      'shareasale': {
        name: 'ShareASale',
        loginUrl: 'https://account.shareasale.com/a-login.cfm',
        loginSuccessIndicators: [
          '.affiliate-name',
          'text=Logout'
        ],
        marketplaceUrl: 'https://account.shareasale.com/a-merchants.cfm'
      }
    };

    return configs[platformId.toLowerCase()] || null;
  }

  /**
   * Encrypt session data
   */
  encryptSession(sessionData) {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(sessionData), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * Decrypt session data
   */
  decryptSession(encryptedData) {
    const key = Buffer.from(this.ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Instructions for Manus to execute browser connection
   * This is called when user messages "Connect to [platform]"
   */
  getConnectionInstructions(sessionId, platformId) {
    const config = this.getPlatformConfig(platformId);
    
    if (!config) {
      return {
        error: `Unknown platform: ${platformId}`,
        supportedPlatforms: ['hotmart', 'impact', 'cj', 'shareasale']
      };
    }

    return {
      sessionId,
      platform: config.name,
      steps: [
        {
          action: 'navigate',
          url: config.loginUrl,
          description: `Navigate to ${config.name} login page`
        },
        {
          action: 'screenshot',
          description: 'Take screenshot and send to backend'
        },
        {
          action: 'wait_for_user',
          description: 'Wait for user to provide login instructions'
        },
        {
          action: 'execute_commands',
          description: 'Execute user commands (type, click, etc.)'
        },
        {
          action: 'detect_success',
          indicators: config.loginSuccessIndicators,
          description: 'Detect when login is successful'
        },
        {
          action: 'capture_session',
          description: 'Capture cookies and localStorage'
        },
        {
          action: 'verify_access',
          url: config.marketplaceUrl,
          description: 'Verify access to marketplace'
        },
        {
          action: 'encrypt_and_save',
          description: 'Encrypt session and save to database'
        }
      ],
      mcpCommands: {
        navigate: 'manus-mcp-cli tool call browser_navigate --server playwright --input \'{"url": "URL"}\'',
        screenshot: 'manus-mcp-cli tool call browser_screenshot --server playwright',
        click: 'manus-mcp-cli tool call browser_click --server playwright --input \'{"selector": "SELECTOR"}\'',
        type: 'manus-mcp-cli tool call browser_fill --server playwright --input \'{"selector": "SELECTOR", "value": "TEXT"}\'',
        evaluate: 'manus-mcp-cli tool call browser_evaluate --server playwright --input \'{"script": "SCRIPT"}\'',
        getStorageState: 'manus-mcp-cli tool call browser_evaluate --server playwright --input \'{"script": "JSON.stringify({cookies: document.cookie, localStorage: {...localStorage}})"}\''
      }
    };
  }

  /**
   * Helper: Update backend session with screenshot
   */
  getUpdateSessionCommand(sessionId, screenshot, log) {
    return `curl -X PUT ${process.env.BACKEND_URL || 'https://affiliate-backend-production-df21.up.railway.app'}/api/browser-session/${sessionId} \\
  -H "Content-Type: application/json" \\
  -d '{"screenshot": "${screenshot}", "log": "${log}"}'`;
  }

  /**
   * Helper: Complete session with encrypted data
   */
  getCompleteSessionCommand(sessionId, encryptedSession) {
    return `curl -X POST ${process.env.BACKEND_URL || 'https://affiliate-backend-production-df21.up.railway.app'}/api/browser-session/${sessionId}/complete \\
  -H "Content-Type: application/json" \\
  -d '{"success": true, "sessionData": ${JSON.stringify(encryptedSession)}}'`;
  }
}

module.exports = new ManusBrowserController();

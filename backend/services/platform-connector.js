const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const sessionManager = require('./playwright-session-manager');

// Platform configurations with authentication verification selectors
const PLATFORM_CONFIGS = {
  hotmart: {
    id: 'hotmart',
    name: 'Hotmart',
    loginUrl: 'https://sso.hotmart.com/login',
    marketplaceUrl: 'https://app.hotmart.com/market',
    loggedInSelector: '[data-testid="user-menu"]', // Selector that appears when logged in
    loginFormSelector: 'input[type="email"]'
  },
  impact: {
    id: 'impact',
    name: 'Impact.com',
    loginUrl: 'https://app.impact.com/login',
    marketplaceUrl: 'https://app.impact.com/secure/advertiser/marketplace',
    loggedInSelector: '.user-profile',
    loginFormSelector: 'input[name="username"]'
  },
  clickbank: {
    id: 'clickbank',
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    marketplaceUrl: 'https://accounts.clickbank.com/marketplace',
    loggedInSelector: '.account-menu',
    loginFormSelector: 'input[name="username"]'
  },
  cj: {
    id: 'cj',
    name: 'CJ Affiliate',
    loginUrl: 'https://members.cj.com/member/login',
    marketplaceUrl: 'https://members.cj.com/member/publisher/searchAdvertisers.do',
    loggedInSelector: '.user-info',
    loginFormSelector: 'input[name="username"]'
  }
};

class PlatformConnector {
  /**
   * Initiate connection flow - opens browser for manual login
   */
  async initiateConnection(platformId) {
    const config = PLATFORM_CONFIGS[platformId];
    if (!config) {
      throw new Error(`Unknown platform: ${platformId}`);
    }

    try {
      // Install Playwright browser if not already installed
      await this.ensureBrowserInstalled();

      // Open browser and navigate to login page
      const result = await this.openLoginBrowser(platformId, config);

      return {
        success: true,
        platformId,
        message: 'Browser opened for login. Please complete authentication.',
        ...result
      };
    } catch (error) {
      console.error('Error initiating connection:', error);
      throw error;
    }
  }

  /**
   * Ensure Playwright browser is installed
   */
  async ensureBrowserInstalled() {
    try {
      const { stdout, stderr } = await execPromise(
        'manus-mcp-cli tool call browser_install --server playwright --input \'{}\' 2>&1'
      );
      console.log('Browser install result:', stdout);
      return true;
    } catch (error) {
      // Browser might already be installed
      console.log('Browser install check:', error.message);
      return true;
    }
  }

  /**
   * Open Playwright browser for manual login
   */
  async openLoginBrowser(platformId, config) {
    try {
      // Navigate to login page using Playwright MCP
      const navigateCmd = `manus-mcp-cli tool call browser_navigate --server playwright --input '${JSON.stringify({
        url: config.loginUrl
      })}' 2>&1`;

      const { stdout } = await execPromise(navigateCmd);
      console.log('Browser navigation result:', stdout);

      return {
        loginUrl: config.loginUrl,
        instructions: [
          '1. Complete the login process in the opened browser window',
          '2. Complete any 2FA challenges if required',
          '3. Wait for the marketplace page to load',
          '4. The system will automatically capture your session',
          '5. You can close this window once you see "Session Captured" message'
        ]
      };
    } catch (error) {
      console.error('Error opening login browser:', error);
      throw error;
    }
  }

  /**
   * Capture session after successful login
   */
  async captureSession(platformId) {
    const config = PLATFORM_CONFIGS[platformId];
    if (!config) {
      throw new Error(`Unknown platform: ${platformId}`);
    }

    try {
      // Wait for logged-in indicator to appear
      await this.waitForLogin(config);

      // Get session storage state using browser_evaluate
      const sessionState = await this.getSessionState();

      // Save encrypted session
      await sessionManager.saveSession(platformId, sessionState);

      // Verify the session works
      const verified = await this.verifyConnection(platformId);

      if (!verified) {
        throw new Error('Session verification failed');
      }

      return {
        success: true,
        platformId,
        message: 'Session captured and verified successfully'
      };
    } catch (error) {
      console.error('Error capturing session:', error);
      throw error;
    }
  }

  /**
   * Wait for login to complete by checking for logged-in selector
   */
  async waitForLogin(config, maxWaitTime = 300000) { // 5 minutes
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if logged-in selector exists using browser_evaluate
        const checkCmd = `manus-mcp-cli tool call browser_evaluate --server playwright --input '${JSON.stringify({
          function: `() => !!document.querySelector('${config.loggedInSelector}')`
        })}' 2>&1`;

        const { stdout } = await execPromise(checkCmd);
        
        if (stdout.includes('true')) {
          console.log('Login detected!');
          return true;
        }

        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        // Continue waiting
      }
    }

    throw new Error('Login timeout - please try again');
  }

  /**
   * Get session state (cookies, localStorage, sessionStorage)
   */
  async getSessionState() {
    try {
      // Get cookies and storage using browser_evaluate
      const getStateCmd = `manus-mcp-cli tool call browser_evaluate --server playwright --input '${JSON.stringify({
        function: `() => ({
          cookies: document.cookie,
          localStorage: JSON.stringify(localStorage),
          sessionStorage: JSON.stringify(sessionStorage),
          url: window.location.href
        })`
      })}' 2>&1`;

      const { stdout } = await execPromise(getStateCmd);
      
      // Parse the result
      const result = JSON.parse(stdout.match(/\{.*\}/s)[0]);
      
      return result;
    } catch (error) {
      console.error('Error getting session state:', error);
      throw error;
    }
  }

  /**
   * Verify connection by loading marketplace page
   */
  async verifyConnection(platformId) {
    const config = PLATFORM_CONFIGS[platformId];
    if (!config) {
      throw new Error(`Unknown platform: ${platformId}`);
    }

    try {
      // Load session state
      const sessionState = await sessionManager.loadSession(platformId);
      if (!sessionState) {
        return false;
      }

      // Navigate to marketplace URL
      const navigateCmd = `manus-mcp-cli tool call browser_navigate --server playwright --input '${JSON.stringify({
        url: config.marketplaceUrl
      })}' 2>&1`;

      await execPromise(navigateCmd);

      // Wait a bit for page to load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check if logged-in selector exists
      const checkCmd = `manus-mcp-cli tool call browser_evaluate --server playwright --input '${JSON.stringify({
        function: `() => !!document.querySelector('${config.loggedInSelector}')`
      })}' 2>&1`;

      const { stdout } = await execPromise(checkCmd);

      const isLoggedIn = stdout.includes('true');

      if (isLoggedIn) {
        // Update last verified timestamp
        await sessionManager.verifySession(platformId);
      } else {
        // Mark as expired
        await sessionManager.markSessionExpired(platformId);
      }

      return isLoggedIn;
    } catch (error) {
      console.error('Error verifying connection:', error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  async getConnectionStatus(platformId) {
    return await sessionManager.getSessionStatus(platformId);
  }

  /**
   * Disconnect platform
   */
  async disconnect(platformId) {
    return await sessionManager.deleteSession(platformId);
  }
}

module.exports = new PlatformConnector();

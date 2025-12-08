/**
 * Hotmart Login Service
 * Implements initial_actions pattern for reliable, step-by-step authentication
 */

class HotmartLoginService {
  constructor(brightDataService) {
    this.brightData = brightDataService;
    this.sessionCookies = null;
    this.isAuthenticated = false;
  }

  /**
   * Execute a sequence of actions step-by-step
   */
  async executeActionSequence(page, actions, context = {}) {
    const results = [];
    
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      console.log(`[Action ${i + 1}/${actions.length}] ${action.action}: ${action.description || ''}`);
      
      try {
        const result = await this.executeAction(page, action, context);
        results.push({ action: action.action, success: true, result });
        
        // If action returns a control flow directive, handle it
        if (result === 'NEEDS_2FA') {
          return { status: 'NEEDS_2FA', cookies: await page.context().cookies() };
        }
        if (result === 'LOGIN_SUCCESS') {
          return { status: 'SUCCESS', cookies: await page.context().cookies() };
        }
      } catch (error) {
        if (action.optional) {
          console.log(`[Action ${i + 1}] Optional action failed (continuing): ${error.message}`);
          results.push({ action: action.action, success: false, error: error.message, optional: true });
        } else {
          console.error(`[Action ${i + 1}] Failed: ${error.message}`);
          throw error;
        }
      }
      
      // Wait between actions
      if (action.waitAfter) {
        await page.waitForTimeout(action.waitAfter);
      }
    }
    
    return { status: 'COMPLETED', results };
  }

  /**
   * Execute a single action
   */
  async executeAction(page, action, context) {
    switch (action.action) {
      case 'navigate':
        return await this.actionNavigate(page, action);
      
      case 'wait':
        return await this.actionWait(page, action);
      
      case 'click':
        return await this.actionClick(page, action);
      
      case 'fill':
        return await this.actionFill(page, action, context);
      
      case 'detect':
        return await this.actionDetect(page, action);
      
      case 'screenshot':
        return await this.actionScreenshot(page, action);
      
      case 'execute_js':
        return await this.actionExecuteJS(page, action);
      
      default:
        throw new Error(`Unknown action: ${action.action}`);
    }
  }

  /**
   * Action: Navigate to URL
   */
  async actionNavigate(page, action) {
    try {
      await page.goto(action.url, {
        waitUntil: action.waitUntil || 'load',
        timeout: action.timeout || 60000
      });
    } catch (e) {
      console.log(`[Navigate] Warning: ${e.message} (continuing anyway)`);
    }
    return 'navigated';
  }

  /**
   * Action: Wait
   */
  async actionWait(page, action) {
    if (action.condition === 'timeout') {
      await page.waitForTimeout(action.duration || 3000);
    } else if (action.condition === 'navigation') {
      await page.waitForLoadState('networkidle', { timeout: action.timeout || 10000 }).catch(() => {});
    } else if (action.condition === 'element') {
      await page.waitForSelector(action.selector, { timeout: action.timeout || 5000 });
    }
    return 'waited';
  }

  /**
   * Action: Click element
   */
  async actionClick(page, action) {
    const element = await this.findElement(page, action.selectors || [action.selector]);
    
    if (!element) {
      throw new Error(`Element not found: ${JSON.stringify(action.selectors)}`);
    }
    
    if (action.method === 'javascript') {
      await element.evaluate(el => el.click());
    } else {
      await element.click();
    }
    
    return 'clicked';
  }

  /**
   * Action: Fill input field
   */
  async actionFill(page, action, context) {
    const element = await this.findElement(page, action.selectors || [action.selector]);
    
    if (!element) {
      throw new Error(`Input element not found: ${JSON.stringify(action.selectors)}`);
    }
    
    // Resolve sensitive data placeholders
    let value = action.value;
    if (value.startsWith('HOTMART_')) {
      value = process.env[value];
      if (!value) {
        throw new Error(`Environment variable ${action.value} not set`);
      }
    }
    
    // Use JavaScript injection for more reliable filling
    await element.evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    
    return 'filled';
  }

  /**
   * Action: Detect condition
   */
  async actionDetect(page, action) {
    if (action.condition === 'element_exists') {
      const element = await this.findElement(page, action.selectors, { timeout: 3000 });
      return element ? action.onTrue : action.onFalse;
    } else if (action.condition === 'url_contains') {
      const url = page.url();
      return url.includes(action.text) ? action.onTrue : action.onFalse;
    }
    return null;
  }

  /**
   * Action: Take screenshot
   */
  async actionScreenshot(page, action) {
    const screenshot = await page.screenshot({ fullPage: action.fullPage || false });
    return screenshot.toString('base64');
  }

  /**
   * Action: Execute JavaScript
   */
  async actionExecuteJS(page, action) {
    return await page.evaluate(action.code);
  }

  /**
   * Find element using multiple selector strategies
   */
  async findElement(page, selectors, options = {}) {
    const timeout = options.timeout || 5000;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        try {
          // Try CSS selector
          const element = await page.$(selector);
          if (element) {
            return element;
          }
          
          // Try text content matching
          if (selector.includes(':contains(')) {
            const text = selector.match(/:contains\("(.+?)"\)/)?.[1];
            if (text) {
              const elements = await page.$$('button, a, span, div');
              for (const el of elements) {
                const content = await el.textContent();
                if (content && content.toLowerCase().includes(text.toLowerCase())) {
                  return el;
                }
              }
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      await page.waitForTimeout(500);
    }
    
    return null;
  }

  /**
   * Login to Hotmart using initial_actions pattern
   */
  async login(twoFactorCode = null) {
    console.log('[HotmartLogin] Starting login sequence...');
    
    const loginActions = [
      // Step 1: Navigate to login page (SSO)
      {
        action: 'navigate',
        url: 'https://sso.hotmart.com/login?service=https%3A%2F%2Fsso.hotmart.com%2Foauth2.0%2FcallbackAuthorize%3Fclient_id%3De29bbb29-747f-4c23-8f6c-aa0268ca7203%26scope%3Dopenid%2Bprofile%2Bemail%2Bauthorities%2Buser%26redirect_uri%3Dhttps%253A%252F%252Fpages.hotmart.com%252Fauth%252Flogin%26response_type%3Dcode%26response_mode%3Dquery%26state%3D1ee9a04d7887487e9daa3801c27862fe%26client_name%3DCasOAuthClient',
        waitUntil: 'load',
        description: 'Navigate to Hotmart SSO login page'
      },
      
      // Step 2: Wait for page to load
      {
        action: 'wait',
        condition: 'timeout',
        duration: 5000,
        description: 'Wait for page to fully load'
      },
      
      // Step 3: Handle cookie banner (optional)
      {
        action: 'click',
        selectors: [
          'button:contains("Accept")',
          'button:contains("Aceitar")',
          'button:contains("Concordo")',
          'button[id*="accept"]',
          'button[class*="cookie"]',
          'button[class*="accept"]',
          'a:contains("Accept")',
          'a:contains("Aceitar")'
        ],
        method: 'javascript',
        optional: true,
        waitAfter: 2000,
        description: 'Accept cookie banner if present'
      },
      
      // Step 4: Fill email
      {
        action: 'fill',
        selectors: [
          'input[type="email"]',
          'input[name="username"]',
          'input[id="username"]',
          'input[placeholder*="Email"]',
          'input[placeholder*="email"]'
        ],
        value: 'HOTMART_EMAIL',
        waitAfter: 1000,
        description: 'Fill email field'
      },
      
      // Step 5: Fill password
      {
        action: 'fill',
        selectors: [
          'input[type="password"]',
          'input[name="password"]',
          'input[id*="password"]',
          'input[placeholder*="password"]',
          'input[placeholder*="senha"]'
        ],
        value: 'HOTMART_PASSWORD',
        waitAfter: 1000,
        description: 'Fill password field'
      },
      
      // Step 6: Click login button
      {
        action: 'click',
        selectors: [
          'button:contains("Log in")',
          'button[type="submit"]',
          'button:contains("Login")',
          'button:contains("Entrar")',
          'button:contains("Sign in")'
        ],
        method: 'javascript',
        waitAfter: 5000,
        description: 'Click login button'
      },
      
      // Step 7: Wait for navigation
      {
        action: 'wait',
        condition: 'timeout',
        duration: 5000,
        description: 'Wait for login to process'
      },
      
      // Step 8: Detect 2FA or success
      {
        action: 'detect',
        condition: 'url_contains',
        text: 'verification',
        onTrue: 'NEEDS_2FA',
        onFalse: 'LOGIN_SUCCESS',
        description: 'Check if 2FA is required (URL-based detection)'
      }
    ];
    
    // If 2FA code is provided, add 2FA actions
    if (twoFactorCode) {
      // Hotmart uses 6 individual input boxes for the code
      // We need to fill each digit separately
      const digits = twoFactorCode.toString().split('');
      
      loginActions.push(
        {
          action: 'execute_js',
          code: `
            const inputs = document.querySelectorAll('input[type="text"], input[type="tel"], input[maxlength="1"]');
            const code = '${twoFactorCode}';
            for (let i = 0; i < Math.min(inputs.length, code.length); i++) {
              inputs[i].value = code[i];
              inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
              inputs[i].dispatchEvent(new Event('change', { bubbles: true }));
            }
          `,
          description: 'Fill all 6 2FA code digits'
        },
        {
          action: 'wait',
          condition: 'timeout',
          duration: 1000,
          description: 'Wait for code to be processed'
        },
        {
          action: 'click',
          selectors: [
            'button:contains("Confirm")',
            'button:contains("Confirmar")',
            'button[type="submit"]',
            'button:contains("Verify")',
            'button:contains("Verificar")'
          ],
          method: 'javascript',
          waitAfter: 5000,
          description: 'Submit 2FA code'
        },
        {
          action: 'wait',
          condition: 'timeout',
          duration: 3000,
          description: 'Wait for 2FA verification'
        }
      );
    }
    
    // Execute the login sequence
    const result = await this.brightData.executeBrowserTask(async (page) => {
      const sequenceResult = await this.executeActionSequence(page, loginActions);
      
      // Take final screenshot
      const screenshot = await page.screenshot({ fullPage: false });
      
      return {
        ...sequenceResult,
        url: page.url(),
        screenshot: screenshot.toString('base64')
      };
    });
    
    // Store session if successful
    if (result.status === 'SUCCESS' || result.cookies) {
      this.sessionCookies = result.cookies;
      this.isAuthenticated = result.status === 'SUCCESS';
    }
    
    return result;
  }

  /**
   * Get current session cookies
   */
  getSessionCookies() {
    return this.sessionCookies;
  }

  /**
   * Check if authenticated
   */
  isLoggedIn() {
    return this.isAuthenticated;
  }
}

module.exports = HotmartLoginService;

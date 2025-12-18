#!/usr/bin/env node

const { chromium } = require('playwright');
const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');

/**
 * Affiliate Marketing System - Local Connector
 * 
 * This tool runs Playwright headed on your local machine to authenticate
 * to affiliate platforms, then uploads the session to the backend.
 * 
 * Usage:
 *   node connector.js
 *   npm run connect
 */

// Platform configurations
const PLATFORMS = {
  hotmart: {
    name: 'Hotmart',
    loginUrl: 'https://app-vlc.hotmart.com/login',
    dashboardUrl: 'https://app-vlc.hotmart.com',
    loginSelector: 'input[type="email"], input[name="email"]',
    dashboardSelector: '.dashboard, [data-testid="dashboard"], .home-page'
  },
  clickbank: {
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    dashboardUrl: 'https://accounts.clickbank.com',
    loginSelector: 'input[name="username"]',
    dashboardSelector: '.dashboard, #dashboard'
  },
  shareasale: {
    name: 'ShareASale',
    loginUrl: 'https://account.shareasale.com/a-login.cfm',
    dashboardUrl: 'https://account.shareasale.com',
    loginSelector: 'input[name="username"]',
    dashboardSelector: '.dashboard, #main-content'
  }
};

class LocalConnector {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || process.env.API_URL || 'http://localhost:5000/api';
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  /**
   * Main flow
   */
  async connect() {
    try {
      console.log(chalk.bold.cyan('\n🚀 Affiliate Marketing System - Local Connector\n'));

      // Step 1: Select platform
      const platform = await this.selectPlatform();
      if (!platform) {
        console.log(chalk.yellow('Connection cancelled.'));
        return;
      }

      const config = PLATFORMS[platform];

      // Step 2: Request connect token from backend
      const spinner = ora('Requesting connect token from backend...').start();
      const { connectToken, expiresIn } = await this.requestConnectToken(platform);
      spinner.succeed(`Connect token received (expires in ${expiresIn / 60} minutes)`);

      // Step 3: Launch browser and navigate to login
      spinner.start('Launching browser...');
      await this.launchBrowser();
      spinner.succeed('Browser launched');

      spinner.start(`Navigating to ${config.name} login page...`);
      await this.page.goto(config.loginUrl, { waitUntil: 'networkidle' });
      spinner.succeed(`Opened ${config.name} login page`);

      // Step 4: Wait for user to complete login
      console.log(chalk.bold.yellow(`\n⚠️  Please complete the login process in the browser window.`));
      console.log(chalk.gray('   - Enter your credentials'));
      console.log(chalk.gray('   - Complete 2FA if required'));
      console.log(chalk.gray('   - Wait until you see the dashboard\n'));

      await prompts({
        type: 'confirm',
        name: 'ready',
        message: 'Have you completed the login?',
        initial: true
      });

      // Step 5: Validate login
      spinner.start('Validating login...');
      const isLoggedIn = await this.validateLogin(config);
      
      if (!isLoggedIn) {
        spinner.fail('Login validation failed');
        console.log(chalk.red('\n❌ Could not detect successful login.'));
        console.log(chalk.yellow('Please make sure you are logged in and on the dashboard page.'));
        await this.cleanup();
        return;
      }
      
      spinner.succeed('Login validated successfully');

      // Step 6: Extract storageState
      spinner.start('Extracting session data...');
      const storageState = await this.context.storageState();
      const cookieCount = storageState.cookies.length;
      spinner.succeed(`Extracted session data (${cookieCount} cookies)`);

      // Step 7: Upload to backend
      spinner.start('Uploading session to backend...');
      const uploadResult = await this.uploadStorageState(platform, connectToken, storageState);
      spinner.succeed('Session uploaded successfully');

      // Step 8: Display success
      console.log(chalk.bold.green(`\n✅ Successfully connected to ${config.name}!\n`));
      console.log(chalk.gray(`   Platform: ${uploadResult.platform}`));
      console.log(chalk.gray(`   Cookies: ${uploadResult.cookieCount}`));
      console.log(chalk.gray(`   Expires: ${new Date(uploadResult.expiresAt).toLocaleString()}\n`));

      console.log(chalk.cyan('Your backend can now scrape this platform headlessly without login!\n'));

      // Step 9: Cleanup
      await this.cleanup();

    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Select platform
   */
  async selectPlatform() {
    const response = await prompts({
      type: 'select',
      name: 'platform',
      message: 'Select the platform to connect:',
      choices: Object.entries(PLATFORMS).map(([key, config]) => ({
        title: config.name,
        value: key
      }))
    });

    return response.platform;
  }

  /**
   * Request connect token from backend
   */
  async requestConnectToken(platform) {
    try {
      const response = await axios.post(`${this.apiUrl}/local-connect/${platform}/token`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get connect token');
      }

      return {
        connectToken: response.data.connectToken,
        expiresIn: response.data.expiresIn
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Backend error: ${error.response.data.error || error.response.statusText}`);
      }
      throw new Error(`Could not connect to backend at ${this.apiUrl}: ${error.message}`);
    }
  }

  /**
   * Launch Playwright browser
   */
  async launchBrowser() {
    this.browser = await chromium.launch({
      headless: false, // MUST be headed for user login
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();
  }

  /**
   * Validate login
   */
  async validateLogin(config) {
    try {
      const currentUrl = this.page.url();
      
      // Check if URL contains dashboard/home indicators
      const urlCheck = currentUrl.includes('dashboard') || 
                      currentUrl.includes('home') || 
                      currentUrl.includes(config.dashboardUrl);

      // Check for dashboard selector
      let selectorCheck = false;
      try {
        await this.page.waitForSelector(config.dashboardSelector, { timeout: 5000 });
        selectorCheck = true;
      } catch {
        // Selector not found, but URL might be enough
      }

      // Check for login page elements (should NOT be present)
      let notOnLoginPage = true;
      try {
        const loginElement = await this.page.$(config.loginSelector);
        if (loginElement) {
          notOnLoginPage = false;
        }
      } catch {
        // Login selector not found, which is good
      }

      return (urlCheck || selectorCheck) && notOnLoginPage;
    } catch (error) {
      console.error('Validation error:', error.message);
      return false;
    }
  }

  /**
   * Upload storageState to backend
   */
  async uploadStorageState(platform, connectToken, storageState) {
    try {
      const response = await axios.post(`${this.apiUrl}/local-connect/${platform}/upload`, {
        connectToken,
        storageState
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Upload failed');
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Upload error: ${error.response.data.error || error.response.statusText}`);
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Cleanup
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const apiUrl = process.argv[2]; // Optional: pass API URL as argument
  const connector = new LocalConnector(apiUrl);
  connector.connect();
}

module.exports = LocalConnector;

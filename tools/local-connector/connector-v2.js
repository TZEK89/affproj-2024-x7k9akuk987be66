#!/usr/bin/env node

const { chromium } = require('playwright');
const axios = require('axios');
const readline = require('readline');
const chalk = require('chalk');
const ora = require('ora');

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const PLATFORMS = {
  hotmart: {
    name: 'Hotmart',
    loginUrl: 'https://app-vlc.hotmart.com/login',
    authCheck: {
      urlIncludes: '/app-vlc.hotmart.com',
      urlExcludes: '/login',
      selector: '.user-menu, [data-testid="user-menu"], .header-user, .user-avatar'
    }
  },
  clickbank: {
    name: 'ClickBank',
    loginUrl: 'https://accounts.clickbank.com/login',
    authCheck: {
      urlIncludes: '/accounts.clickbank.com',
      urlExcludes: '/login',
      selector: '.user-info, #user-menu, .account-menu'
    }
  },
  shareasale: {
    name: 'ShareASale',
    loginUrl: 'https://account.shareasale.com/a-login.cfm',
    authCheck: {
      urlIncludes: '/account.shareasale.com',
      urlExcludes: '/login',
      selector: '.user-nav, #user-info, .account-info'
    }
  }
};

async function main() {
  console.log(chalk.bold.cyan('\n🔗 Local Connector - Hardened Version\n'));

  // Select platform
  const platform = await selectPlatform();
  const config = PLATFORMS[platform];

  console.log(chalk.green(`\n✓ Selected: ${config.name}\n`));

  let spinner = ora('Requesting connect token from backend...').start();

  try {
    // Step 1: Request connect token
    const tokenResponse = await axios.post(`${API_URL}/local-connect-v2/${platform}/token`);
    const { connectToken } = tokenResponse.data;

    spinner.succeed('Connect token received');

    // Step 2: Launch browser
    spinner = ora('Launching browser...').start();
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    spinner.succeed('Browser launched');

    // Step 3: Navigate to login page
    spinner = ora(`Navigating to ${config.name} login...`).start();
    await page.goto(config.loginUrl);
    spinner.succeed(`Navigated to ${config.name} login`);

    // Step 4: Wait for user to log in
    console.log(chalk.yellow('\n⚠️  Please log in manually in the browser window'));
    console.log(chalk.yellow('   Complete any 2FA or CAPTCHA challenges'));
    console.log(chalk.yellow('   Then press Enter here when you\'re logged in\n'));

    await waitForEnter();

    // Step 5: Verify login
    spinner = ora('Verifying login...').start();
    
    const isLoggedIn = await verifyLogin(page, config);
    
    if (!isLoggedIn.success) {
      spinner.fail('Login verification failed');
      console.log(chalk.red('\n❌ Login verification failed:'));
      console.log(chalk.red(`   ${isLoggedIn.reason}`));
      console.log(chalk.yellow('\nPlease ensure you are logged in and try again.\n'));
      await browser.close();
      process.exit(1);
    }

    spinner.succeed('Login verified successfully');

    // Step 6: Capture session fingerprint
    spinner = ora('Capturing session fingerprint...').start();
    
    const fingerprint = await captureFingerprint(page);
    
    spinner.succeed(`Fingerprint captured (${fingerprint.userAgent.substring(0, 50)}...)`);

    // Step 7: Extract storageState
    spinner = ora('Extracting session data...').start();
    
    const storageState = await context.storageState();
    const cookieCount = storageState.cookies.length;
    
    spinner.succeed(`Session data extracted (${cookieCount} cookies)`);

    // Step 8: Upload to backend
    spinner = ora('Uploading session to backend...').start();
    
    const uploadResponse = await axios.post(`${API_URL}/local-connect-v2/${platform}/upload`, {
      connectToken,
      storageState,
      fingerprint
    });

    spinner.succeed('Session uploaded successfully');

    // Step 9: Close browser
    await browser.close();

    // Success!
    console.log(chalk.bold.green('\n✅ Connection successful!\n'));
    console.log(chalk.white(`   Platform: ${config.name}`));
    console.log(chalk.white(`   Cookies: ${cookieCount}`));
    console.log(chalk.white(`   Expires: ${new Date(uploadResponse.data.expiresAt).toLocaleDateString()}`));
    console.log(chalk.white(`   User Agent: ${fingerprint.userAgent.substring(0, 60)}...`));
    console.log(chalk.white(`   Locale: ${fingerprint.locale}`));
    console.log(chalk.white(`   Timezone: ${fingerprint.timezone}\n`));

  } catch (error) {
    if (spinner) {
      spinner.fail('Error');
    }
    console.log(chalk.red('\n❌ Error:'), error.message);
    if (error.response) {
      console.log(chalk.red('   Server response:'), error.response.data);
    }
    process.exit(1);
  }
}

async function selectPlatform() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.white('Available platforms:'));
  Object.entries(PLATFORMS).forEach(([key, value], index) => {
    console.log(chalk.white(`  ${index + 1}. ${value.name}`));
  });

  return new Promise((resolve) => {
    rl.question(chalk.cyan('\nSelect platform (1-3): '), (answer) => {
      const index = parseInt(answer) - 1;
      const platforms = Object.keys(PLATFORMS);
      
      if (index >= 0 && index < platforms.length) {
        rl.close();
        resolve(platforms[index]);
      } else {
        console.log(chalk.red('Invalid selection'));
        rl.close();
        process.exit(1);
      }
    });
  });
}

async function waitForEnter() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.cyan('Press Enter when logged in: '), () => {
      rl.close();
      resolve();
    });
  });
}

async function verifyLogin(page, config) {
  const currentUrl = page.url();
  
  // Check URL condition
  const urlIncludesPass = currentUrl.includes(config.authCheck.urlIncludes);
  const urlExcludesPass = !currentUrl.includes(config.authCheck.urlExcludes);
  const urlCheck = urlIncludesPass && urlExcludesPass;
  
  if (!urlCheck) {
    return {
      success: false,
      reason: `URL check failed. Expected URL to include "${config.authCheck.urlIncludes}" and exclude "${config.authCheck.urlExcludes}". Current: ${currentUrl}`
    };
  }
  
  // Check selector exists
  const selectors = config.authCheck.selector.split(',').map(s => s.trim());
  let selectorCheck = false;
  
  for (const selector of selectors) {
    try {
      const element = await page.waitForSelector(selector, { timeout: 3000 });
      if (element) {
        selectorCheck = true;
        break;
      }
    } catch {
      // Try next selector
    }
  }
  
  if (!selectorCheck) {
    return {
      success: false,
      reason: `Selector check failed. Expected to find one of: ${config.authCheck.selector}`
    };
  }
  
  return {
    success: true,
    currentUrl
  };
}

async function captureFingerprint(page) {
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const locale = await page.evaluate(() => navigator.language);
  const timezone = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  return {
    userAgent,
    locale,
    timezone,
    createdAt: new Date().toISOString()
  };
}

// Run
main().catch(console.error);

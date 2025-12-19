/**
 * Session Fingerprinting
 * 
 * Captures and reuses browser environment details to prevent
 * platforms from invalidating sessions due to environment mismatch.
 */

/**
 * Create a session fingerprint from a browser context
 */
async function createFingerprint(context) {
  // Get user agent from context
  const userAgent = await context.evaluate(() => navigator.userAgent);
  
  // Get locale and timezone
  const locale = await context.evaluate(() => navigator.language);
  const timezone = await context.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  
  return {
    userAgent,
    locale,
    timezone,
    createdAt: new Date().toISOString()
  };
}

/**
 * Apply a fingerprint to a new browser context
 */
function applyFingerprint(contextOptions, fingerprint) {
  if (!fingerprint) {
    return contextOptions;
  }
  
  return {
    ...contextOptions,
    userAgent: fingerprint.userAgent,
    locale: fingerprint.locale,
    timezoneId: fingerprint.timezone
  };
}

/**
 * Get default fingerprint (if none exists)
 */
function getDefaultFingerprint() {
  return {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-US',
    timezone: 'America/New_York',
    createdAt: new Date().toISOString()
  };
}

module.exports = {
  createFingerprint,
  applyFingerprint,
  getDefaultFingerprint
};

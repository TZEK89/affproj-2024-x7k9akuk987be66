/**
 * Supabase Configuration
 * 
 * Centralized Supabase client initialization.
 * All modules should import the singleton instance from this file.
 */

const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_KEY environment variable is required');
}

// Create singleton Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false, // Server-side, no session persistence needed
      autoRefreshToken: false
    }
  }
);

// Test connection on initialization
supabase
  .from('users')
  .select('count')
  .limit(1)
  .then(() => {
    console.log('✅ Supabase client initialized successfully');
  })
  .catch((error) => {
    console.warn('⚠️ Supabase connection test failed:', error.message);
    console.warn('⚠️ This may be expected if tables are not yet created');
  });

module.exports = { supabase };

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

/**
 * Admin routes for system management
 * WARNING: These should be protected in production!
 */

/**
 * Run database migrations
 * POST /api/admin/migrate
 */
router.post('/migrate', async (req, res) => {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Found ${files.length} migration files`);
    
    const results = [];
    
    // Run each migration
    for (const file of files) {
      try {
        console.log(`\n📝 Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        await db.query(sql);
        console.log(`✅ Completed: ${file}`);
        results.push({ file, status: 'success' });
      } catch (error) {
        console.error(`❌ Failed: ${file}`, error.message);
        results.push({ file, status: 'error', error: error.message });
        // Continue with other migrations even if one fails
      }
    }
    
    console.log('\n🎉 Migration process completed!');
    
    res.json({
      success: true,
      message: 'Migrations completed',
      results
    });
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

/**
 * Check migration status
 * GET /api/admin/migrate/status
 */
router.get('/migrate/status', async (req, res) => {
  try {
    // Check which tables exist
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const tables = result.rows.map(r => r.table_name);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    res.json({
      success: true,
      tables,
      migrationFiles,
      tableCount: tables.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get database info
 * GET /api/admin/db/info
 */
router.get('/db/info', async (req, res) => {
  try {
    // Get table list with row counts
    const result = await db.query(`
      SELECT 
        schemaname,
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = tablename) as column_count
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    res.json({
      success: true,
      tables: result.rows
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

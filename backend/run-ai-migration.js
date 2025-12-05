const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({ 
  connectionString: 'postgresql://postgres.oyclropoirfafifotqqu:AffiliateSystem2025!@aws-0-us-west-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false } 
});

const sql = fs.readFileSync('/home/ubuntu/affiliate-marketing-system/backend/database/migrations/005_create_ai_tables.sql', 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ AI tables created successfully');
    return pool.end();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    pool.end();
  });

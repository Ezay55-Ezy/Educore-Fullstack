const { Pool } = require('pg');
require('dotenv').config();

console.log('Attempting DB connection...');

// Supabase Transaction Pooler (Port 6543) configuration
// Recommended DATABASE_URL format:
// postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Adding connection timeout and idle timeout for better resilience
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ DATABASE CONNECTION ERROR DETAILS:');
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('Stack:', err.stack);
    
    if (err.message.includes('ETIMEDOUT')) {
      console.error('💡 TIP: This might be an IPv6/IPv4 issue. Ensure you are using the Supabase Transaction Pooler (Port 6543).');
    }
    if (err.code === '28P01') {
      console.error('💡 TIP: Invalid password or incorrect pooler username format (should be user.project-ref).');
    }
  } else {
    console.log('✅ Connected to Supabase PostgreSQL successfully!');
    release();
  }
});

// Error listener for the pool
pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

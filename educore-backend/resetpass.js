require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

bcrypt.hash('password123', 10).then(hash => {
  pool.query('UPDATE users SET password_hash = $1', [hash]).then(r => {
    console.log('✅ Done! Updated', r.rowCount, 'users to password123');
    process.exit();
  }).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
});
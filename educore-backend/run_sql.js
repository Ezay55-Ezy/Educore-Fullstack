const pool = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'database/add_settings.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ SQL executed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ SQL execution failed:', err.message);
    process.exit(1);
  }
}

run();

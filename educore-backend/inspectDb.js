const pool = require('./src/config/database');

async function inspectSchema() {
  try {
    console.log('--- TABLES ---');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(tables.rows.map(r => r.table_name).join(', '));

    for (const row of tables.rows) {
      console.log(`\n--- COLUMNS IN ${row.table_name} ---`);
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
      `, [row.table_name]);
      console.table(columns.rows);
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspectSchema();

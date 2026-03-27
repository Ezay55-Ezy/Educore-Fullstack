const pool = require('./src/config/database');

async function checkCbcConstraints() {
  try {
    const result = await pool.query(`
      SELECT conname, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND conrelid = 'cbc_assessments'::regclass;
    `);
    console.table(result.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkCbcConstraints();

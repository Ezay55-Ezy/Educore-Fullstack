const pool = require('./src/config/database');

async function checkMoreConstraints() {
  try {
    const tables = ['announcements', 'timetables', 'timetable_periods', 'notifications'];
    for (const t of tables) {
      console.log(`\n--- CONSTRAINTS FOR ${t} ---`);
      const result = await pool.query(`
        SELECT conname, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'public' AND conrelid = '${t}'::regclass;
      `);
      console.table(result.rows);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkMoreConstraints();

const pool = require('./src/config/database');

async function checkDuplicates() {
  try {
    const result = await pool.query(`
      SELECT student_id, subject_id, term, year, COUNT(*)
      FROM grades
      GROUP BY student_id, subject_id, term, year
      HAVING COUNT(*) > 1
    `);
    if (result.rows.length > 0) {
      console.log('Duplicates found:');
      console.table(result.rows);
    } else {
      console.log('No duplicates found in grades table.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDuplicates();

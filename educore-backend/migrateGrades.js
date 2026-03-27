const pool = require('./src/config/database');

async function migrate() {
  try {
    console.log('⏳ Cleaning up duplicates in grades table...');
    await pool.query(`
      DELETE FROM grades a USING grades b
      WHERE a.id < b.id
        AND a.student_id = b.student_id
        AND a.subject_id = b.subject_id
        AND a.term = b.term
        AND a.year = b.year
    `);
    console.log('✅ Duplicates cleaned.');

    console.log('⏳ Adding unique constraint to grades table...');
    await pool.query(`
      ALTER TABLE grades 
      ADD CONSTRAINT grades_student_subject_term_year_key 
      UNIQUE (student_id, subject_id, term, year)
    `);
    console.log('✅ Unique constraint added to grades.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();

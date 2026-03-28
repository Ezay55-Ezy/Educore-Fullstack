require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function create() {
  const hash = await bcrypt.hash('teacher123', 10);
  
  // 1. Create or get teacher record
  let teacherRes = await pool.query(
    "SELECT id FROM teachers WHERE email = 'teacher@educore.com'"
  );
  
  let teacherId;
  if (teacherRes.rows.length === 0) {
    teacherRes = await pool.query(
      `INSERT INTO teachers (first_name, last_name, email, status)
       VALUES ('Demo', 'Teacher', 'teacher@educore.com', 'Active')
       RETURNING id`
    );
    teacherId = teacherRes.rows[0].id;
  } else {
    teacherId = teacherRes.rows[0].id;
  }

  // 2. Create or update user record
  await pool.query(
    `INSERT INTO users (email, admission_no, password_hash, role, teacher_id)
     VALUES ('teacher@educore.com', 'TCH-001', $1, 'teacher', $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = $1, teacher_id = $2`,
    [hash, teacherId]
  );
  
  console.log('Done! Teacher account created and linked.');
  console.log('Email:    teacher@educore.com');
  console.log('Password: teacher123');
  process.exit();
}
create();

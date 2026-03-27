const pool = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('⏳ Seeding sample data...');

    // 1. Create Teachers
    const teacherResult = await pool.query(`
      INSERT INTO teachers (first_name, last_name, email, specialization, phone, address)
      VALUES 
        ('James', 'Mwangi', 'james.mwangi@educore.com', 'Mathematics', '0711111111', 'Nairobi'),
        ('Sarah', 'Achieng', 'sarah.achieng@educore.com', 'English', '0722222222', 'Kisumu')
      ON CONFLICT (email) DO UPDATE SET specialization = EXCLUDED.specialization
      RETURNING id, email
    `);
    const teachers = teacherResult.rows;

    // 2. Link Teachers to Users
    const passwordHash = await bcrypt.hash('teacher123', 10);
    for (const teacher of teachers) {
      await pool.query(`
        INSERT INTO users (email, admission_no, password_hash, role, teacher_id)
        VALUES ($1, $2, $3, 'teacher', $4)
        ON CONFLICT (email) DO UPDATE SET teacher_id = $4
      `, [teacher.email, `TCH-${teacher.id}`, passwordHash, teacher.id]);
    }

    // 3. Create Announcements
    await pool.query(`
      INSERT INTO announcements (title, content, category, priority, target_audience)
      VALUES 
        ('Welcome to Term 2', 'Welcome back all students and staff for the second term.', 'general', 'normal', 'all'),
        ('Mathematics Workshop', 'There will be a math workshop for Form 3 students this Friday.', 'academic', 'high', 'students'),
        ('Staff Meeting', 'All teachers are required to attend a staff meeting on Monday.', 'general', 'high', 'teachers')
      ON CONFLICT DO NOTHING
    `);

    // 4. Create Timetable Entries for Class 1 (Form 1 East)
    const timetableResult = await pool.query(`
      INSERT INTO timetables (class_id, day_of_week)
      VALUES (1, 'Monday')
      ON CONFLICT (class_id, day_of_week) DO UPDATE SET created_at = NOW()
      RETURNING id
    `);
    const timetableId = timetableResult.rows[0].id;

    // Get subject IDs
    const subjects = await pool.query('SELECT id FROM subjects LIMIT 2');
    if (subjects.rows.length >= 2) {
      await pool.query(`
        INSERT INTO timetable_periods (timetable_id, start_time, end_time, subject_id, teacher_id, room_number)
        VALUES 
          ($1, '08:00:00', '09:00:00', $2, $3, 'Room 101'),
          ($1, '09:00:00', '10:00:00', $4, $5, 'Room 102')
        ON CONFLICT DO NOTHING
      `, [timetableId, subjects.rows[0].id, teachers[0].id, subjects.rows[1].id, teachers[1].id]);
    }

    console.log('✅ Sample data seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
};

seedData();

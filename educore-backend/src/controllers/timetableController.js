const pool = require('../config/database');

const getTimetable = async (req, res) => {
  try {
    const { role, studentId, teacherId } = req.user;
    const { class_id, teacher_id } = req.query;

    let query = `
      SELECT t.day_of_week, tp.start_time, tp.end_time, tp.room_number,
             s.name as subject_name, teach.first_name as teacher_first_name, teach.last_name as teacher_last_name
      FROM timetables t
      JOIN timetable_periods tp ON t.id = tp.timetable_id
      JOIN subjects s ON tp.subject_id = s.id
      JOIN teachers teach ON tp.teacher_id = teach.id
      WHERE 1=1
    `;
    const params = [];

    if (role === 'student') {
      const studentClassQuery = await pool.query('SELECT class_id FROM students WHERE id = $1', [studentId]);
      const actualClassId = studentClassQuery.rows[0]?.class_id;
      if (!actualClassId) {
        return res.status(404).json({ success: false, message: 'Class not found for student.' });
      }
      params.push(actualClassId);
      query += ` AND t.class_id = $${params.length}`;
    } else if (role === 'teacher') {
      params.push(teacherId);
      query += ` AND tp.teacher_id = $${params.length}`;
    } else if (role === 'admin') {
      if (class_id) {
        params.push(class_id);
        query += ` AND t.class_id = $${params.length}`;
      } else if (teacher_id) {
        params.push(teacher_id);
        query += ` AND tp.teacher_id = $${params.length}`;
      }
    }

    query += ' ORDER BY t.day_of_week, tp.start_time';
    const result = await pool.query(query, params);
    res.json({ success: true, timetable: result.rows });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createTimetableEntry = async (req, res) => {
  const client = await pool.connect();
  try {
    const { classId, day, periods } = req.body;

    if (!classId || !day || !periods || !Array.isArray(periods)) {
      return res.status(400).json({ success: false, message: 'ClassId, day, and periods array are required.' });
    }

    await client.query('BEGIN');

    // Create or find timetable for class/day
    const timetableResult = await client.query(
      `INSERT INTO timetables (class_id, day_of_week) 
       VALUES ($1, $2) 
       ON CONFLICT (class_id, day_of_week) DO UPDATE SET created_at = NOW()
       RETURNING id`,
      [classId, day]
    );

    const timetableId = timetableResult.rows[0].id;

    // Clear existing periods for this timetable entry
    await client.query('DELETE FROM timetable_periods WHERE timetable_id = $1', [timetableId]);

    // Insert new periods
    for (const p of periods) {
      await client.query(
        `INSERT INTO timetable_periods (timetable_id, start_time, end_time, subject_id, teacher_id, room_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [timetableId, p.time.split(' - ')[0], p.time.split(' - ')[1], p.subject_id, p.teacher_id, p.room]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Timetable entry created/updated successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create timetable error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

module.exports = {
  getTimetable,
  createTimetableEntry
};

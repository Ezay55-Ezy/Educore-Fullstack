const bcrypt = require('bcryptjs');

const pool = require('../config/database');
const { createNotification } = require('./notificationController');

const getGrades = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT grade_level, COUNT(id) as class_count
       FROM classes
       GROUP BY grade_level
       ORDER BY grade_level`
    );
    res.json({ success: true, grades: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getClassesByGrade = async (req, res) => {
  try {
    const { grade } = req.params;
    const result = await pool.query(
      `SELECT c.*, COUNT(s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id
       WHERE c.grade_level = $1
       GROUP BY c.id ORDER BY c.name`,
      [grade]
    );
    res.json({ success: true, classes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getClassStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT s.id, s.first_name, s.last_name, s.admission_no, s.assessment_number
       FROM students s WHERE s.class_id = $1
       ORDER BY s.last_name, s.first_name`,
      [id]
    );
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { class_id, date } = req.query;
    const result = await pool.query(
      `SELECT a.student_id, a.status
       FROM attendance a
       JOIN students s ON a.student_id = s.id
       WHERE s.class_id = $1 AND a.date = $2`,
      [class_id, date]
    );
    res.json({ success: true, attendance: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const saveAttendance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { records } = req.body;
    if (!records || !records.length) {
      return res.status(400).json({ success: false, message: 'No records provided.' });
    }
    await client.query('BEGIN');
    for (const r of records) {
      await client.query(
        `INSERT INTO attendance (student_id, date, status, recorded_by)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, date)
         DO UPDATE SET status = $3`,
        [r.student_id, r.date, r.status, req.user.userId]
      );

      if (r.status === 'Absent' || r.status === 'Late') {
        const userResult = await client.query('SELECT id FROM users WHERE student_id = $1', [r.student_id]);
        if (userResult.rows.length > 0) {
          await createNotification(
            userResult.rows[0].id,
            `Attendance Alert: ${r.status}`,
            `You have been marked as ${r.status} for ${r.date}.`,
            'warning'
          );
        }
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, message: 'Attendance saved.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const getLearningAreas = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, learning_area_name as name, code FROM learning_areas ORDER BY learning_area_name');
    res.json({ success: true, learningAreas: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const registerTeacher = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, phone, subject, password, staff_no } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    await client.query('BEGIN');

    // 1. Create teacher record
    const names = name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ') || 'Teacher';

    const teacherRes = await client.query(
      `INSERT INTO teachers (first_name, last_name, email, phone, main_subject, staff_no, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [firstName, lastName, email, phone, subject, staff_no, 'Active']
    );
    const teacherId = teacherRes.rows[0].id;

    // 2. Create user record for login
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(
      `INSERT INTO users (email, admission_no, password_hash, role, teacher_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [email, staff_no || email, passwordHash, 'teacher', teacherId]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Teacher registered successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register teacher error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const deleteTeacher = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('DELETE FROM users WHERE teacher_id = $1', [id]);
    await client.query('DELETE FROM teachers WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: true, message: 'Teacher deleted successfully.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete teacher error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers ORDER BY last_name, first_name');
    res.json({ success: true, teachers: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getGrades,
  getClassesByGrade,
  getClassStudents,
  getAttendance,
  saveAttendance,
  getLearningAreas,
  registerTeacher,
  deleteTeacher,
  getAllTeachers
};

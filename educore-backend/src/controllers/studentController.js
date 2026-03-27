const pool = require('../config/database');

// ── GET /api/students/:id — Full student profile ────────────
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
         s.id, s.admission_no, s.first_name, s.last_name,
         s.date_of_birth, s.gender, s.blood_group,
         s.address, s.photo_url, s.admission_date,
         s.prev_school, s.kcpe_score, s.medical_notes,
         s.national_id, s.status, s.created_at, s.assessment_number,
         c.name        AS grade_name,
         c.grade_level AS grade,
         c.stream
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Get parent info
    const parents = await pool.query(
      `SELECT full_name, relationship, phone_primary, phone_secondary, email, occupation
       FROM parents WHERE student_id = $1`,
      [id]
    );

    const student = result.rows[0];

    res.json({
      success: true,
      student: {
        ...student,
        full_name: `${student.first_name} ${student.last_name}`,
        parents: parents.rows
      }
    });

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── GET /api/students — All students (admin/teacher only) ───
const getAllStudents = async (req, res) => {
  try {
    const { status, search, grade } = req.query;

    let query = `
      SELECT
        s.id, s.admission_no, s.first_name, s.last_name,
        s.gender, s.status, s.admission_date, s.assessment_number,
        c.name AS grade_name, c.grade_level AS grade
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (grade) {
      query += ` AND c.grade_level = $${paramCount++}`;
      params.push(grade);
    }

    if (status) {
      query += ` AND s.status = $${paramCount++}`;
      params.push(status);
    }

    if (search) {
      query += ` AND (
        s.first_name ILIKE $${paramCount} OR
        s.last_name  ILIKE $${paramCount} OR
        s.admission_no ILIKE $${paramCount} OR
        s.assessment_number ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY s.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      students: result.rows
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getStudentById,
  getAllStudents
};

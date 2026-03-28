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
      students: result.rows.map(s => ({
        ...s,
        grade: parseInt(s.grade) // Ensure grade is an integer for frontend filtering
      }))
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/students — Register new student ───────────────
const registerStudent = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      first_name, last_name, admission_no, date_of_birth, gender,
      blood_group, address, admission_date, class_id, status,
      parent_name, parent_relationship, parent_phone, parent_email
    } = req.body;

    if (!first_name || !last_name || !admission_no) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    await client.query('BEGIN');

    // 1. Insert student
    const studentRes = await client.query(
      `INSERT INTO students (
        first_name, last_name, admission_no, date_of_birth, gender,
        blood_group, address, admission_date, class_id, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [first_name, last_name, admission_no, date_of_birth, gender, blood_group, address, admission_date || new Date(), class_id, status || 'Active']
    );

    const studentId = studentRes.rows[0].id;

    // 2. Insert parent
    if (parent_name) {
      await client.query(
        `INSERT INTO parents (student_id, full_name, relationship, phone_primary, email)
         VALUES ($1, $2, $3, $4, $5)`,
        [studentId, parent_name, parent_relationship, parent_phone, parent_email]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Student registered successfully.', studentId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Register student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ── PUT /api/students/:id — Update student ──────────────────
const updateStudent = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      first_name, last_name, date_of_birth, gender, blood_group,
      address, class_id, status, kcpe_score,
      parent_name, parent_relationship, parent_phone, parent_email
    } = req.body;

    await client.query('BEGIN');

    // 1. Update student
    await client.query(
      `UPDATE students SET
        first_name = $1, last_name = $2, date_of_birth = $3, gender = $4,
        blood_group = $5, address = $6, class_id = $7, status = $8, kcpe_score = $9
      WHERE id = $10`,
      [first_name, last_name, date_of_birth, gender, blood_group, address, class_id, status, kcpe_score, id]
    );

    // 2. Update parent (simplified: delete and re-insert or update if exists)
    if (parent_name) {
      await client.query(
        `INSERT INTO parents (student_id, full_name, relationship, phone_primary, email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id) DO UPDATE SET
           full_name = $2, relationship = $3, phone_primary = $4, email = $5`,
        [id, parent_name, parent_relationship, parent_phone, parent_email]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Student updated successfully.' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  } finally {
    client.release();
  }
};

// ── DELETE /api/students/:id — Delete student ───────────────
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parent records will be deleted automatically if CASCADE is set in DB,
    // but let's be explicit if not.
    await pool.query('DELETE FROM parents WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM students WHERE id = $1', [id]);

    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getStudentById,
  getAllStudents,
  registerStudent,
  updateStudent,
  deleteStudent
};

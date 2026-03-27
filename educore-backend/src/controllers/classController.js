const pool = require('../config/database');

const getClasses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id) as student_count
      FROM classes c
      ORDER BY form_level ASC, name ASC
    `);
    res.json({ success: true, classes: result.rows });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, form_level, stream, capacity } = req.body;
    if (!name || !form_level) return res.status(400).json({ success: false, message: 'Name and form level are required.' });

    const result = await pool.query(
      'INSERT INTO classes (name, form_level, stream, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, form_level, stream, capacity || 45]
    );
    res.status(201).json({ success: true, class: result.rows[0] });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, form_level, stream, capacity } = req.body;
    
    const result = await pool.query(
      'UPDATE classes SET name = $1, form_level = $2, stream = $3, capacity = $4 WHERE id = $5 RETURNING *',
      [name, form_level, stream, capacity, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, class: result.rows[0] });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if class has students
    const check = await pool.query('SELECT COUNT(*) FROM students WHERE class_id = $1', [id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete class with enrolled students.' });
    }

    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
    res.json({ success: true, message: 'Class deleted.' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getClasses, createClass, updateClass, deleteClass };

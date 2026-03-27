const pool = require('../config/database');

const getLearningAreas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM learning_areas ORDER BY learning_area_name');
    res.json({ success: true, learningAreas: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStrands = async (req, res) => {
  try {
    const { learningAreaId } = req.params;
    const result = await pool.query('SELECT * FROM strands WHERE learning_area_id = $1 ORDER BY name', [learningAreaId]);
    res.json({ success: true, strands: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSubStrands = async (req, res) => {
  try {
    const { strandId } = req.params;
    const result = await pool.query('SELECT * FROM sub_strands WHERE strand_id = $1 ORDER BY name', [strandId]);
    res.json({ success: true, subStrands: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const submitAssessment = async (req, res) => {
  try {
    const { studentId, subStrandId, term, year, level, comments } = req.body;
    
    // Check if assessment already exists for this sub-strand in this term
    const check = await pool.query(
      'SELECT id FROM cbc_assessments WHERE student_id = $1 AND sub_strand_id = $2 AND term = $3 AND year = $4',
      [studentId, subStrandId, term, year]
    );

    let result;
    if (check.rows.length > 0) {
      result = await pool.query(
        'UPDATE cbc_assessments SET level = $1, teacher_comments = $2 WHERE id = $3 RETURNING *',
        [level, comments, check.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO cbc_assessments (student_id, sub_strand_id, term, year, level, teacher_comments) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [studentId, subStrandId, term, year, level, comments]
      );
    }
    
    res.json({ success: true, assessment: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getStudentAssessments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { term, year } = req.query;
    
    const result = await pool.query(`
      SELECT ca.*, ss.name as sub_strand_name, s.name as strand_name, la.learning_area_name
      FROM cbc_assessments ca
      JOIN sub_strands ss ON ca.sub_strand_id = ss.id
      JOIN strands s ON ss.strand_id = s.id
      JOIN learning_areas la ON s.learning_area_id = la.id
      WHERE ca.student_id = $1 AND ca.term = $2 AND ca.year = $3
    `, [studentId, term, year]);
    
    res.json({ success: true, assessments: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  getLearningAreas, 
  getStrands, 
  getSubStrands, 
  submitAssessment, 
  getStudentAssessments 
};

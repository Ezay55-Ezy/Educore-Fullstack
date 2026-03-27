const pool = require('../config/database');

const getReportCard = async (req, res) => {
  try {
    const { role, studentId } = req.user;
    const { student_id, term, year } = req.query;

    let targetStudentId = studentId;
    if (role === 'admin' || role === 'teacher') {
      if (!student_id) {
        return res.status(400).json({ success: false, message: 'Student ID is required.' });
      }
      targetStudentId = student_id;
    }

    // 1. Get student info
    const studentResult = await pool.query(
      `SELECT s.*, c.name as grade_name, c.grade_level 
       FROM students s 
       JOIN classes c ON s.class_id = c.id 
       WHERE s.id = $1`,
      [targetStudentId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = studentResult.rows[0];

    // 2. Get CBC Assessments
    const assessmentsResult = await pool.query(
      `SELECT ca.*, ss.name as sub_strand_name, ss.strand_id, s.name as strand_name, la.learning_area_name
       FROM cbc_assessments ca
       JOIN sub_strands ss ON ca.sub_strand_id = ss.id
       JOIN strands s ON ss.strand_id = s.id
       JOIN learning_areas la ON s.learning_area_id = la.id
       WHERE ca.student_id = $1 AND ca.term = $2 AND ca.year = $3
       ORDER BY la.learning_area_name, s.name, ss.name`,
      [targetStudentId, term, year]
    );

    // 3. Map levels to performance scores (1-4)
    const levelMap = { 'EE': 4, 'ME': 3, 'AE': 2, 'BE': 1 };
    const assessments = assessmentsResult.rows.map(a => ({
      ...a,
      performance_level: levelMap[a.level] || 0
    }));

    // 4. Calculate average performance level
    const totalPerformance = assessments.reduce((acc, a) => acc + a.performance_level, 0);
    const avgPerformance = assessments.length > 0 ? (totalPerformance / assessments.length).toFixed(1) : 0;

    // 5. Get attendance stats
    const attendanceResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM attendance
       WHERE student_id = $1
       GROUP BY status`,
      [targetStudentId]
    );

    const totalAttendance = attendanceResult.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
    const presentCount = parseInt(attendanceResult.rows.find(r => r.status === 'Present')?.count || 0);

    res.json({
      success: true,
      reportCard: {
        student: {
          id: student.id,
          admission_no: student.admission_no,
          assessment_number: student.assessment_number,
          name: `${student.first_name} ${student.last_name}`,
          grade_name: student.grade_name,
          grade: student.grade_level
        },
        term,
        year,
        assessments,
        summary: {
          average_performance_level: avgPerformance,
          performance_rating: avgPerformance >= 3.5 ? 'EE' : avgPerformance >= 2.5 ? 'ME' : avgPerformance >= 1.5 ? 'AE' : 'BE'
        },
        attendance: {
          total: totalAttendance,
          present: presentCount,
          percentage: totalAttendance > 0 ? (presentCount / totalAttendance * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    console.error('Get report card error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getReportCard
};

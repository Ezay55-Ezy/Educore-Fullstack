const pool = require('../config/database');

const getAdminStats = async (req, res) => {
  try {
    // 1. Total counts
    const studentsRes = await pool.query('SELECT COUNT(*) FROM students');
    const teachersRes = await pool.query('SELECT COUNT(*) FROM teachers');
    const classesRes  = await pool.query('SELECT COUNT(*) FROM classes');
    
    // 2. Average attendance percentage
    const attendanceRes = await pool.query(
      `SELECT (COUNT(CASE WHEN status = 'Present' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) as avg_attendance FROM attendance`
    );
    const avgAttendance = parseFloat(attendanceRes.rows[0].avg_attendance || 0).toFixed(1);

    // 3. Total fees
    const feesRes = await pool.query('SELECT SUM(amount_paid) as total_fees FROM fee_payments');
    const totalFees = parseFloat(feesRes.rows[0].total_fees || 0);

    // 4. Enrollment over time (Last 6 months)
    const enrollmentRes = await pool.query(
      `SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count 
       FROM students 
       WHERE created_at > NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at)`
    );

    // 5. Recent Activity
    const activityRes = await pool.query(
      `(SELECT 'student' as type, first_name || ' ' || last_name as name, 'Enrolled' as action, created_at FROM students ORDER BY created_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'payment' as type, 'Payment Received' as name, '$' || amount_paid as action, created_at FROM fee_payments ORDER BY created_at DESC LIMIT 3)
       ORDER BY created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      stats: {
        totalStudents: parseInt(studentsRes.rows[0].count),
        totalTeachers: parseInt(teachersRes.rows[0].count),
        totalClasses: parseInt(classesRes.rows[0].count),
        avgAttendance,
        totalFees
      },
      enrollmentTrend: enrollmentRes.rows,
      recentActivity: activityRes.rows
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAdminStats };

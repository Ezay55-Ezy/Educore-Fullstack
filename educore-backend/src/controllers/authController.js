const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/database');
const crypto = require('crypto');

const login = async (req, res) => {
  try {
    const { admission_no, password } = req.body;

    // 1. Validate input
    if (!admission_no || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide admission number and password.'
      });
    }

    // 2. Find user by admission_no OR email (case insensitive)
    const userQuery = await pool.query(
      `SELECT u.*, 
              COALESCE(s.first_name, t.first_name) as first_name, 
              COALESCE(s.last_name, t.last_name) as last_name,
              COALESCE(s.status, t.status) as user_status
       FROM users u
       LEFT JOIN students s ON u.student_id = s.id
       LEFT JOIN teachers t ON u.teacher_id = t.id
       WHERE u.admission_no ILIKE $1 OR u.email ILIKE $1`,
      [admission_no]
    );

    // 3. Check user exists
    const user = userQuery.rows[0];
    console.log('User found:', user ? user.admission_no : 'NOT FOUND');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // 4. Check password against password_hash column
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // 5. Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // 6. Build display name
    const displayName = user.first_name
      ? `${user.first_name} ${user.last_name}`
      : (user.email || user.admission_no);

    // 7. Create JWT token
    const token = jwt.sign(
      {
        userId:    user.id,
        studentId: user.student_id,
        teacherId: user.teacher_id,
        role:      user.role,
        name:      displayName
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 8. Send response
    res.status(200).json({
      success: true,
      message: `Welcome back, ${displayName}!`,
      token,
      user: {
        id:           user.student_id || user.teacher_id,
        admission_no: user.admission_no,
        email:        user.email,
        name:         displayName,
        role:         user.role,
        userId:       user.id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again.'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required.' });
    }

    // Check if user exists with this email and role
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      [email, role]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found with this email and role.' });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store in password_resets
    await pool.query(
      'INSERT INTO password_resets (email, role, code, expires_at) VALUES ($1, $2, $3, $4)',
      [email, role, code, expiresAt]
    );

    // In a real app, send email here. For now, just return it in response for demo.
    console.log(`Reset code for ${email}: ${code}`);
    
    res.json({ success: true, message: 'Reset code sent to your email (check console for demo).' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required.' });
    }

    const result = await pool.query(
      'SELECT * FROM password_resets WHERE email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Update record with token
    await pool.query(
      'UPDATE password_resets SET token = $1 WHERE id = $2',
      [resetToken, result.rows[0].id]
    );

    res.json({ success: true, resetToken });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, new_password } = req.body;
    if (!resetToken || !new_password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const resetResult = await pool.query(
      'SELECT * FROM password_resets WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [resetToken]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    const { email, role, id: resetId } = resetResult.rows[0];
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update user password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 AND role = $3',
      [hashedPassword, email, role]
    );

    // Mark reset code as used
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [resetId]);

    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    let profileQuery;
    if (role === 'student') {
      profileQuery = await pool.query(
        `SELECT u.email, s.first_name, s.last_name, s.admission_no, s.address, s.gender, s.date_of_birth,
                p.full_name as emergency_contact_name, p.phone_primary as emergency_contact_phone
         FROM users u
         JOIN students s ON u.student_id = s.id
         LEFT JOIN parents p ON s.id = p.student_id AND p.is_primary = TRUE
         WHERE u.id = $1`,
        [userId]
      );
    } else if (role === 'teacher') {
      profileQuery = await pool.query(
        `SELECT u.email, t.first_name, t.last_name, t.phone, t.address, t.specialization
         FROM users u
         JOIN teachers t ON u.teacher_id = t.id
         WHERE u.id = $1`,
        [userId]
      );
    } else {
      profileQuery = await pool.query(
        'SELECT email, role FROM users WHERE id = $1',
        [userId]
      );
    }

    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    res.json({ success: true, profile: profileQuery.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const role = req.user.role;
    const updates = req.body;

    if (role === 'student') {
      await pool.query(
        `UPDATE students SET 
           address = COALESCE($1, address), 
           gender = COALESCE($2, gender), 
           date_of_birth = COALESCE($3, date_of_birth) 
         WHERE id = (SELECT student_id FROM users WHERE id = $4)`,
        [updates.address, updates.gender, updates.date_of_birth, userId]
      );
      // Update parent info if provided
      if (updates.emergency_contact_name || updates.emergency_contact_phone) {
        await pool.query(
          `UPDATE parents SET 
             full_name = COALESCE($1, full_name), 
             phone_primary = COALESCE($2, phone_primary)
           WHERE student_id = (SELECT student_id FROM users WHERE id = $3) AND is_primary = TRUE`,
          [updates.emergency_contact_name, updates.emergency_contact_phone, userId]
        );
      }
    } else if (role === 'teacher') {
      await pool.query(
        `UPDATE teachers SET 
           phone = COALESCE($1, phone), 
           address = COALESCE($2, address), 
           specialization = COALESCE($3, specialization)
         WHERE id = (SELECT teacher_id FROM users WHERE id = $4)`,
        [updates.phone, updates.address, updates.specialization, userId]
      );
    }

    // Update email in users table if provided
    if (updates.email) {
      await pool.query('UPDATE users SET email = $1 WHERE id = $2', [updates.email, userId]);
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      id:   req.user.studentId || req.user.teacherId,
      role: req.user.role,
      name: req.user.name,
      userId: req.user.userId
    }
  });
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.userId;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const match  = await bcrypt.compare(current_password, result.rows[0].password_hash);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);

    res.json({ success: true, message: 'Password changed successfully.' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  login, 
  getMe, 
  changePassword, 
  forgotPassword, 
  verifyResetCode, 
  resetPassword,
  getProfile,
  updateProfile
};

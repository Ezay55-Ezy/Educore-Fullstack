const pool = require('../config/database');

// ── GET /api/settings/institution — Get institution name ───────────
const getInstitutionName = async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'institution_name'");
    const name = result.rows.length > 0 ? result.rows[0].value : 'EduCore Academy';
    res.json({ success: true, name });
  } catch (error) {
    console.error('Get institution name error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ── POST /api/settings/institution — Update institution name ────────
const updateInstitutionName = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    // Upsert the institution name
    await pool.query(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES ('institution_name', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [name]
    );

    res.json({ success: true, message: 'Institution name updated successfully.' });
  } catch (error) {
    console.error('Update institution name error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key is required.' });

    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, value]
    );

    res.json({ success: true, message: 'Setting updated.' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { email, phone, address } = req.body;
    const { userId, role, teacher_id } = req.user;

    if (role === 'teacher' && teacher_id) {
      await pool.query(
        'UPDATE teachers SET email = $1, phone = $2, address = $3 WHERE id = $4',
        [email, phone, address, teacher_id]
      );
    }
    
    await pool.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { 
  getInstitutionName,
  updateInstitutionName,
  getSettings, 
  updateSetting,
  updateProfile
};

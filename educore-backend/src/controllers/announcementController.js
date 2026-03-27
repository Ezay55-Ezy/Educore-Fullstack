const pool = require('../config/database');
const { createNotification } = require('./notificationController');

const getAnnouncements = async (req, res) => {
  try {
    const { role } = req.user;
    const { category, limit = 10, offset = 0 } = req.query;

    let query = 'SELECT a.*, u.email as author_email FROM announcements a LEFT JOIN users u ON a.author_id = u.id WHERE 1=1';
    const params = [];

    // Role-based filtering
    if (role === 'student') {
      query += " AND target_audience IN ('all', 'students')";
    } else if (role === 'teacher') {
      query += " AND target_audience IN ('all', 'students', 'teachers')";
    }
    // Admins see everything

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json({ success: true, announcements: result.rows });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category, priority, target_audience } = req.body;
    const authorId = req.user.userId;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required.' });
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, content, category, priority, target_audience, author_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content, category, priority || 'normal', target_audience || 'all', authorId]
    );

    const announcement = result.rows[0];

    // Create notifications for all relevant users
    let userQuery = 'SELECT id FROM users WHERE 1=1';
    if (target_audience === 'students') {
      userQuery += " AND role = 'student'";
    } else if (target_audience === 'teachers') {
      userQuery += " AND role = 'teacher'";
    } else if (target_audience !== 'all') {
      // In a more complex system, target_audience could be a class ID
    }

    const usersToNotify = await pool.query(userQuery);
    for (const user of usersToNotify.rows) {
      await createNotification(
        user.id,
        `New Announcement: ${title}`,
        `A new ${category} announcement has been posted.`,
        priority === 'high' ? 'warning' : 'info'
      );
    }

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, target_audience } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required.' });
    }

    const result = await pool.query(
      `UPDATE announcements 
       SET title = $1, content = $2, category = $3, priority = $4, target_audience = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [title, content, category, priority || 'normal', target_audience || 'all', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }

    res.json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement
};

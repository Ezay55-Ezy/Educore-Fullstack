require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── MIDDLEWARE ──────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4200',
    'http://127.0.0.1:5500',
    'https://educore-school.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── REQUEST LOGGER ───────
app.use((req, res, next) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${req.method} ${req.path}`);
  next();
});

// ── ROUTES ──────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/students',      require('./routes/students'));
app.use('/api/teacher',       require('./routes/teacher'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/timetable',     require('./routes/timetable'));
app.use('/api/report-cards',  require('./routes/report-cards'));
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/settings',      require('./routes/settings'));
app.use('/api/classes',       require('./routes/classes'));
app.use('/api/cbc',           require('./routes/cbc'));

// ── CONFIG ENDPOINT ─────────────────────────────────────────
app.get('/api/config', (req, res) => {
  res.json({
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
});

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: '🎓 EduCore API is running!' });
});

// ── 404 HANDLER ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── ERROR HANDLER ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Server error' });
});

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`║   Running on :http://localhost:${PORT}  ║`);
});

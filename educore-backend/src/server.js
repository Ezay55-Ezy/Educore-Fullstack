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
    'https://educore-school.netlify.app'
  ],
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

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: '🎓 EduCore API is running!' });
});

// ── START SERVER ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`║   Running on :http://localhost:${PORT}  ║`);
});

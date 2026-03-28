/**
 * EduCore Frontend Configuration
 * Centralized settings - update API_BASE_URL for your deployment
 */
const CONFIG = {
  // API Configuration - Local Development
  API_BASE_URL: process.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // App Information
  APP_NAME: 'EduCore',
  APP_TAGLINE: 'School Management System',
  
  // Storage Keys
  STORAGE_KEYS: {
    STUDENT_TOKEN: 'educore_token',
    STUDENT_USER: 'educore_user',
    TEACHER_TOKEN: 'educore_teacher_token',
    TEACHER_USER: 'educore_teacher_user',
    ADMIN_TOKEN: 'educore_admin_token',
    ADMIN_USER: 'educore_admin_user'
  },
  
  // Routes
  ROUTES: {
    STUDENT_LOGIN: 'login.html',
    STUDENT_DASHBOARD: 'dashboard.html',
    TEACHER_LOGIN: 'teacher-login.html',
    TEACHER_DASHBOARD: 'teacher.html',
    ADMIN_LOGIN: 'admin-login.html',
    ADMIN_DASHBOARD: 'admin.html',
    INDEX: 'index.html',
    // New pages
    FORGOT_PASSWORD: 'forgot-password.html',
    PROFILE: 'profile.html',
    ANNOUNCEMENTS: 'announcements.html',
    TIMETABLE: 'timetable.html',
    REPORT_CARD: 'report-card.html'
  },
  
  // Theme Settings
  THEME: {
    STORAGE_KEY: 'educore_theme',
    DEFAULT: 'dark'
  },
  
  // Session Settings
  SESSION: {
    TIMEOUT: 30 * 60 * 1000,      // 30 minutes
    WARNING_TIME: 5 * 60 * 1000,   // 5 minutes before timeout
    CHECK_INTERVAL: 60 * 1000      // Check every minute
  },
  
  // Date/Time Locale
  LOCALE: 'en-KE',
  CURRENCY: 'KSh',
  
  // Error Messages
  ERRORS: {
    CONNECTION_FAILED: 'Cannot connect to server. Please check your internet connection and try again.',
    INVALID_CREDENTIALS: 'Invalid credentials. Please try again.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    SERVER_ERROR: 'Something went wrong. Please try again later.'
  },
  
  // CBC Configuration
  CBC: {
    LEVELS: {
      EE: { label: 'Exceeding Expectations', class: 'level-ee', score: 4 },
      ME: { label: 'Meeting Expectations', class: 'level-me', score: 3 },
      AE: { label: 'Approaching Expectations', class: 'level-ae', score: 2 },
      BE: { label: 'Below Expectations', class: 'level-be', score: 1 }
    }
  },

  // Helper Functions
  formatDate: function(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(this.LOCALE, { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  },
  
  formatMoney: function(amount) {
    return this.CURRENCY + ' ' + Number(amount || 0).toLocaleString();
  },
  
  getInitials: function(name) {
    return (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  },
  
  getGradeClass: function(level) {
    if (!level) return 'level-none';
    const cbc = this.CBC.LEVELS[level];
    return cbc ? cbc.class : 'level-none';
  },

  getGradeLabel: function(level) {
    if (!level) return 'Not Assessed';
    const cbc = this.CBC.LEVELS[level];
    return cbc ? cbc.label : level;
  },
  
  // Auth Headers Helper
  getAuthHeaders: function(token) {
    return { 
      'Authorization': 'Bearer ' + token, 
      'Content-Type': 'application/json' 
    };
  },
  
  // Get current year and surrounding years for dropdowns
  getYearOptions: function() {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  },
  
  // Get today's date in ISO format (YYYY-MM-DD)
  getTodayISO: function() {
    return new Date().toISOString().split('T')[0];
  },
  
  // Format today's date for display
  getTodayDisplay: function() {
    return new Date().toLocaleDateString(this.LOCALE, { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  }
};

// Freeze the config to prevent accidental modifications
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG.STORAGE_KEYS);
  Object.freeze(CONFIG.ROUTES);
  Object.freeze(CONFIG.ERRORS);
  Object.freeze(CONFIG.GRADE_THRESHOLDS);
}

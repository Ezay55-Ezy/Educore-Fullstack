/**
 * EduCore Theme Manager
 * Handles dark/light theme toggle with localStorage persistence
 */
const ThemeManager = (function() {
  const STORAGE_KEY = 'educore_theme';
  const THEMES = {
    DARK: 'dark',
    LIGHT: 'light'
  };

  let currentTheme = THEMES.DARK;

  // Theme color definitions - mapping to the variable names used across the app
  const themeColors = {
    dark: {
      '--bg': '#060910',
      '--surface': '#0d1117',
      '--surface2': '#161b22',
      '--surface3': '#1c2333',
      '--ink': '#f0f6ff',
      '--ink-soft': '#8b9bb4',
      '--ink-muted': '#4a5568',
      '--border': 'rgba(255,255,255,0.07)',
      '--glow': 'rgba(59,130,246,0.15)',
      // Shared variables
      '--bg-primary': '#0f172a',
      '--bg-secondary': '#1e293b',
      '--bg-tertiary': '#334155',
      '--bg-card': 'rgba(30, 41, 59, 0.8)',
      '--text-primary': '#f8fafc',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#64748b',
      '--border-color': 'rgba(255, 255, 255, 0.1)'
    },
    light: {
      '--bg': '#f8fafc',
      '--surface': '#ffffff',
      '--surface2': '#f1f5f9',
      '--surface3': '#e2e8f0',
      '--ink': '#0f172a',
      '--ink-soft': '#475569',
      '--ink-muted': '#94a3b8',
      '--border': 'rgba(0,0,0,0.1)',
      '--glow': 'rgba(59,130,246,0.1)',
      // Shared variables
      '--bg-primary': '#f8fafc',
      '--bg-secondary': '#e2e8f0',
      '--bg-tertiary': '#cbd5e1',
      '--bg-card': 'rgba(255, 255, 255, 0.9)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#64748b',
      '--border-color': 'rgba(0, 0, 0, 0.1)'
    }
  };

  function init() {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && (savedTheme === THEMES.DARK || savedTheme === THEMES.LIGHT)) {
      currentTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      currentTheme = THEMES.LIGHT;
    }
    
    applyTheme(currentTheme);
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
        }
      });
    }
  }

  function applyTheme(theme) {
    const colors = themeColors[theme];
    const root = document.documentElement;
    
    Object.keys(colors).forEach(function(key) {
      root.style.setProperty(key, colors[key]);
    });
    
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    updateToggleIcons(theme);
  }

  function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }

  function toggle() {
    const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setTheme(newTheme);
  }

  function updateToggleIcons(theme) {
    const sunIcons = document.querySelectorAll('.theme-toggle .icon-sun');
    const moonIcons = document.querySelectorAll('.theme-toggle .icon-moon');
    
    if (theme === THEMES.DARK) {
      sunIcons.forEach(el => el.style.display = 'block');
      moonIcons.forEach(el => el.style.display = 'none');
    } else {
      sunIcons.forEach(el => el.style.display = 'none');
      moonIcons.forEach(el => el.style.display = 'block');
    }
  }

  function getTheme() {
    return currentTheme;
  }

  return {
    init: init,
    toggle: toggle,
    setTheme: setTheme,
    getTheme: getTheme,
    THEMES: THEMES
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ThemeManager.init);
} else {
  ThemeManager.init();
}

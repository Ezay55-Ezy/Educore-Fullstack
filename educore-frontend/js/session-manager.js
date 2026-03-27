/**
 * EduCore Session Manager
 * Handles session timeout, activity tracking, and auto-logout
 */
const SessionManager = (function() {
  // Configuration
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
  const CHECK_INTERVAL = 60 * 1000; // Check every minute

  let lastActivity = Date.now();
  let timeoutTimer = null;
  let warningTimer = null;
  let checkTimer = null;
  let warningShown = false;
  let onLogout = null;
  let userRole = null;

  // Activity events to track
  const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

  function init(role, logoutCallback) {
    userRole = role;
    onLogout = logoutCallback;
    lastActivity = Date.now();
    
    // Track user activity
    activityEvents.forEach(function(event) {
      document.addEventListener(event, recordActivity, { passive: true });
    });

    // Start checking for timeout
    startTimers();
    
    // Create warning modal if it doesn't exist
    createWarningModal();
  }

  function recordActivity() {
    lastActivity = Date.now();
    if (warningShown) {
      hideWarning();
      resetTimers();
    }
  }

  function startTimers() {
    clearTimers();
    
    // Set warning timer
    warningTimer = setTimeout(showWarning, SESSION_TIMEOUT - WARNING_TIME);
    
    // Set timeout timer
    timeoutTimer = setTimeout(handleTimeout, SESSION_TIMEOUT);
    
    // Periodic check timer
    checkTimer = setInterval(checkSession, CHECK_INTERVAL);
  }

  function resetTimers() {
    warningShown = false;
    startTimers();
  }

  function clearTimers() {
    if (warningTimer) clearTimeout(warningTimer);
    if (timeoutTimer) clearTimeout(timeoutTimer);
    if (checkTimer) clearInterval(checkTimer);
  }

  function checkSession() {
    const elapsed = Date.now() - lastActivity;
    
    if (elapsed >= SESSION_TIMEOUT) {
      handleTimeout();
    } else if (elapsed >= SESSION_TIMEOUT - WARNING_TIME && !warningShown) {
      showWarning();
    }
  }

  function createWarningModal() {
    if (document.getElementById('sessionWarningModal')) return;

    const modal = document.createElement('div');
    modal.id = 'sessionWarningModal';
    modal.className = 'session-modal-overlay';
    modal.innerHTML = `
      <div class="session-modal">
        <div class="session-modal-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </div>
        <h3 class="session-modal-title">Session Expiring Soon</h3>
        <p class="session-modal-message">Your session will expire in <span id="sessionCountdown">5:00</span> due to inactivity.</p>
        <div class="session-modal-actions">
          <button class="session-btn session-btn-primary" onclick="SessionManager.extendSession()">Stay Logged In</button>
          <button class="session-btn session-btn-secondary" onclick="SessionManager.logout()">Logout Now</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add styles
    addSessionStyles();
  }

  function addSessionStyles() {
    if (document.getElementById('sessionManagerStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'sessionManagerStyles';
    styles.textContent = `
      .session-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .session-modal-overlay.active {
        display: flex;
        opacity: 1;
      }
      .session-modal {
        background: var(--card-bg, #1e293b);
        border: 1px solid var(--border-color, #334155);
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      .session-modal-overlay.active .session-modal {
        transform: scale(1);
      }
      .session-modal-icon {
        color: #f59e0b;
        margin-bottom: 16px;
      }
      .session-modal-title {
        color: var(--text-primary, #f8fafc);
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      .session-modal-message {
        color: var(--text-secondary, #94a3b8);
        margin: 0 0 24px 0;
        font-size: 0.95rem;
      }
      #sessionCountdown {
        color: #f59e0b;
        font-weight: 600;
        font-family: monospace;
        font-size: 1.1em;
      }
      .session-modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      .session-btn {
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        font-size: 0.95rem;
      }
      .session-btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
      }
      .session-btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      .session-btn-secondary {
        background: transparent;
        color: var(--text-secondary, #94a3b8);
        border: 1px solid var(--border-color, #334155);
      }
      .session-btn-secondary:hover {
        background: var(--hover-bg, #334155);
        color: var(--text-primary, #f8fafc);
      }
    `;
    document.head.appendChild(styles);
  }

  let countdownInterval = null;

  function showWarning() {
    warningShown = true;
    const modal = document.getElementById('sessionWarningModal');
    if (modal) {
      modal.classList.add('active');
      startCountdown();
    }
  }

  function hideWarning() {
    const modal = document.getElementById('sessionWarningModal');
    if (modal) {
      modal.classList.remove('active');
    }
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function startCountdown() {
    let remaining = WARNING_TIME / 1000;
    const countdownEl = document.getElementById('sessionCountdown');
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    function updateCountdown() {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      if (countdownEl) {
        countdownEl.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      }
      remaining--;
      
      if (remaining < 0) {
        clearInterval(countdownInterval);
        handleTimeout();
      }
    }
    
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
  }

  function handleTimeout() {
    clearTimers();
    hideWarning();
    
    // Show timeout message
    showTimeoutMessage();
    
    // Clear session and redirect
    setTimeout(function() {
      if (onLogout) {
        onLogout();
      }
    }, 2000);
  }

  function showTimeoutMessage() {
    const modal = document.getElementById('sessionWarningModal');
    if (modal) {
      modal.querySelector('.session-modal').innerHTML = `
        <div class="session-modal-icon" style="color: #ef4444;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="session-modal-title">Session Expired</h3>
        <p class="session-modal-message">Your session has expired due to inactivity. You will be redirected to the login page.</p>
      `;
      modal.classList.add('active');
    }
  }

  function extendSession() {
    recordActivity();
    hideWarning();
    resetTimers();
  }

  function logout() {
    clearTimers();
    hideWarning();
    if (onLogout) {
      onLogout();
    }
  }

  function destroy() {
    clearTimers();
    activityEvents.forEach(function(event) {
      document.removeEventListener(event, recordActivity);
    });
    const modal = document.getElementById('sessionWarningModal');
    if (modal) modal.remove();
    const styles = document.getElementById('sessionManagerStyles');
    if (styles) styles.remove();
  }

  return {
    init: init,
    extendSession: extendSession,
    logout: logout,
    destroy: destroy,
    recordActivity: recordActivity
  };
})();

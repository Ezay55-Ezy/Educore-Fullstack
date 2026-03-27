/**
 * EduCore Notifications System
 * Handles in-app notifications, toast messages, and notification center
 */
const NotificationManager = (function() {
  const STORAGE_KEY = 'educore_notifications';
  const MAX_NOTIFICATIONS = 50;
  
  let notifications = [];
  let unreadCount = 0;
  let onNotificationClick = null;

  // Notification types with icons and colors
  const notificationTypes = {
    info: { icon: 'info-circle', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    success: { icon: 'check-circle', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    warning: { icon: 'alert-triangle', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    error: { icon: 'x-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    fee: { icon: 'credit-card', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
    grade: { icon: 'award', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    attendance: { icon: 'calendar', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
    announcement: { icon: 'megaphone', color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' }
  };

  const icons = {
    'info-circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
    'check-circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    'alert-triangle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    'x-circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    'credit-card': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
    'award': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>',
    'calendar': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    'megaphone': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l18-5v12L3 13v-2z"></path><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path></svg>',
    'bell': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
    'x': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
  };

  function init(clickCallback) {
    onNotificationClick = clickCallback;
    loadNotifications();
    createNotificationUI();
    updateBadge();
  }

  function loadNotifications() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        notifications = JSON.parse(saved);
        unreadCount = notifications.filter(function(n) { return !n.read; }).length;
      }
    } catch (e) {
      notifications = [];
      unreadCount = 0;
    }
  }

  function saveNotifications() {
    try {
      // Keep only the most recent notifications
      if (notifications.length > MAX_NOTIFICATIONS) {
        notifications = notifications.slice(-MAX_NOTIFICATIONS);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Could not save notifications:', e);
    }
  }

  function add(notification) {
    const newNotification = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      type: notification.type || 'info',
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toISOString(),
      read: false,
      data: notification.data || null
    };
    
    notifications.unshift(newNotification);
    unreadCount++;
    saveNotifications();
    updateBadge();
    
    // Show toast if enabled
    if (notification.showToast !== false) {
      showToast(newNotification);
    }
    
    return newNotification;
  }

  function markAsRead(notificationId) {
    const notification = notifications.find(function(n) { return n.id === notificationId; });
    if (notification && !notification.read) {
      notification.read = true;
      unreadCount = Math.max(0, unreadCount - 1);
      saveNotifications();
      updateBadge();
    }
  }

  function markAllAsRead() {
    notifications.forEach(function(n) { n.read = true; });
    unreadCount = 0;
    saveNotifications();
    updateBadge();
  }

  function remove(notificationId) {
    const index = notifications.findIndex(function(n) { return n.id === notificationId; });
    if (index > -1) {
      if (!notifications[index].read) {
        unreadCount = Math.max(0, unreadCount - 1);
      }
      notifications.splice(index, 1);
      saveNotifications();
      updateBadge();
      renderNotificationList();
    }
  }

  function clearAll() {
    notifications = [];
    unreadCount = 0;
    saveNotifications();
    updateBadge();
    renderNotificationList();
  }

  function createNotificationUI() {
    // Check if bell already exists in the DOM
    let bellContainer = document.getElementById('notificationBell');
    let hasExistingBell = !!bellContainer;

    if (!hasExistingBell) {
      // Create bell button if it doesn't exist
      bellContainer = document.createElement('div');
      bellContainer.id = 'notificationBell';
      bellContainer.className = 'notification-bell-container';
      bellContainer.innerHTML = `
        <button class="notification-bell" onclick="NotificationManager.togglePanel()" aria-label="Notifications">
          ${icons.bell}
          <span class="notification-badge" id="notificationBadge">0</span>
        </button>
      `;
      document.body.appendChild(bellContainer);
    } else {
      // Use existing bell, but ensure it has the correct onclick and badge ID
      const bellBtn = bellContainer.querySelector('.notification-bell') || bellContainer;
      bellBtn.onclick = NotificationManager.togglePanel;
      
      const badge = bellBtn.querySelector('.notification-badge');
      if (badge) badge.id = 'notificationBadge';
    }

    // Create notification panel if it doesn't exist
    let panel = document.getElementById('notificationPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'notificationPanel';
      panel.className = 'notification-panel';
      document.body.appendChild(panel);
    }
    
    panel.innerHTML = `
      <div class="notification-header">
        <h3>Notifications</h3>
        <div class="notification-actions">
          <button onclick="NotificationManager.markAllAsRead()" class="notification-action-btn" title="Mark all as read">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
          <button onclick="NotificationManager.clearAll()" class="notification-action-btn" title="Clear all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="notification-list" id="notificationList"></div>
    `;

    // Close panel when clicking outside
    document.addEventListener('click', function(e) {
      const panel = document.getElementById('notificationPanel');
      const bell = document.getElementById('notificationBell');
      if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
        panel.classList.remove('active');
      }
    });

    addNotificationStyles();
    renderNotificationList();
  }

  function togglePanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
      panel.classList.toggle('active');
      if (panel.classList.contains('active')) {
        renderNotificationList();
      }
    }
  }

  function renderNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="notification-empty">
          ${icons.bell}
          <p>No notifications yet</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifications.map(function(n) {
      const typeConfig = notificationTypes[n.type] || notificationTypes.info;
      const timeAgo = getTimeAgo(n.timestamp);
      
      return `
        <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" onclick="NotificationManager.handleClick('${n.id}')">
          <div class="notification-icon" style="background: ${typeConfig.bg}; color: ${typeConfig.color};">
            ${icons[typeConfig.icon]}
          </div>
          <div class="notification-content">
            <div class="notification-title">${escapeHtml(n.title)}</div>
            <div class="notification-message">${escapeHtml(n.message)}</div>
            <div class="notification-time">${timeAgo}</div>
          </div>
          <button class="notification-dismiss" onclick="event.stopPropagation(); NotificationManager.remove('${n.id}')" title="Dismiss">
            ${icons.x}
          </button>
        </div>
      `;
    }).join('');
  }

  function handleClick(notificationId) {
    const notification = notifications.find(function(n) { return n.id === notificationId; });
    if (notification) {
      markAsRead(notificationId);
      if (onNotificationClick) {
        onNotificationClick(notification);
      }
    }
  }

  function updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  // Toast notifications
  function showToast(notification) {
    const typeConfig = notificationTypes[notification.type] || notificationTypes.info;
    
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-icon" style="color: ${typeConfig.color};">
        ${icons[typeConfig.icon]}
      </div>
      <div class="toast-content">
        <div class="toast-title">${escapeHtml(notification.title)}</div>
        <div class="toast-message">${escapeHtml(notification.message)}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        ${icons.x}
      </button>
    `;
    
    // Get or create toast container
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(function() { toast.classList.add('show'); }, 10);
    
    // Auto remove after 5 seconds
    setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { toast.remove(); }, 300);
    }, 5000);
  }

  function getTimeAgo(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
    return date.toLocaleDateString();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function addNotificationStyles() {
    if (document.getElementById('notificationStyles')) return;

    const styles = document.createElement('style');
    styles.id = 'notificationStyles';
    styles.textContent = `
      .notification-bell-container {
        position: fixed;
        top: 24px;
        right: 80px;
        z-index: 1001;
      }
      .notification-bell {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--card-bg, #1e293b);
        border: 1px solid var(--border-color, #334155);
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .notification-bell:hover {
        background: var(--hover-bg, #334155);
        color: var(--text-primary, #f8fafc);
      }
      .notification-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 600;
        border-radius: 9px;
        display: none;
        align-items: center;
        justify-content: center;
      }
      .notification-panel {
        position: fixed;
        top: 80px;
        right: 24px;
        width: 380px;
        max-height: 500px;
        background: var(--card-bg, #1e293b);
        border: 1px solid var(--border-color, #334155);
        border-radius: 12px;
        box-shadow: 0 10px 40px var(--shadow-color, rgba(0,0,0,0.3));
        z-index: 1002;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }
      .notification-panel.active {
        display: flex;
      }
      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--border-color, #334155);
      }
      .notification-header h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary, #f8fafc);
      }
      .notification-actions {
        display: flex;
        gap: 8px;
      }
      .notification-action-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .notification-action-btn:hover {
        background: var(--hover-bg, #334155);
        color: var(--text-primary, #f8fafc);
      }
      .notification-list {
        flex: 1;
        overflow-y: auto;
        max-height: 400px;
      }
      .notification-empty {
        padding: 40px 20px;
        text-align: center;
        color: var(--text-muted, #64748b);
      }
      .notification-empty svg {
        opacity: 0.5;
        margin-bottom: 12px;
      }
      .notification-empty p {
        margin: 0;
        font-size: 0.9rem;
      }
      .notification-item {
        display: flex;
        gap: 12px;
        padding: 14px 20px;
        border-bottom: 1px solid var(--border-color, #334155);
        cursor: pointer;
        transition: background 0.2s ease;
        position: relative;
      }
      .notification-item:hover {
        background: var(--hover-bg, #334155);
      }
      .notification-item.unread {
        background: rgba(59, 130, 246, 0.05);
      }
      .notification-item.unread::before {
        content: '';
        position: absolute;
        left: 8px;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background: #3b82f6;
        border-radius: 50%;
      }
      .notification-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .notification-content {
        flex: 1;
        min-width: 0;
      }
      .notification-title {
        font-weight: 500;
        color: var(--text-primary, #f8fafc);
        font-size: 0.9rem;
        margin-bottom: 2px;
      }
      .notification-message {
        color: var(--text-secondary, #94a3b8);
        font-size: 0.85rem;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .notification-time {
        color: var(--text-muted, #64748b);
        font-size: 0.75rem;
        margin-top: 4px;
      }
      .notification-dismiss {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: transparent;
        border: none;
        color: var(--text-muted, #64748b);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s ease;
      }
      .notification-item:hover .notification-dismiss {
        opacity: 1;
      }
      .notification-dismiss:hover {
        background: var(--bg-tertiary, #334155);
        color: var(--text-primary, #f8fafc);
      }
      
      /* Toast notifications */
      .toast-container {
        position: fixed;
        top: 24px;
        right: 140px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .notification-toast {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        padding: 14px 16px;
        background: var(--card-bg, #1e293b);
        border: 1px solid var(--border-color, #334155);
        border-radius: 10px;
        box-shadow: 0 10px 30px var(--shadow-color, rgba(0,0,0,0.3));
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(120%);
        opacity: 0;
        transition: all 0.3s ease;
      }
      .notification-toast.show {
        transform: translateX(0);
        opacity: 1;
      }
      .toast-icon {
        flex-shrink: 0;
      }
      .toast-content {
        flex: 1;
        min-width: 0;
      }
      .toast-title {
        font-weight: 500;
        color: var(--text-primary, #f8fafc);
        font-size: 0.9rem;
        margin-bottom: 2px;
      }
      .toast-message {
        color: var(--text-secondary, #94a3b8);
        font-size: 0.85rem;
        line-height: 1.4;
      }
      .toast-close {
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        background: transparent;
        border: none;
        color: var(--text-muted, #64748b);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      .toast-close:hover {
        background: var(--hover-bg, #334155);
        color: var(--text-primary, #f8fafc);
      }
      
      @media (max-width: 768px) {
        .notification-bell-container {
          right: 70px;
        }
        .notification-panel {
          right: 12px;
          width: calc(100vw - 24px);
          max-width: 380px;
        }
        .toast-container {
          right: 12px;
          left: 12px;
        }
        .notification-toast {
          min-width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  function getAll() {
    return notifications;
  }

  function getUnreadCount() {
    return unreadCount;
  }

  return {
    init: init,
    add: add,
    remove: remove,
    markAsRead: markAsRead,
    markAllAsRead: markAllAsRead,
    clearAll: clearAll,
    togglePanel: togglePanel,
    handleClick: handleClick,
    showToast: showToast,
    getAll: getAll,
    getUnreadCount: getUnreadCount
  };
})();

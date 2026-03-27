/**
 * EduCore Utility Functions
 * Common helper functions for form validation, error handling, accessibility, etc.
 */
const EduCoreUtils = (function() {
  
  // ══════════════════════════════════════════════════════════════
  // FORM VALIDATION
  // ══════════════════════════════════════════════════════════════
  
  const validators = {
    email: function(value) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(value);
    },
    phone: function(value) {
      const re = /^[\+]?[0-9]{10,15}$/;
      return re.test(value.replace(/[\s\-\(\)]/g, ''));
    },
    required: function(value) {
      return value !== null && value !== undefined && value.toString().trim() !== '';
    },
    minLength: function(value, min) {
      return value && value.length >= min;
    },
    maxLength: function(value, max) {
      return !value || value.length <= max;
    },
    password: function(value) {
      // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
      return value && value.length >= 8;
    },
    match: function(value1, value2) {
      return value1 === value2;
    },
    numeric: function(value) {
      return !isNaN(value) && !isNaN(parseFloat(value));
    }
  };

  function validateForm(formData, rules) {
    const errors = {};
    
    Object.keys(rules).forEach(function(field) {
      const fieldRules = rules[field];
      const value = formData[field];
      
      fieldRules.forEach(function(rule) {
        if (errors[field]) return; // Stop at first error
        
        if (typeof rule === 'string') {
          if (rule === 'required' && !validators.required(value)) {
            errors[field] = 'This field is required';
          } else if (rule === 'email' && value && !validators.email(value)) {
            errors[field] = 'Please enter a valid email address';
          } else if (rule === 'phone' && value && !validators.phone(value)) {
            errors[field] = 'Please enter a valid phone number';
          } else if (rule === 'password' && !validators.password(value)) {
            errors[field] = 'Password must be at least 8 characters';
          }
        } else if (typeof rule === 'object') {
          if (rule.type === 'minLength' && !validators.minLength(value, rule.value)) {
            errors[field] = rule.message || 'Minimum ' + rule.value + ' characters required';
          } else if (rule.type === 'maxLength' && !validators.maxLength(value, rule.value)) {
            errors[field] = rule.message || 'Maximum ' + rule.value + ' characters allowed';
          } else if (rule.type === 'match' && !validators.match(value, formData[rule.field])) {
            errors[field] = rule.message || 'Values do not match';
          } else if (rule.type === 'custom' && typeof rule.validator === 'function') {
            const result = rule.validator(value, formData);
            if (result !== true) {
              errors[field] = result || rule.message || 'Invalid value';
            }
          }
        }
      });
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  function showFieldError(input, message) {
    clearFieldError(input);
    
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
    
    const errorId = input.id + '-error';
    const errorEl = document.createElement('div');
    errorEl.id = errorId;
    errorEl.className = 'field-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = message;
    
    input.setAttribute('aria-describedby', errorId);
    input.parentNode.insertBefore(errorEl, input.nextSibling);
  }

  function clearFieldError(input) {
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    
    const errorEl = document.getElementById(input.id + '-error');
    if (errorEl) errorEl.remove();
  }

  function clearAllErrors(form) {
    form.querySelectorAll('.input-error').forEach(function(input) {
      clearFieldError(input);
    });
  }

  // ══════════════════════════════════════════════════════════════
  // API / FETCH HELPERS
  // ══════════════════════════════════════════════════════════════
  
  function apiRequest(url, options) {
    options = options || {};
    const timeout = options.timeout || 30000;
    
    return new Promise(function(resolve, reject) {
      const controller = new AbortController();
      const timeoutId = setTimeout(function() {
        controller.abort();
        reject(new Error('Request timeout'));
      }, timeout);
      
      fetch(url, Object.assign({}, options, { signal: controller.signal }))
        .then(function(response) {
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          return response.json();
        })
        .then(resolve)
        .catch(function(err) {
          clearTimeout(timeoutId);
          reject(err);
        });
    });
  }

  function retryRequest(fn, maxRetries, delay) {
    maxRetries = maxRetries || 3;
    delay = delay || 1000;
    
    return new Promise(function(resolve, reject) {
      let attempts = 0;
      
      function attempt() {
        fn()
          .then(resolve)
          .catch(function(err) {
            attempts++;
            if (attempts >= maxRetries) {
              reject(err);
            } else {
              setTimeout(attempt, delay * attempts);
            }
          });
      }
      
      attempt();
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ERROR HANDLING UI
  // ══════════════════════════════════════════════════════════════
  
  function showErrorWithRetry(container, message, retryCallback) {
    const errorHtml = `
      <div class="error-state">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="error-title">Something went wrong</h3>
        <p class="error-message">${escapeHtml(message)}</p>
        <button class="error-retry-btn" onclick="this.parentElement.remove();">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Try Again
        </button>
      </div>
    `;
    
    container.innerHTML = errorHtml;
    
    if (retryCallback) {
      container.querySelector('.error-retry-btn').onclick = function() {
        container.innerHTML = '<div class="loading-spinner"></div>';
        retryCallback();
      };
    }
  }

  function showEmptyState(container, message, icon) {
    icon = icon || 'inbox';
    const icons = {
      inbox: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
      search: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      calendar: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'
    };
    
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icons[icon] || icons.inbox}</div>
        <p class="empty-message">${escapeHtml(message)}</p>
      </div>
    `;
  }

  // ══════════════════════════════════════════════════════════════
  // SEARCH / FILTER
  // ══════════════════════════════════════════════════════════════
  
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function filterArray(arr, searchTerm, fields) {
    if (!searchTerm) return arr;
    
    const term = searchTerm.toLowerCase();
    return arr.filter(function(item) {
      return fields.some(function(field) {
        const value = getNestedValue(item, field);
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  }

  function getNestedValue(obj, path) {
    return path.split('.').reduce(function(o, k) {
      return o && o[k];
    }, obj);
  }

  function sortArray(arr, field, direction) {
    direction = direction || 'asc';
    return arr.slice().sort(function(a, b) {
      const aVal = getNestedValue(a, field);
      const bVal = getNestedValue(b, field);
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // ACCESSIBILITY
  // ══════════════════════════════════════════════════════════════
  
  function setupKeyboardNav(container, itemSelector, onSelect) {
    let currentIndex = -1;
    const items = function() { return container.querySelectorAll(itemSelector); };
    
    container.addEventListener('keydown', function(e) {
      const allItems = items();
      if (!allItems.length) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentIndex = Math.min(currentIndex + 1, allItems.length - 1);
        allItems[currentIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentIndex = Math.max(currentIndex - 1, 0);
        allItems[currentIndex].focus();
      } else if (e.key === 'Enter' && currentIndex >= 0) {
        e.preventDefault();
        if (onSelect) onSelect(allItems[currentIndex], currentIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        currentIndex = 0;
        allItems[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        currentIndex = allItems.length - 1;
        allItems[currentIndex].focus();
      }
    });
  }

  function announceToScreenReader(message) {
    let announcer = document.getElementById('sr-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
    }
    announcer.textContent = message;
  }

  function trapFocus(element) {
    const focusableEls = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableEls[0];
    const lastFocusable = focusableEls[focusableEls.length - 1];
    
    element.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    });
  }

  // ══════════════════════════════════════════════════════════════
  // UTILITY HELPERS
  // ══════════════════════════════════════════════════════════════
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  function formatRelativeTime(date) {
    const now = new Date();
    const d = new Date(date);
    const seconds = Math.floor((now - d) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hr ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return d.toLocaleDateString();
  }

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    } finally {
      textarea.remove();
    }
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add utility styles
  function addUtilityStyles() {
    if (document.getElementById('utilityStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'utilityStyles';
    styles.textContent = `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .input-error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
      }
      .field-error {
        color: #ef4444;
        font-size: 0.8rem;
        margin-top: 4px;
      }
      .error-state, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px 20px;
        text-align: center;
      }
      .error-icon, .empty-icon {
        color: var(--text-muted, #64748b);
        opacity: 0.5;
        margin-bottom: 16px;
      }
      .error-title {
        color: var(--text-primary, #f8fafc);
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      .error-message, .empty-message {
        color: var(--text-secondary, #94a3b8);
        font-size: 0.9rem;
        margin: 0 0 20px 0;
        max-width: 300px;
      }
      .error-retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: var(--card-bg, #1e293b);
        border: 1px solid var(--border-color, #334155);
        border-radius: 8px;
        color: var(--text-primary, #f8fafc);
        font-size: 0.9rem;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .error-retry-btn:hover {
        background: var(--hover-bg, #334155);
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color, #334155);
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 40px auto;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styles);
  }

  // Initialize styles on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addUtilityStyles);
  } else {
    addUtilityStyles();
  }

  return {
    // Validation
    validateForm: validateForm,
    validators: validators,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    clearAllErrors: clearAllErrors,
    
    // API
    apiRequest: apiRequest,
    retryRequest: retryRequest,
    
    // Error UI
    showErrorWithRetry: showErrorWithRetry,
    showEmptyState: showEmptyState,
    
    // Search/Filter
    debounce: debounce,
    filterArray: filterArray,
    sortArray: sortArray,
    
    // Accessibility
    setupKeyboardNav: setupKeyboardNav,
    announceToScreenReader: announceToScreenReader,
    trapFocus: trapFocus,
    
    // Utilities
    escapeHtml: escapeHtml,
    formatRelativeTime: formatRelativeTime,
    copyToClipboard: copyToClipboard,
    generateId: generateId
  };
})();

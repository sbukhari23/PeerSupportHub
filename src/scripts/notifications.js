/**
 * Notification Service
 * Week 6: DOM Manipulation and Events + Week 8: Client-Side Storage
 * Following MIT 6.102 principles: Abstract Data Types, User Interface Design
 */

class NotificationService {
  constructor() {
    this.container = null;
    this.notifications = [];
    this.maxNotifications = 5;
    this.defaultDuration = 5000; // 5 seconds
    this.init();
  }

  /**
   * Initialize notification service
   * @private
   */
  init() {
    // Create notification container if it doesn't exist
    this.createContainer();
    
    // Request permission for browser notifications
    this.requestPermission();
    
    // Load notification preferences
    this.loadPreferences();
  }

  /**
   * Create notification container in DOM
   * @private
   */
  createContainer() {
    // Check if container already exists
    this.container = document.getElementById('notification-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Notifications');
      
      // Add CSS styles
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        pointer-events: none;
      `;
      
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {Object} options - Notification options
   */
  showSuccess(message, options = {}) {
    this.show(message, {
      type: 'success',
      icon: '✅',
      ...options
    });
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {Object} options - Notification options
   */
  showError(message, options = {}) {
    this.show(message, {
      type: 'error',
      icon: '❌',
      duration: 8000, // Longer duration for errors
      ...options
    });
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {Object} options - Notification options
   */
  showWarning(message, options = {}) {
    this.show(message, {
      type: 'warning',
      icon: '⚠️',
      ...options
    });
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {Object} options - Notification options
   */
  showInfo(message, options = {}) {
    this.show(message, {
      type: 'info',
      icon: 'ℹ️',
      ...options
    });
  }

  /**
   * Show custom notification
   * @param {string} message - Notification message
   * @param {Object} options - Notification options
   */
  show(message, options = {}) {
    const notification = {
      id: window.PeerSupportApp?.Utils?.generateId() || Date.now().toString(),
      message: message,
      type: options.type || 'info',
      icon: options.icon || 'ℹ️',
      duration: options.duration ?? this.defaultDuration,
      persistent: options.persistent || false,
      actions: options.actions || [],
      createdAt: Date.now()
    };

    // Add to notifications array
    this.notifications.push(notification);

    // Remove oldest notifications if limit exceeded
    while (this.notifications.length > this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.removeFromDOM(oldest.id);
    }

    // Create and show DOM element
    this.createNotificationElement(notification);

    // Auto-remove after duration (unless persistent)
    if (!notification.persistent && notification.duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }

    // Show browser notification if enabled
    if (options.browserNotification && this.canShowBrowserNotifications()) {
      this.showBrowserNotification(message, options);
    }

    return notification.id;
  }

  /**
   * Create notification DOM element
   * @private
   * @param {Object} notification - Notification object
   */
  createNotificationElement(notification) {
    const element = document.createElement('div');
    element.id = `notification-${notification.id}`;
    element.className = `notification notification--${notification.type}`;
    element.setAttribute('role', 'alert');
    element.style.cssText = `
      background: ${this.getBackgroundColor(notification.type)};
      color: ${this.getTextColor(notification.type)};
      border: 1px solid ${this.getBorderColor(notification.type)};
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      animation: slideIn 0.3s ease-out;
      max-width: 100%;
      word-wrap: break-word;
    `;

    // Create notification content
    const content = this.createNotificationContent(notification);
    element.appendChild(content);

    // Add click-to-dismiss functionality
    element.addEventListener('click', () => {
      this.remove(notification.id);
    });

    // Add to container with animation
    this.container.appendChild(element);

    // Trigger reflow to enable animation
    element.offsetHeight;
  }

  /**
   * Create notification content
   * @private
   * @param {Object} notification - Notification object
   * @returns {HTMLElement} Content element
   */
  createNotificationContent(notification) {
    const content = document.createElement('div');
    content.style.cssText = 'display: flex; align-items: flex-start; gap: 12px;';

    // Icon
    const icon = document.createElement('span');
    icon.textContent = notification.icon;
    icon.style.cssText = 'font-size: 16px; flex-shrink: 0; margin-top: 2px;';
    content.appendChild(icon);

    // Message area
    const messageArea = document.createElement('div');
    messageArea.style.cssText = 'flex: 1; min-width: 0;';

    // Message text
    const message = document.createElement('div');
    message.textContent = notification.message;
    message.style.cssText = 'font-weight: 500; margin-bottom: 4px; line-height: 1.4;';
    messageArea.appendChild(message);

    // Actions
    if (notification.actions && notification.actions.length > 0) {
      const actionsContainer = document.createElement('div');
      actionsContainer.style.cssText = 'margin-top: 8px; display: flex; gap: 8px;';

      notification.actions.forEach(action => {
        const button = document.createElement('button');
        button.textContent = action.text;
        button.style.cssText = `
          background: transparent;
          border: 1px solid currentColor;
          color: inherit;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          opacity: 0.8;
        `;
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          if (action.handler) {
            action.handler();
          }
          if (action.dismisses !== false) {
            this.remove(notification.id);
          }
        });
        actionsContainer.appendChild(button);
      });

      messageArea.appendChild(actionsContainer);
    }

    content.appendChild(messageArea);

    // Close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
      background: none;
      border: none;
      color: inherit;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.7;
      flex-shrink: 0;
    `;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.remove(notification.id);
    });
    content.appendChild(closeButton);

    return content;
  }

  /**
   * Remove notification
   * @param {string} id - Notification ID
   */
  remove(id) {
    // Remove from array
    this.notifications = this.notifications.filter(n => n.id !== id);
    
    // Remove from DOM with animation
    this.removeFromDOM(id);
  }

  /**
   * Remove notification from DOM
   * @private
   * @param {string} id - Notification ID
   */
  removeFromDOM(id) {
    const element = document.getElementById(`notification-${id}`);
    if (element) {
      element.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, 300);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    this.notifications.forEach(notification => {
      this.removeFromDOM(notification.id);
    });
    this.notifications = [];
  }

  /**
   * Request browser notification permission
   * @private
   */
  async requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn('Could not request notification permission:', error);
      }
    }
  }

  /**
   * Check if browser notifications can be shown
   * @private
   * @returns {boolean} Whether browser notifications are available
   */
  canShowBrowserNotifications() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Show browser notification
   * @private
   * @param {string} message - Notification message
   * @param {Object} options - Notification options
   */
  showBrowserNotification(message, options = {}) {
    if (!this.canShowBrowserNotifications()) return;

    const notification = new Notification(options.title || 'PeerSupportHub', {
      body: message,
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || 'psh-notification',
      requireInteraction: options.requireInteraction || false
    });

    // Auto-close after duration
    if (options.duration > 0) {
      setTimeout(() => {
        notification.close();
      }, options.duration);
    }

    // Handle click
    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
      if (options.onClick) {
        options.onClick();
      }
    });
  }

  /**
   * Get background color for notification type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Background color
   */
  getBackgroundColor(type) {
    const colors = {
      success: '#d4edda',
      error: '#f8d7da',
      warning: '#fff3cd',
      info: '#d1ecf1'
    };
    return colors[type] || colors.info;
  }

  /**
   * Get text color for notification type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Text color
   */
  getTextColor(type) {
    const colors = {
      success: '#155724',
      error: '#721c24',
      warning: '#856404',
      info: '#0c5460'
    };
    return colors[type] || colors.info;
  }

  /**
   * Get border color for notification type
   * @private
   * @param {string} type - Notification type
   * @returns {string} Border color
   */
  getBorderColor(type) {
    const colors = {
      success: '#c3e6cb',
      error: '#f5c6cb',
      warning: '#ffeaa7',
      info: '#bee5eb'
    };
    return colors[type] || colors.info;
  }

  /**
   * Load notification preferences
   * @private
   */
  loadPreferences() {
    try {
      const prefs = localStorage.getItem('psh_notification_preferences');
      if (prefs) {
        this.preferences = JSON.parse(prefs);
      } else {
        this.preferences = {
          enabled: true,
          browserNotifications: false,
          sound: false,
          types: {
            success: true,
            error: true,
            warning: true,
            info: true
          }
        };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      this.preferences = {};
    }
  }

  /**
   * Save notification preferences
   * @param {Object} preferences - Notification preferences
   */
  savePreferences(preferences) {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      localStorage.setItem('psh_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  /**
   * Add CSS animations
   * @private
   */
  static addStyles() {
    if (document.getElementById('notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .notification:hover {
        transform: scale(1.02);
        transition: transform 0.2s ease;
      }
    `;
    document.head.appendChild(style);
  }
}

// Add styles when class is loaded
NotificationService.addStyles();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}

// Make available globally
window.NotificationService = NotificationService;
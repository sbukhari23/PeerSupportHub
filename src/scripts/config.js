/**
 * Core Application Configuration
 * Following MIT 6.102 principles: Clear specifications, defensive programming
 */

// Application Constants (Week 5: JavaScript Fundamentals)
const APP_CONFIG = {
  name: 'PeerSupportHub',
  version: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  
  // API Configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000/api',
    timeout: 10000,
    retryAttempts: 3
  },
  
  // Authentication Settings
  auth: {
    tokenKey: 'psh_auth_token',
    refreshKey: 'psh_refresh_token',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    rememberMeTimeout: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  
  // Local Storage Keys (Week 8: Client-Side Storage)
  storage: {
    userProfile: 'psh_user_profile',
    habits: 'psh_habits',
    preferences: 'psh_preferences',
    tempData: 'psh_temp_data'
  },
  
  // UI Configuration (Mobile-First Design)
  ui: {
    breakpoints: {
      mobile: 320,
      tablet: 768,
      desktop: 1024,
      large: 1200
    },
    touchTargetSize: 44, // Minimum touch target (iOS guidelines)
    maxContentWidth: 1200
  },
  
  // Feature Flags
  features: {
    offlineMode: true,
    pushNotifications: true,
    screenTimeTracking: true,
    peerMatching: true,
    mentorAccess: true
  }
};

// Application State Management (Week 6: Advanced Concepts)
const AppState = {
  // Current state
  _state: {
    user: null,
    isAuthenticated: false,
    currentPage: 'landing',
    loading: false,
    error: null,
    notifications: []
  },
  
  // Observers (Observer Pattern from MIT 6.102)
  _observers: [],
  
  // Subscribe to state changes
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this._observers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this._observers.indexOf(callback);
      if (index > -1) {
        this._observers.splice(index, 1);
      }
    };
  },
  
  // Update state and notify observers
  setState(updates) {
    const prevState = { ...this._state };
    this._state = { ...this._state, ...updates };
    
    // Notify all observers
    this._observers.forEach(callback => {
      try {
        callback(this._state, prevState);
      } catch (error) {
        console.error('State observer error:', error);
      }
    });
  },
  
  // Get current state (immutable copy)
  getState() {
    return { ...this._state };
  }
};

// Utility Functions (Week 5: JavaScript Fundamentals)
const Utils = {
  // Validation helpers
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isValidPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  },
  
  // Date helpers
  formatDate(date, format = 'short') {
    const d = new Date(date);
    if (format === 'short') {
      return d.toLocaleDateString();
    } else if (format === 'long') {
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    return d.toISOString();
  },
  
  // Debounce function for performance
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Deep clone object
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const copy = {};
      Object.keys(obj).forEach(key => {
        copy[key] = this.deepClone(obj[key]);
      });
      return copy;
    }
  },
  
  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
  
  // Sanitize HTML to prevent XSS
  sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
  
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Error Handling (MIT 6.102: Defensive Programming)
class AppError extends Error {
  constructor(message, code = 'GENERIC_ERROR', statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Log to external service in production
  if (APP_CONFIG.environment === 'production') {
    // Send to error tracking service
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent default browser behavior
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APP_CONFIG,
    AppState,
    Utils,
    AppError
  };
}

// Global namespace for browser usage
window.PeerSupportApp = {
  APP_CONFIG,
  AppState,
  Utils,
  AppError
};
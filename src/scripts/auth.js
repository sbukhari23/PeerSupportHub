/**
 * Authentication Service
 * User Authentication System
 * Following MIT 6.102 Specifications and Abstract Data Types principles
 * Week 5-8: JavaScript Fundamentals, Client-Side Storage, Fetch API
 * 
 * Abstraction Function:
 *   AF(authService) = An authentication system that manages user login/logout,
 *   registration, and session management with secure token handling
 * 
 * Representation Invariant:
 *   - currentUser is null when no user is logged in
 *   - authToken is null when no user is authenticated
 *   - authToken expires after sessionTimeout minutes
 *   - only one user can be authenticated at a time
 */

export class AuthService {
  constructor(apiBaseUrl) {
    this.currentUser = null;
    this.authToken = null;
    this.sessionTimeout = 24 * 60; // 24 hours in minutes
    this.apiBaseUrl = apiBaseUrl || '/api/auth';
    this.sessionTimeoutId = null;
    
    this.loadStoredAuth();
  }

  /**
   * Authenticates a user with email and password
   * @param {Object} credentials - login credentials
   * @returns {Promise<Object>} authentication response
   */
  async login(credentials) {
    if (!this.isValidEmail(credentials.email)) {
      return { success: false, message: 'Invalid email format' };
    }

    if (credentials.password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const result = await response.json();

      if (result.success && result.user && result.token) {
        this.currentUser = result.user;
        this.authToken = result.token;
        
        if (credentials.rememberMe) {
          this.storeAuth();
        }
        
        this.startSessionTimeout();
      }

      return result;
    } catch (error) {
      return { success: false, message: 'Network error during login' };
    }
  }

  /**
   * Registers a new user account
   * @param {Object} registerData - registration information
   * @returns {Promise<Object>} registration response
   */
  async register(registerData) {
    if (!this.isValidEmail(registerData.email)) {
      return { success: false, message: 'Invalid email format' };
    }

    if (registerData.username.length < 3 || registerData.username.length > 20) {
      return { success: false, message: 'Username must be between 3 and 20 characters' };
    }

    if (registerData.password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    if (!registerData.agreeToTerms) {
      return { success: false, message: 'You must agree to the terms of service' };
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });

      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error during registration' };
    }
  }

  /**
   * Logs out the current user
   */
  async logout() {
    if (this.authToken) {
      try {
        await fetch(`${this.apiBaseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.warn('Error during logout:', error);
      }
    }

    this.currentUser = null;
    this.authToken = null;
    this.clearStoredAuth();
    this.clearSessionTimeout();
  }

  /**
   * Checks if a user is currently authenticated
   * @returns {boolean} true if user is logged in
   */
  isAuthenticated() {
    return this.currentUser !== null && this.authToken !== null;
  }

  /**
   * Gets the current authenticated user
   * @returns {Object|null} current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Gets the current authentication token
   * @returns {string|null} auth token
   */
  getAuthToken() {
    return this.authToken;
  }

  /**
   * Refreshes the authentication token
   * @returns {Promise<boolean>} success status
   */
  async refreshToken() {
    if (!this.authToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.token) {
          this.authToken = result.token;
          this.storeAuth();
          return true;
        }
      }
    } catch (error) {
      console.warn('Error refreshing token:', error);
    }

    await this.logout();
    return false;
  }

  // Private helper methods

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  storeAuth() {
    if (this.currentUser && this.authToken) {
      localStorage.setItem('psh_user', JSON.stringify(this.currentUser));
      localStorage.setItem('psh_token', this.authToken);
      localStorage.setItem('psh_expires', 
        (Date.now() + this.sessionTimeout * 60 * 1000).toString()
      );
    }
  }

  loadStoredAuth() {
    try {
      const storedUser = localStorage.getItem('psh_user');
      const storedToken = localStorage.getItem('psh_token');
      const storedExpires = localStorage.getItem('psh_expires');

      if (storedUser && storedToken && storedExpires) {
        const expirationTime = parseInt(storedExpires);
        
        if (Date.now() < expirationTime) {
          this.currentUser = JSON.parse(storedUser);
          this.authToken = storedToken;
          this.startSessionTimeout();
        } else {
          this.clearStoredAuth();
        }
      }
    } catch (error) {
      console.warn('Error loading stored auth:', error);
      this.clearStoredAuth();
    }
  }

  clearStoredAuth() {
    localStorage.removeItem('psh_user');
    localStorage.removeItem('psh_token');
    localStorage.removeItem('psh_expires');
  }

  startSessionTimeout() {
    this.clearSessionTimeout();
    
    this.sessionTimeoutId = window.setTimeout(async () => {
      await this.logout();
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
    }, this.sessionTimeout * 60 * 1000);
  }

  clearSessionTimeout() {
    if (this.sessionTimeoutId) {
      clearTimeout(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AuthService };
}

// Make available globally for browser usage
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}

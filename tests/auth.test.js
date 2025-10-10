/**
 * Authentication Service Tests
 * Following MIT 6.102 testing principles - JavaScript implementation
 * Week 5-8 curriculum progression: JavaScript → Client-Side Storage & Fetch API
 */

// Import the AuthService (for Node.js environment)
const AuthService = require('../src/scripts/auth');

// Mock global objects for testing environment
global.window = {
  PeerSupportApp: {
    Utils: {
      isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      isValidPassword: (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
    },
    AppState: {
      setState: jest.fn()
    }
  }
};

global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};

global.fetch = jest.fn();

describe('AuthService', () => {
  let authService;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh instance
    authService = new AuthService();
    
    // Reset localStorage/sessionStorage mocks
    global.localStorage.getItem.mockReturnValue(null);
    global.sessionStorage.getItem.mockReturnValue(null);
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      expect(authService).toBeDefined();
      expect(authService.baseUrl).toBe('http://localhost:5000/api');
      expect(authService.tokenKey).toBe('psh_auth_token');
      expect(authService.refreshKey).toBe('psh_refresh_token');
      expect(authService.userKey).toBe('psh_user_profile');
    });

    test('should use configured base URL from global config', () => {
      global.window.PeerSupportApp.APP_CONFIG = {
        api: { baseUrl: 'https://api.example.com' }
      };
      
      const service = new AuthService();
      expect(service.baseUrl).toBe('https://api.example.com');
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Password123',
      rememberMe: false
    };

    test('should successfully login with valid credentials', async () => {
      const mockResponse = {
        success: true,
        user: { id: '1', email: 'test@example.com', username: 'testuser' },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authService.login(
        validCredentials.email,
        validCredentials.password,
        validCredentials.rememberMe
      );

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.user);
      expect(result.token).toBe(mockResponse.token);

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: validCredentials.email,
            password: validCredentials.password,
            rememberMe: validCredentials.rememberMe
          })
        }
      );

      // Verify state update
      expect(global.window.PeerSupportApp.AppState.setState).toHaveBeenCalledWith({
        user: mockResponse.user,
        isAuthenticated: true,
        error: null
      });
    });

    test('should fail with invalid email format', async () => {
      const result = await authService.login('invalid-email', 'Password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fail with missing email', async () => {
      const result = await authService.login('', 'Password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fail with missing password', async () => {
      const result = await authService.login('test@example.com', '');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email and password are required');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should handle server error response', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' })
      });

      const result = await authService.login('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    test('should handle network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.login('test@example.com', 'Password123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('should store tokens in localStorage when rememberMe is true', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await authService.login('test@example.com', 'Password123', true);

      // Should store in localStorage when rememberMe is true
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'psh_auth_token',
        'mock-token'
      );
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'psh_user_profile',
        JSON.stringify(mockResponse.user)
      );
    });

    test('should store tokens in sessionStorage when rememberMe is false', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        token: 'mock-token',
        refreshToken: 'mock-refresh-token'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await authService.login('test@example.com', 'Password123', false);

      // Should store in sessionStorage when rememberMe is false
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'psh_auth_token',
        'mock-token'
      );
      expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
        'psh_user_profile',
        JSON.stringify(mockResponse.user)
      );
    });
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      username: 'testuser',
      fullName: 'Test User'
    };

    test('should successfully register with valid data', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', username: 'testuser' }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      // Mock successful login after registration
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: mockResponse.user,
          token: 'mock-token',
          refreshToken: 'mock-refresh-token'
        })
      });

      const result = await authService.register(validUserData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.user);

      // Verify registration API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: validUserData.email,
            password: validUserData.password,
            username: validUserData.username,
            fullName: validUserData.fullName,
            dateOfBirth: null
          })
        }
      );
    });

    test('should fail with invalid email format', async () => {
      const invalidData = { ...validUserData, email: 'invalid-email' };
      
      const result = await authService.register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fail with weak password', async () => {
      const invalidData = { ...validUserData, password: 'weak', confirmPassword: 'weak' };
      
      const result = await authService.register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters with uppercase, lowercase, and number');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fail with mismatched passwords', async () => {
      const invalidData = { ...validUserData, confirmPassword: 'Different123' };
      
      const result = await authService.register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passwords do not match');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fail with missing required fields', async () => {
      const invalidData = { ...validUserData, username: '' };
      
      const result = await authService.register(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('All fields are required');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('should successfully logout when authenticated', async () => {
      global.localStorage.getItem.mockReturnValue('mock-token');
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out successfully' })
      });

      const result = await authService.logout();

      expect(result.success).toBe(true);

      // Verify server logout call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/logout',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          }
        }
      );

      // Verify local storage cleanup
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('psh_auth_token');
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('psh_refresh_token');
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('psh_user_profile');

      // Verify state update
      expect(global.window.PeerSupportApp.AppState.setState).toHaveBeenCalledWith({
        user: null,
        isAuthenticated: false,
        error: null
      });
    });

    test('should cleanup local data even if server logout fails', async () => {
      global.localStorage.getItem.mockReturnValue('mock-token');
      
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await authService.logout();

      expect(result.success).toBe(true);

      // Verify local storage cleanup still happens
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('psh_auth_token');
      expect(global.sessionStorage.removeItem).toHaveBeenCalledWith('psh_auth_token');
    });
  });

  describe('isAuthenticated', () => {
    test('should return false when no token exists', () => {
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should return false when no user data exists', () => {
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'psh_auth_token') return 'mock-token';
        return null;
      });

      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should return false when token is expired', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.invalid';
      
      global.localStorage.getItem.mockImplementation((key) => {
        if (key === 'psh_auth_token') return expiredToken;
        if (key === 'psh_user_profile') return JSON.stringify({ id: '1' });
        return null;
      });

      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getToken', () => {
    test('should return token from localStorage', () => {
      global.localStorage.getItem.mockReturnValue('localStorage-token');
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.getToken()).toBe('localStorage-token');
    });

    test('should return token from sessionStorage when localStorage is empty', () => {
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue('sessionStorage-token');

      expect(authService.getToken()).toBe('sessionStorage-token');
    });

    test('should return null when no token exists', () => {
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    test('should return parsed user from localStorage', () => {
      const userData = { id: '1', email: 'test@example.com' };
      global.localStorage.getItem.mockReturnValue(JSON.stringify(userData));
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.getCurrentUser()).toEqual(userData);
    });

    test('should return parsed user from sessionStorage', () => {
      const userData = { id: '1', email: 'test@example.com' };
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue(JSON.stringify(userData));

      expect(authService.getCurrentUser()).toEqual(userData);
    });

    test('should return null when no user data exists', () => {
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.getCurrentUser()).toBeNull();
    });

    test('should return null when user data is invalid JSON', () => {
      global.localStorage.getItem.mockReturnValue('invalid-json');
      global.sessionStorage.getItem.mockReturnValue(null);

      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('updateProfile', () => {
    test('should successfully update profile when authenticated', async () => {
      global.localStorage.getItem.mockReturnValue('mock-token');
      
      const updatedUser = { id: '1', email: 'test@example.com', fullName: 'Updated Name' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: updatedUser })
      });

      const profileData = { fullName: 'Updated Name' };
      const result = await authService.updateProfile(profileData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(updatedUser);

      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/user/profile',
        {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(profileData)
        }
      );

      // Verify state update
      expect(global.window.PeerSupportApp.AppState.setState).toHaveBeenCalledWith({
        user: updatedUser
      });
    });

    test('should fail when not authenticated', async () => {
      global.localStorage.getItem.mockReturnValue(null);
      global.sessionStorage.getItem.mockReturnValue(null);

      const result = await authService.updateProfile({ fullName: 'New Name' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

import { AuthService } from '../scripts/auth';
import type { LoginCredentials, RegisterData, User } from '../types/index';

// Mock fetch for testing
global.fetch = jest.fn();

describe('AuthService', () => {
  let authService: AuthService;
  
  beforeEach(() => {
    authService = new AuthService('http://localhost:3000/api/auth');
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset fetch mock
    (fetch as jest.MockedFunction<typeof fetch>).mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Constructor and Initialization', () => {
    test('should initialize with default API URL', () => {
      const service = new AuthService();
      expect(service).toBeInstanceOf(AuthService);
    });

    test('should initialize with custom API URL', () => {
      const customUrl = 'https://api.example.com/auth';
      const service = new AuthService(customUrl);
      expect(service).toBeInstanceOf(AuthService);
    });

    test('should load stored authentication on initialization', () => {
      // Setup stored auth data
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        dateJoined: new Date(),
        isActive: true,
        userType: 'student',
        profile: {
          userId: '123',
          bio: '',
          goals: [],
          interests: [],
          timezone: 'UTC',
          preferredLanguage: 'en',
          privacySettings: {
            showEmail: false,
            showProgress: true,
            allowPeerMatching: true,
            allowMentorAccess: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      localStorage.setItem('psh_user', JSON.stringify(mockUser));
      localStorage.setItem('psh_token', 'valid-token');
      localStorage.setItem('psh_expires', (Date.now() + 86400000).toString());

      const service = new AuthService();
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });
  });

  describe('Login Functionality', () => {
    test('should login successfully with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      };

      const mockResponse = {
        success: true,
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User',
          dateJoined: new Date(),
          isActive: true,
          userType: 'student' as const,
          profile: {
            userId: '123',
            bio: '',
            goals: [],
            interests: [],
            timezone: 'UTC',
            preferredLanguage: 'en' as const,
            privacySettings: {
              showEmail: false,
              showProgress: true,
              allowPeerMatching: true,
              allowMentorAccess: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        },
        token: 'auth-token-123',
        message: 'Login successful'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.login(credentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockResponse.user);
      expect(result.token).toBe(mockResponse.token);
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockResponse.user);
    });

    test('should reject login with invalid email format', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password123',
        rememberMe: false
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email format');
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should reject login with short password', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '123',
        rememberMe: false
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters');
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should handle login failure from server', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
        rememberMe: false
      };

      const mockResponse = {
        success: false,
        message: 'Invalid credentials'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should handle network errors during login', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error during login');
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should store authentication when rememberMe is true', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true
      };

      const mockResponse = {
        success: true,
        user: {
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
          firstName: 'Test',
          lastName: 'User'
        },
        token: 'auth-token-123',
        message: 'Login successful'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await authService.login(credentials);

      expect(localStorage.getItem('psh_token')).toBe('auth-token-123');
      expect(localStorage.getItem('psh_user')).toBeTruthy();
    });
  });

  describe('Registration Functionality', () => {
    test('should register successfully with valid data', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        userType: 'student',
        agreeToTerms: true
      };

      const mockResponse = {
        success: true,
        message: 'Registration successful'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.register(registerData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
    });

    test('should reject registration with invalid email', async () => {
      const registerData: RegisterData = {
        email: 'invalid-email',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        userType: 'student',
        agreeToTerms: true
      };

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid email format');
    });

    test('should reject registration with short username', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        username: 'ab',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        userType: 'student',
        agreeToTerms: true
      };

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Username must be between 3 and 20 characters');
    });

    test('should reject registration with weak password', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: '123',
        userType: 'student',
        agreeToTerms: true
      };

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password must be at least 8 characters');
    });

    test('should reject registration without agreeing to terms', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        userType: 'student',
        agreeToTerms: false
      };

      const result = await authService.register(registerData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('You must agree to the terms of service');
    });
  });

  describe('Logout Functionality', () => {
    test('should logout successfully', async () => {
      // Setup authenticated state
      localStorage.setItem('psh_token', 'auth-token-123');
      localStorage.setItem('psh_user', JSON.stringify({ id: '123' }));

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('psh_token')).toBeNull();
      expect(localStorage.getItem('psh_user')).toBeNull();
    });

    test('should clear local state even if server logout fails', async () => {
      // Setup authenticated state
      localStorage.setItem('psh_token', 'auth-token-123');
      localStorage.setItem('psh_user', JSON.stringify({ id: '123' }));

      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('psh_token')).toBeNull();
    });
  });

  describe('Token Refresh Functionality', () => {
    test('should refresh token successfully', async () => {
      // Setup authenticated state with valid token
      const authService = new AuthService();
      
      // Mock the private authToken property through reflection
      (authService as any).authToken = 'old-token';

      const mockResponse = {
        token: 'new-token-456'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await authService.refreshToken();

      expect(result).toBe(true);
      expect(authService.getAuthToken()).toBe('new-token-456');
    });

    test('should logout user when token refresh fails', async () => {
      // Setup authenticated state
      const authService = new AuthService();
      (authService as any).authToken = 'invalid-token';

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response);

      const result = await authService.refreshToken();

      expect(result).toBe(false);
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should return false when no token exists', async () => {
      const result = await authService.refreshToken();
      expect(result).toBe(false);
    });
  });

  describe('Session Management', () => {
    test('should detect expired stored session', () => {
      // Setup expired session
      localStorage.setItem('psh_user', JSON.stringify({ id: '123' }));
      localStorage.setItem('psh_token', 'expired-token');
      localStorage.setItem('psh_expires', (Date.now() - 1000).toString());

      const service = new AuthService();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('psh_token')).toBeNull();
    });

    test('should maintain valid stored session', () => {
      // Setup valid session
      const mockUser = { id: '123', email: 'test@example.com' };
      localStorage.setItem('psh_user', JSON.stringify(mockUser));
      localStorage.setItem('psh_token', 'valid-token');
      localStorage.setItem('psh_expires', (Date.now() + 86400000).toString());

      const service = new AuthService();

      expect(service.isAuthenticated()).toBe(true);
      expect(service.getAuthToken()).toBe('valid-token');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle corrupted localStorage data', () => {
      localStorage.setItem('psh_user', 'invalid-json');
      localStorage.setItem('psh_token', 'some-token');

      const service = new AuthService();

      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem('psh_user')).toBeNull();
    });

    test('should handle missing localStorage support', () => {
      // Mock localStorage to throw errors
      const originalLocalStorage = global.localStorage;
      
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: jest.fn(() => { throw new Error('localStorage not available'); }),
          setItem: jest.fn(() => { throw new Error('localStorage not available'); }),
          removeItem: jest.fn(() => { throw new Error('localStorage not available'); })
        },
        writable: true
      });

      const service = new AuthService();
      expect(service.isAuthenticated()).toBe(false);

      // Restore localStorage
      global.localStorage = originalLocalStorage;
    });
  });

  describe('Authentication State Management', () => {
    test('getCurrentUser should return null when not authenticated', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    test('getAuthToken should return null when not authenticated', () => {
      expect(authService.getAuthToken()).toBeNull();
    });

    test('isAuthenticated should return false when not authenticated', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should maintain authentication state throughout service lifecycle', async () => {
      // Login first
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false
      };

      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser'
      };

      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          user: mockUser,
          token: 'auth-token-123'
        })
      } as Response);

      await authService.login(credentials);

      // Verify state is maintained
      expect(authService.isAuthenticated()).toBe(true);
      expect(authService.getCurrentUser()).toEqual(mockUser);
      expect(authService.getAuthToken()).toBe('auth-token-123');

      // Logout and verify state is cleared
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getAuthToken()).toBeNull();
    });
  });
});
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api', // Vite proxy will forward to http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      window.location.href = '/'; // Redirect to login
    }
    return Promise.reject(error);
  }
);

// User Authentication API
export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/users/register', {
      name: userData.fullName,
      email: userData.email,
      password: userData.password,
      username: userData.email.split('@')[0], // Generate username from email
    });
    
    // Store token and user data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  },

  // Login user
  login: async (email, password) => {
    const response = await api.post('/users/login', {
      email,
      password,
    });
    
    // Store token and user data
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data));
    
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
  },

  // Get current user
  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Habits API
export const habitsAPI = {
  // Get user habits
  getHabits: async () => {
    const response = await api.get('/habits');
    return response.data;
  },

  // Create new habit
  createHabit: async (habitData) => {
    const response = await api.post('/habits', habitData);
    return response.data;
  },
};

// Groups API
export const groupsAPI = {
  // Get user groups
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Create new group
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },
};

export default api;
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

// Handle token expiration (only for authenticated routes, not login/register)
// We store a callback to navigate without full page reload
let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle 401 if it's NOT a login or register attempt
    const isAuthRoute = error.config?.url?.includes('/users/login') || 
                        error.config?.url?.includes('/users/register');
    
    // Extract error message from various possible response formats
    // Backend may send: { msg: "..." }, { message: "..." }, { errors: [...] }, or plain text
    if (error.response?.data) {
      const data = error.response.data;
      // Handle validation errors array from express-validator
      if (data.errors && Array.isArray(data.errors)) {
        error.response.data.msg = data.errors.map(e => e.msg).join(', ');
        error.response.data.message = error.response.data.msg;
      }
      // Normalize error message field
      if (data.msg && !data.message) {
        error.response.data.message = data.msg;
      }
      if (data.message && !data.msg) {
        error.response.data.msg = data.message;
      }
    }
    
    // Don't auto-logout - just reject the promise
    // The token might still be valid, just the endpoint might not exist
    // Only clear token if it's definitely an auth failure on a protected route
    if (error.response?.status === 401 && !isAuthRoute) {
      // Check if the error message indicates token is actually invalid
      const errorMessage = error.response?.data?.message || '';
      const isTokenInvalid = errorMessage.toLowerCase().includes('token') ||
                             errorMessage.toLowerCase().includes('unauthorized') ||
                             errorMessage.toLowerCase().includes('expired');
      
      if (isTokenInvalid) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        if (logoutCallback) {
          logoutCallback('login');
        }
      }
      // Otherwise, just let the error propagate - endpoint might not exist
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
      username: userData.username, // Use username provided by user
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
  // Get all user habits
  getHabits: async () => {
    const response = await api.get('/habits');
    return response.data;
  },

  // Get all public habit templates
  getPublicTemplates: async () => {
    const response = await api.get('/habits/public');
    return response.data;
  },

  // Create new habit
  createHabit: async (habitData) => {
    const response = await api.post('/habits', habitData);
    return response.data;
  },

  // Update habit
  updateHabit: async (habitId, habitData) => {
    const response = await api.put(`/habits/${habitId}`, habitData);
    return response.data;
  },

  // Delete habit
  deleteHabit: async (habitId) => {
    const response = await api.delete(`/habits/${habitId}`);
    return response.data;
  },
};

// Groups API
export const groupsAPI = {
  // Get all public groups
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  // Get current user's groups
  getMyGroups: async () => {
    const response = await api.get('/groups/my');
    return response.data;
  },

  // Get single group details
  getGroup: async (groupId) => {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  },

  // Create new group
  createGroup: async (groupData) => {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  // Join a group
  joinGroup: async (groupId) => {
    const response = await api.post(`/groups/${groupId}/join`);
    return response.data;
  },

  // Leave a group
  leaveGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}/leave`);
    return response.data;
  },

  // Update group (moderators only)
  updateGroup: async (groupId, groupData) => {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data;
  },

  // Delete group (moderators only)
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/groups/${groupId}`);
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  // Get current user's profile
  getProfile: async () => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/profile', profileData);
    return response.data;
  },

  // Get user's overall stats
  getStats: async () => {
    const response = await api.get('/profile/stats');
    return response.data;
  },

  // Get another user's public profile
  getUserProfile: async (userId) => {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  },

  // Get all current user's buddies
  getBuddies: async () => {
    const response = await api.get('/profile/buddies');
    return response.data;
  },

  // Get specific buddy's public profile
  getBuddyProfile: async (userId) => {
    const response = await api.get(`/profile/buddy/${userId}`);
    return response.data;
  },

  // Get all pending buddy requests
  getBuddyRequests: async () => {
    const response = await api.get('/profile/buddy/requests');
    return response.data;
  },

  // Send a buddy request
  sendBuddyRequest: async (userId) => {
    const response = await api.post(`/profile/buddy/request/${userId}`);
    return response.data;
  },

  // Accept a buddy request
  acceptBuddyRequest: async (requestId) => {
    const response = await api.put(`/profile/buddy/accept/${requestId}`);
    return response.data;
  },

  // Reject a buddy request
  rejectBuddyRequest: async (requestId) => {
    const response = await api.put(`/profile/buddy/reject/${requestId}`);
    return response.data;
  },
};

// Habit Logs API
export const habitLogsAPI = {
  // Log a habit as completed today
  createLog: async (habitId, logData) => {
    const response = await api.post(`/logs/${habitId}`, logData);
    return response.data;
  },

  // Get all logs for a specific habit
  getHabitLogs: async (habitId) => {
    const response = await api.get(`/logs/user/${habitId}`);
    return response.data;
  },

  // Update a log (e.g., add reflection note)
  updateLog: async (logId, logData) => {
    const response = await api.put(`/logs/${logId}`, logData);
    return response.data;
  },

  // Delete a log (undo today's submission)
  deleteLog: async (logId) => {
    const response = await api.delete(`/logs/${logId}`);
    return response.data;
  },

  // Get current streak for a habit
  getStreak: async (habitId) => {
    const response = await api.get(`/logs/streak/${habitId}`);
    return response.data;
  },
};

// Messages API
export const messagesAPI = {
  // Send message to group (with optional images)
  sendGroupMessage: async (groupId, content, isAnonymous = false, images = []) => {
    const formData = new FormData();
    formData.append('content', content);
    formData.append('isAnonymous', isAnonymous);
    images.forEach((image) => formData.append('images', image));
    
    const response = await api.post(`/messages/${groupId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get group messages with pagination
  getGroupMessages: async (groupId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${groupId}`, { params: { page, limit } });
    return response.data;
  },

  // Edit own message (within 5 minutes)
  editMessage: async (messageId, content) => {
    const response = await api.put(`/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete message (sender or moderator)
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Add emoji reaction to message
  reactToMessage: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  // Flag message for moderation
  flagMessage: async (messageId) => {
    const response = await api.post(`/messages/${messageId}/flag`);
    return response.data;
  },

  // Send direct message to another user
  sendDirectMessage: async (userId, content, images = []) => {
    const formData = new FormData();
    formData.append('content', content);
    images.forEach((image) => formData.append('images', image));
    
    const response = await api.post(`/messages/direct/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Get direct message history with a specific user
  getDirectMessages: async (userId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/direct/${userId}`, { params: { page, limit } });
    return response.data;
  },

  // Get list of all conversations
  getConversations: async () => {
    const response = await api.get('/messages/conversations/list');
    return response.data;
  },

  // Delete direct message
  deleteDirectMessage: async (messageId) => {
    const response = await api.delete(`/messages/direct/${messageId}`);
    return response.data;
  },
};

export default api;
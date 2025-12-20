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

  // Get all of today's logs for the current user
  getTodayLogs: async () => {
    const response = await api.get('/logs/today');
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

// Notifications API
export const notificationsAPI = {
  // Get user notifications with pagination
  getNotifications: async (page = 1, limit = 20, unreadOnly = false) => {
    const response = await api.get('/notifications', { params: { page, limit, unreadOnly } });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete all read notifications
  deleteAllRead: async () => {
    const response = await api.delete('/notifications/read');
    return response.data;
  },
};

// Challenges API
export const challengesAPI = {
  // Get all active challenges
  getChallenges: async (params = {}) => {
    const response = await api.get('/challenges', { params });
    return response.data;
  },

  // Get trending challenges
  getTrending: async () => {
    const response = await api.get('/challenges/trending');
    return response.data;
  },

  // Get user's challenges
  getMyChallenges: async (status) => {
    const response = await api.get('/challenges/my', { params: { status } });
    return response.data;
  },

  // Get global leaderboard
  getGlobalLeaderboard: async (period = 'week') => {
    const response = await api.get('/challenges/leaderboard/global', { params: { period } });
    return response.data;
  },

  // Get challenge details
  getChallenge: async (challengeId) => {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data;
  },

  // Join challenge
  joinChallenge: async (challengeId) => {
    const response = await api.post(`/challenges/${challengeId}/join`);
    return response.data;
  },

  // Get challenge leaderboard
  getChallengeLeaderboard: async (challengeId) => {
    const response = await api.get(`/challenges/${challengeId}/leaderboard`);
    return response.data;
  },

  // Log progress
  logProgress: async (challengeId, progressData) => {
    const response = await api.post(`/challenges/${challengeId}/progress`, progressData);
    return response.data;
  },

  // Leave challenge
  leaveChallenge: async (challengeId) => {
    const response = await api.delete(`/challenges/${challengeId}/leave`);
    return response.data;
  },
};

// Reflections API
export const reflectionsAPI = {
  // Get user's reflections
  getReflections: async (params = {}) => {
    const response = await api.get('/reflections', { params });
    return response.data;
  },

  // Get reflection statistics
  getStats: async () => {
    const response = await api.get('/reflections/stats');
    return response.data;
  },

  // Get single reflection
  getReflection: async (reflectionId) => {
    const response = await api.get(`/reflections/${reflectionId}`);
    return response.data;
  },

  // Create reflection
  createReflection: async (reflectionData) => {
    const response = await api.post('/reflections', reflectionData);
    return response.data;
  },

  // Update reflection
  updateReflection: async (reflectionId, reflectionData) => {
    const response = await api.put(`/reflections/${reflectionId}`, reflectionData);
    return response.data;
  },

  // Delete reflection
  deleteReflection: async (reflectionId) => {
    const response = await api.delete(`/reflections/${reflectionId}`);
    return response.data;
  },
};

// Mentors API
export const mentorsAPI = {
  // Get all mentors
  getMentors: async (params = {}) => {
    const response = await api.get('/mentors', { params });
    return response.data;
  },

  // Get mentor profile
  getMentor: async (mentorId) => {
    const response = await api.get(`/mentors/${mentorId}`);
    return response.data;
  },

  // Create/update own mentor profile
  updateMentorProfile: async (profileData) => {
    const response = await api.post('/mentors/profile', profileData);
    return response.data;
  },

  // Get own mentor profile
  getMyMentorProfile: async () => {
    const response = await api.get('/mentors/profile/me');
    return response.data;
  },

  // Book session
  bookSession: async (mentorId, sessionData) => {
    const response = await api.post(`/mentors/${mentorId}/book`, sessionData);
    return response.data;
  },

  // Get upcoming sessions
  getUpcomingSessions: async () => {
    const response = await api.get('/mentors/sessions/upcoming');
    return response.data;
  },

  // Get session history
  getSessionHistory: async (page = 1, limit = 10) => {
    const response = await api.get('/mentors/sessions/history', { params: { page, limit } });
    return response.data;
  },

  // Complete session (mentor)
  completeSession: async (sessionId) => {
    const response = await api.put(`/mentors/sessions/${sessionId}/complete`);
    return response.data;
  },

  // Cancel session
  cancelSession: async (sessionId) => {
    const response = await api.put(`/mentors/sessions/${sessionId}/cancel`);
    return response.data;
  },

  // Rate session (mentee)
  rateSession: async (sessionId, rating, feedback) => {
    const response = await api.post(`/mentors/sessions/${sessionId}/rate`, { rating, feedback });
    return response.data;
  },
};

// Blogs API
export const blogsAPI = {
  // Get all blogs
  getBlogs: async (params = {}) => {
    const response = await api.get('/blogs', { params });
    return response.data;
  },

  // Get featured blogs
  getFeatured: async () => {
    const response = await api.get('/blogs/featured');
    return response.data;
  },

  // Get popular blogs
  getPopular: async () => {
    const response = await api.get('/blogs/popular');
    return response.data;
  },

  // Get single blog by slug
  getBlog: async (slug) => {
    const response = await api.get(`/blogs/${slug}`);
    return response.data;
  },

  // Like/unlike blog
  toggleLike: async (blogId) => {
    const response = await api.post(`/blogs/${blogId}/like`);
    return response.data;
  },

  // Admin: Create blog
  createBlog: async (blogData) => {
    const response = await api.post('/blogs', blogData);
    return response.data;
  },

  // Admin: Update blog
  updateBlog: async (blogId, blogData) => {
    const response = await api.put(`/blogs/${blogId}`, blogData);
    return response.data;
  },

  // Admin: Delete blog
  deleteBlog: async (blogId) => {
    const response = await api.delete(`/blogs/${blogId}`);
    return response.data;
  },
};

// FAQs API
export const faqsAPI = {
  // Get all FAQs
  getFAQs: async (params = {}) => {
    const response = await api.get('/faqs', { params });
    return response.data;
  },

  // Get FAQs by category
  getByCategory: async () => {
    const response = await api.get('/faqs/categories');
    return response.data;
  },

  // Get popular FAQs
  getPopular: async () => {
    const response = await api.get('/faqs/popular');
    return response.data;
  },

  // Get single FAQ
  getFAQ: async (faqId) => {
    const response = await api.get(`/faqs/${faqId}`);
    return response.data;
  },

  // Mark as helpful
  markHelpful: async (faqId) => {
    const response = await api.post(`/faqs/${faqId}/helpful`);
    return response.data;
  },

  // Mark as not helpful
  markNotHelpful: async (faqId) => {
    const response = await api.post(`/faqs/${faqId}/not-helpful`);
    return response.data;
  },

  // Admin: Create FAQ
  createFAQ: async (faqData) => {
    const response = await api.post('/faqs', faqData);
    return response.data;
  },

  // Admin: Update FAQ
  updateFAQ: async (faqId, faqData) => {
    const response = await api.put(`/faqs/${faqId}`, faqData);
    return response.data;
  },

  // Admin: Delete FAQ
  deleteFAQ: async (faqId) => {
    const response = await api.delete(`/faqs/${faqId}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Get platform stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get single user
  getUser: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Get all groups
  getGroups: async (params = {}) => {
    const response = await api.get('/admin/groups', { params });
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupId) => {
    const response = await api.delete(`/admin/groups/${groupId}`);
    return response.data;
  },

  // Get flagged content
  getFlaggedContent: async () => {
    const response = await api.get('/admin/flagged-content');
    return response.data;
  },

  // Resolve flagged feedback
  resolveFeedback: async (feedbackId) => {
    const response = await api.put(`/admin/feedback/${feedbackId}/resolve`);
    return response.data;
  },

  // Delete flagged feedback
  deleteFeedback: async (feedbackId) => {
    const response = await api.delete(`/admin/feedback/${feedbackId}`);
    return response.data;
  },

  // Resolve flagged message
  resolveMessage: async (messageId) => {
    const response = await api.put(`/admin/messages/${messageId}/resolve`);
    return response.data;
  },

  // Delete flagged message
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/admin/messages/${messageId}`);
    return response.data;
  },
};

// Feedback Mirror API
export const feedbackAPI = {
  // Get received feedback
  getReceivedFeedback: async (params = {}) => {
    const response = await api.get('/feedback', { params });
    return response.data;
  },

  // Get sent feedback
  getSentFeedback: async (params = {}) => {
    const response = await api.get('/feedback/sent', { params });
    return response.data;
  },

  // Get feedback stats
  getStats: async () => {
    const response = await api.get('/feedback/stats');
    return response.data;
  },

  // Get single feedback
  getFeedback: async (feedbackId) => {
    const response = await api.get(`/feedback/${feedbackId}`);
    return response.data;
  },

  // Send feedback
  sendFeedback: async (feedbackData) => {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  },

  // Flag feedback
  flagFeedback: async (feedbackId) => {
    const response = await api.put(`/feedback/${feedbackId}/flag`);
    return response.data;
  },

  // Delete feedback
  deleteFeedback: async (feedbackId) => {
    const response = await api.delete(`/feedback/${feedbackId}`);
    return response.data;
  },
};

// Routine Packs API
export const routinePacksAPI = {
  // Get all routine packs
  getRoutinePacks: async (params = {}) => {
    const response = await api.get('/routine-packs', { params });
    return response.data;
  },

  // Get popular packs
  getPopular: async () => {
    const response = await api.get('/routine-packs/popular/top');
    return response.data;
  },

  // Get single pack
  getRoutinePack: async (packId) => {
    const response = await api.get(`/routine-packs/${packId}`);
    return response.data;
  },

  // Create pack
  createRoutinePack: async (packData) => {
    const response = await api.post('/routine-packs', packData);
    return response.data;
  },

  // Adopt pack
  adoptRoutinePack: async (packId) => {
    const response = await api.post(`/routine-packs/${packId}/adopt`);
    return response.data;
  },
};

export default api;
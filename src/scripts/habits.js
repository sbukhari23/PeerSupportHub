/**
 * Habit Service
 * Week 7: JavaScript Advanced Concepts + Week 8: Client-Side Storage
 * Following MIT 6.102 principles: Abstract Data Types, Specifications
 */

class HabitService {
  constructor() {
    this.baseUrl = window.PeerSupportApp?.APP_CONFIG?.api?.baseUrl || 'http://localhost:5000/api';
    this.storageKey = 'psh_habits';
    this.habits = [];
    this.streaks = new Map();
  }

  /**
   * Create a new habit
   * @param {Object} habitData - Habit data
   * @requires habitData.name && habitData.category
   * @effects Creates new habit and stores it
   * @returns Promise<{success: boolean, habit?: Object, error?: string}>
   */
  async createHabit(habitData) {
    try {
      // Input validation
      if (!habitData.name || !habitData.category) {
        throw new Error('Habit name and category are required');
      }

      const authService = window.AuthService ? new AuthService() : null;
      const token = authService?.getToken();

      const habitPayload = {
        name: habitData.name.trim(),
        category: habitData.category,
        description: habitData.description || '',
        frequency: habitData.frequency || 'daily',
        targetValue: habitData.targetValue || 1,
        unit: habitData.unit || 'times',
        reminders: habitData.reminders || [],
        isActive: true,
        startDate: habitData.startDate || new Date().toISOString()
      };

      if (token) {
        // Online: Save to server
        const response = await fetch(`${this.baseUrl}/habits`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(habitPayload)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create habit');
        }

        // Update local storage
        this.habits.push(data.habit);
        this.saveToLocalStorage();

        return {
          success: true,
          habit: data.habit
        };

      } else {
        // Offline: Save locally only
        const habit = {
          id: window.PeerSupportApp.Utils.generateId(),
          ...habitPayload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending' // Mark for sync when online
        };

        this.habits.push(habit);
        this.saveToLocalStorage();

        return {
          success: true,
          habit: habit
        };
      }

    } catch (error) {
      console.error('Create habit error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create habit'
      };
    }
  }

  /**
   * Get all user habits
   * @returns Promise<{success: boolean, habits?: Array, error?: string}>
   */
  async getHabits() {
    try {
      const authService = window.AuthService ? new AuthService() : null;
      const token = authService?.getToken();

      if (token) {
        // Online: Fetch from server
        const response = await fetch(`${this.baseUrl}/habits`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch habits');
        }

        // Update local cache
        this.habits = data.habits || [];
        this.saveToLocalStorage();

        return {
          success: true,
          habits: this.habits
        };

      } else {
        // Offline: Load from local storage
        this.loadFromLocalStorage();
        return {
          success: true,
          habits: this.habits
        };
      }

    } catch (error) {
      console.error('Get habits error:', error);
      
      // Fallback to local storage on network error
      this.loadFromLocalStorage();
      return {
        success: true,
        habits: this.habits,
        warning: 'Loaded offline data. Some data may be outdated.'
      };
    }
  }

  /**
   * Log habit completion
   * @param {string} habitId - Habit ID
   * @param {Object} logData - Completion data
   * @returns Promise<{success: boolean, log?: Object, error?: string}>
   */
  async logHabitCompletion(habitId, logData = {}) {
    try {
      if (!habitId) {
        throw new Error('Habit ID is required');
      }

      const authService = window.AuthService ? new AuthService() : null;
      const token = authService?.getToken();

      const completionData = {
        habitId: habitId,
        completedAt: logData.completedAt || new Date().toISOString(),
        value: logData.value || 1,
        notes: logData.notes || '',
        mood: logData.mood || null
      };

      if (token) {
        // Online: Save to server
        const response = await fetch(`${this.baseUrl}/habits/${habitId}/complete`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(completionData)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to log habit completion');
        }

        // Update local streak tracking
        this.updateStreak(habitId, true);

        return {
          success: true,
          log: data.log,
          streak: data.streak
        };

      } else {
        // Offline: Save locally
        const log = {
          id: window.PeerSupportApp.Utils.generateId(),
          ...completionData,
          syncStatus: 'pending'
        };

        // Store in local pending logs
        const pendingLogs = JSON.parse(localStorage.getItem('psh_pending_logs') || '[]');
        pendingLogs.push(log);
        localStorage.setItem('psh_pending_logs', JSON.stringify(pendingLogs));

        // Update local streak
        this.updateStreak(habitId, true);

        return {
          success: true,
          log: log
        };
      }

    } catch (error) {
      console.error('Log habit completion error:', error);
      return {
        success: false,
        error: error.message || 'Failed to log habit completion'
      };
    }
  }

  /**
   * Get habit statistics
   * @param {string} habitId - Habit ID
   * @param {string} timeframe - Timeframe ('week', 'month', 'year')
   * @returns Promise<{success: boolean, stats?: Object, error?: string}>
   */
  async getHabitStats(habitId, timeframe = 'month') {
    try {
      const authService = window.AuthService ? new AuthService() : null;
      const token = authService?.getToken();

      if (token) {
        // Online: Fetch from server
        const response = await fetch(`${this.baseUrl}/habits/${habitId}/stats?timeframe=${timeframe}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch habit stats');
        }

        return {
          success: true,
          stats: data.stats
        };

      } else {
        // Offline: Calculate from local data
        const stats = this.calculateLocalStats(habitId, timeframe);
        return {
          success: true,
          stats: stats
        };
      }

    } catch (error) {
      console.error('Get habit stats error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get habit statistics'
      };
    }
  }

  /**
   * Update streak tracking
   * @private
   * @param {string} habitId - Habit ID
   * @param {boolean} completed - Whether habit was completed
   */
  updateStreak(habitId, completed) {
    const today = new Date().toDateString();
    const streakKey = `${habitId}_${today}`;
    
    if (completed) {
      // Mark today as completed
      this.streaks.set(streakKey, true);
      
      // Calculate current streak
      let currentStreak = 0;
      const date = new Date();
      
      while (true) {
        const dateKey = `${habitId}_${date.toDateString()}`;
        if (this.streaks.get(dateKey)) {
          currentStreak++;
          date.setDate(date.getDate() - 1);
        } else {
          break;
        }
      }
      
      // Store streak info
      const streakInfo = {
        habitId: habitId,
        currentStreak: currentStreak,
        lastCompleted: today,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(`psh_streak_${habitId}`, JSON.stringify(streakInfo));
    }
  }

  /**
   * Calculate local statistics
   * @private
   * @param {string} habitId - Habit ID
   * @param {string} timeframe - Timeframe for stats
   * @returns {Object} Statistics object
   */
  calculateLocalStats(habitId, timeframe) {
    // This would calculate stats from local storage data
    // For now, return basic stats structure
    return {
      completionRate: 0,
      currentStreak: this.getCurrentStreak(habitId),
      longestStreak: 0,
      totalCompletions: 0,
      averageValue: 0
    };
  }

  /**
   * Get current streak for a habit
   * @param {string} habitId - Habit ID
   * @returns {number} Current streak count
   */
  getCurrentStreak(habitId) {
    try {
      const streakData = localStorage.getItem(`psh_streak_${habitId}`);
      if (streakData) {
        const streak = JSON.parse(streakData);
        return streak.currentStreak || 0;
      }
      return 0;
    } catch (error) {
      console.error('Error getting streak:', error);
      return 0;
    }
  }

  /**
   * Save habits to local storage
   * @private
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.habits));
    } catch (error) {
      console.error('Error saving habits to local storage:', error);
    }
  }

  /**
   * Load habits from local storage
   * @private
   */
  loadFromLocalStorage() {
    try {
      const storedHabits = localStorage.getItem(this.storageKey);
      if (storedHabits) {
        this.habits = JSON.parse(storedHabits);
      }
    } catch (error) {
      console.error('Error loading habits from local storage:', error);
      this.habits = [];
    }
  }

  /**
   * Sync pending changes when online
   * @returns Promise<{success: boolean, synced?: number, error?: string}>
   */
  async syncPendingChanges() {
    try {
      const authService = window.AuthService ? new AuthService() : null;
      const token = authService?.getToken();

      if (!token) {
        return { success: false, error: 'Authentication required for sync' };
      }

      // Sync pending logs
      const pendingLogs = JSON.parse(localStorage.getItem('psh_pending_logs') || '[]');
      let syncedCount = 0;

      for (const log of pendingLogs) {
        try {
          const response = await fetch(`${this.baseUrl}/habits/${log.habitId}/complete`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(log)
          });

          if (response.ok) {
            syncedCount++;
          }
        } catch (syncError) {
          console.error('Error syncing log:', syncError);
        }
      }

      // Clear synced logs
      if (syncedCount > 0) {
        localStorage.removeItem('psh_pending_logs');
      }

      return {
        success: true,
        synced: syncedCount
      };

    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: error.message || 'Sync failed'
      };
    }
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HabitService;
}

// Make available globally
window.HabitService = HabitService;
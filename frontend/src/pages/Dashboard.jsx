import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import { TopNavBar } from '../components/TopNavBar';
import { 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  Users, 
  Target,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  MessageCircle,
  Flame,
  UserPlus,
  Bell,
  Shield,
  Pause,
  GraduationCap,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, habitsAPI, groupsAPI, profileAPI, habitLogsAPI, mentorsAPI, setLogoutCallback } from '../services/api';
import { NotificationsDropdown } from '../components/NotificationsDropdown';

// Helper to ensure URL has proper protocol
const ensureHttps = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export function Dashboard({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkedHabits, setCheckedHabits] = useState([]);
  const [pausedHabits, setPausedHabits] = useState([]);
  const [habits, setHabits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Habit log modal state
  const [showLogModal, setShowLogModal] = useState(null);
  const [logNote, setLogNote] = useState('');
  
  // Logout dialog state
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Get user data from localStorage (persists across page reloads and tabs)
  const userData = authAPI.getCurrentUser() || {};
  const userPlan = localStorage.getItem('selectedPlan') || 'free';
  const userName = userData.name?.split(' ')[0] || userData.username || 'User';
  const isAdmin = userData.userType === 'Admin';

  useEffect(() => {
    // Set the logout callback for API interceptor
    setLogoutCallback(onNavigate);
    
    // Redirect if not logged in
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    // Show welcome toast on first load
    const hasSeenWelcome = sessionStorage.getItem('dashboardWelcome');
    if (!hasSeenWelcome) {
      toast.success(`🎉 Welcome! You're on the ${userPlan} plan — ready to start?`, {
        duration: 5000,
      });
      sessionStorage.setItem('dashboardWelcome', 'true');
    }

    // Fetch data from API
    const fetchData = async () => {
      try {
        const [habitsData, groupsData, statsData, buddiesData, requestsData, todayLogsData, weeklyLogsData, sessionsData] = await Promise.all([
          habitsAPI.getHabits().catch(() => []),
          groupsAPI.getMyGroups().catch(() => []),
          profileAPI.getStats().catch(() => null),
          profileAPI.getBuddies().catch(() => []),
          profileAPI.getBuddyRequests().catch(() => []),
          habitLogsAPI.getTodayLogs().catch(() => []),
          habitLogsAPI.getWeeklyLogs().catch(() => []),
          mentorsAPI.getUpcomingSessions().catch(() => ({ asMentor: [], asMentee: [] })),
        ]);
        setHabits(habitsData);
        setGroups(groupsData);
        setStats(statsData);
        setBuddies(buddiesData);
        setPendingRequests(requestsData);
        
        // Populate checkedHabits with habits that were logged as Completed today
        const completedHabitIds = todayLogsData
          .filter(log => log.completionStatus === 'Completed')
          .map(log => log.userHabitId);
        setCheckedHabits(completedHabitIds);
        
        // Populate pausedHabits with habits that were logged as Paused (rest day) today
        const pausedHabitIds = todayLogsData
          .filter(log => log.completionStatus === 'Paused')
          .map(log => log.userHabitId);
        setPausedHabits(pausedHabitIds);
        
        // Process weekly data for the week view
        setWeeklyData(weeklyLogsData);
        
        // Set upcoming mentor sessions (both as mentor and mentee)
        const allSessions = [...(sessionsData.asMentor || []), ...(sessionsData.asMentee || [])];
        setUpcomingSessions(allSessions);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [onNavigate, userPlan]);

  // Default habits if none from API
  const todayHabits = habits.length > 0 ? habits.map(h => ({
    id: h._id,
    name: h.templateId?.name || h.name || 'Habit',
    completed: false,
    streak: h.streak || 0,
    isPublic: h.templateId?.isPublic || false,
  })) : [];

  const weekProgress = stats?.completionRateRaw || 0;
  const currentStreak = stats?.longestStreak || 0;

  const handleHabitToggle = async (habitId) => {
    if (checkedHabits.includes(habitId) || pausedHabits.includes(habitId)) {
      return; // Already logged today
    }
    
    // Find the habit to show in modal
    const habit = habits.find(h => h._id === habitId);
    if (habit) {
      setShowLogModal(habit);
    }
  };

  // Actually log the habit with a status
  const handleLogHabit = async (habitId, status) => {
    try {
      await habitLogsAPI.createLog(habitId, { 
        completionStatus: status,
        reflectionNote: logNote,
      });
      
      if (status === 'Completed') {
        setCheckedHabits(prev => [...prev, habitId]);
        toast.success('🎉 Great job! Keep it up!');
      } else if (status === 'Paused') {
        setPausedHabits(prev => [...prev, habitId]);
        toast.success('Rest day recorded');
      }
      
      // Refresh stats
      const newStats = await profileAPI.getStats().catch(() => null);
      if (newStats) setStats(newStats);
      
      // Close modal and reset
      setShowLogModal(null);
      setLogNote('');
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to log habit');
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    authAPI.logout();
    sessionStorage.clear();
    onNavigate('home');
  };

  const completedToday = todayHabits.filter(h => checkedHabits.includes(h.id)).length;
  const pausedToday = todayHabits.filter(h => pausedHabits.includes(h.id)).length;
  const totalHabits = todayHabits.length;
  const loggedToday = completedToday + pausedToday;
  const progressPercent = totalHabits > 0 ? Math.round((loggedToday / totalHabits) * 100) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => onNavigate('home')}>
              <span className="text-foreground font-bold text-2xl">PeerSupportHub</span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => onNavigate('habits')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                My Habits
              </button>
              <button 
                onClick={() => onNavigate('groups')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Groups
              </button>
              <button 
                onClick={() => onNavigate('challenges')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Challenges
              </button>
              <button 
                onClick={() => onNavigate('mentors')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Mentors
              </button>
              <button 
                onClick={() => onNavigate('buddies')}
                className="text-gray-600 hover:text-gray-900 transition-colors relative"
              >
                Buddies
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-2 -right-3 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => onNavigate('messages')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <NotificationsDropdown onNavigate={onNavigate} />
              <button 
                onClick={() => onNavigate('reflections')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Reflections
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="rounded-full border-2 border-black px-6 py-2"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
              <button 
                onClick={() => onNavigate('habits')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                My Habits
              </button>
              <button 
                onClick={() => onNavigate('groups')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Groups
              </button>
              <button 
                onClick={() => onNavigate('challenges')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Challenges
              </button>
              <button 
                onClick={() => onNavigate('mentors')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Mentors
              </button>
              <button 
                onClick={() => onNavigate('buddies')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2 flex items-center"
              >
                Buddies
                {pendingRequests.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => onNavigate('messages')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Messages
              </button>
              <button 
                onClick={() => onNavigate('reflections')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Reflections
              </button>
              <button 
                onClick={() => onNavigate('settings')}
                className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2"
              >
                Settings
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className="block w-full text-left text-red-600 hover:text-red-700 transition-colors py-2 flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Panel
                </button>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full rounded-full border-2 border-black"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">
                  Welcome back, {userName}! 👋
                </h1>
                {/* User Role Badge */}
                {userData.userType === 'Admin' ? (
                  <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Admin
                  </span>
                ) : userData.userType === 'Mentor' ? (
                  <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    <GraduationCap className="w-4 h-4" />
                    Mentor
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    <User className="w-4 h-4" />
                    Member
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">
                {loggedToday === totalHabits 
                  ? "Amazing! You've completed all your habits today!" 
                  : `You have ${totalHabits - loggedToday} habit${totalHabits - loggedToday !== 1 ? 's' : ''} left today`}
              </p>
            </div>

            {userPlan !== 'free' && (
              <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-full px-4 py-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-900 capitalize">{userPlan}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Habits */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 md:p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Today's Habits</h2>
                <div className="text-right">
                  <div className="text-2xl font-bold">{loggedToday}/{totalHabits}</div>
                  <div className="text-sm text-gray-600">tracked</div>
                </div>
              </div>

              <div className="mb-6">
                <Progress value={progressPercent} className="h-3" />
                <p className="text-sm text-gray-600 mt-2">{progressPercent}% complete</p>
              </div>

              <div className="space-y-3">
                {todayHabits.length > 0 ? todayHabits.map((habit) => {
                  const isCompleted = checkedHabits.includes(habit.id);
                  const isPaused = pausedHabits.includes(habit.id);
                  const isLogged = isCompleted || isPaused;
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleHabitToggle(habit.id)}
                      disabled={isLogged}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isCompleted 
                          ? 'border-green-500 bg-green-50 cursor-default' 
                          : isPaused
                          ? 'border-purple-400 bg-purple-50 cursor-default'
                          : 'border-gray-300 hover:border-gray-400 bg-white cursor-pointer'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : isPaused ? (
                        <Circle className="w-6 h-6 text-purple-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`flex-1 text-lg ${
                        isCompleted 
                          ? 'line-through text-gray-500' 
                          : isPaused 
                          ? 'line-through text-purple-600 decoration-purple-400' 
                          : 'text-gray-900'
                      }`}>
                        {habit.name}
                        {habit.isPublic && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Public</span>}
                        {isPaused && <span className="ml-2 text-xs text-purple-500">(Rest Day)</span>}
                      </span>
                      {habit.streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-500 text-sm">
                          <Flame className="w-4 h-4" />
                          {habit.streak}
                        </span>
                      )}
                    </button>
                  );
                }) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No habits yet. Add your first habit to get started!</p>
                  </div>
                )}
              </div>

              <Button 
                onClick={() => onNavigate('habits')}
                className="w-full mt-6 rounded-full bg-black hover:bg-gray-800 py-6 text-lg"
              >
                Manage My Habits
              </Button>
            </Card>

            {/* Weekly Overview */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 md:p-8 bg-white">
              <h2 className="text-2xl font-bold mb-6">This Week</h2>
              
              <div className="grid grid-cols-7 gap-2 mb-6">
                {(weeklyData.length > 0 ? weeklyData : [
                  { day: 'Mon', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Tue', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Wed', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Thu', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Fri', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Sat', percentage: 0, isToday: false, isFuture: false },
                  { day: 'Sun', percentage: 0, isToday: false, isFuture: false },
                ]).map((dayData, index) => {
                  // Determine color based on percentage and status
                  let bgColor = 'bg-gray-200';
                  if (dayData.isFuture) {
                    bgColor = 'bg-gray-100';
                  } else if (dayData.isToday) {
                    bgColor = dayData.percentage >= 80 ? 'bg-green-500' : 
                              dayData.percentage >= 50 ? 'bg-yellow-400' : 
                              dayData.percentage > 0 ? 'bg-orange-400' : 'bg-blue-300';
                  } else {
                    bgColor = dayData.percentage >= 80 ? 'bg-green-500' : 
                              dayData.percentage >= 50 ? 'bg-yellow-400' : 
                              dayData.percentage > 0 ? 'bg-orange-400' : 'bg-gray-300';
                  }
                  
                  return (
                    <div key={index} className="text-center">
                      <div className={`text-xs mb-2 ${dayData.isToday ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                        {dayData.day?.charAt(0) || ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                      </div>
                      <div className={`relative w-full aspect-square rounded-lg ${bgColor} ${dayData.isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                        {!dayData.isFuture && dayData.percentage > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                            {dayData.percentage}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-center">
                <div>
                  <div className="text-3xl font-bold">{weekProgress}%</div>
                  <div className="text-sm text-gray-600">Week Progress</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div>
                  <div className="text-3xl font-bold">{currentStreak}</div>
                  <div className="text-sm text-gray-600">Day Streak 🔥</div>
                </div>
              </div>
            </Card>

            {/* Upcoming Mentor Sessions */}
            {upcomingSessions.length > 0 && (
              <Card className="border-2 border-gray-900 rounded-2xl p-6 md:p-8 bg-white">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Upcoming Sessions
                </h2>
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 3).map((session) => {
                    const currentUser = authAPI.getCurrentUser();
                    const isMentor = session.mentorId?._id === currentUser?.id || session.mentorId === currentUser?.id;
                    return (
                      <div key={session._id} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{session.topic}</h4>
                              {isMentor && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                  You're mentoring
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {isMentor 
                                ? `with ${session.menteeId?.name || 'Mentee'}`
                                : `with ${session.mentorId?.name || 'Mentor'}`
                              }
                            </p>
                            <p className="text-sm text-purple-600 mt-1">
                              {new Date(session.sessionDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {session.meetingLink && (
                            <a
                              href={ensureHttps(session.meetingLink)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors"
                            >
                              Join
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('mentors')}
                  className="w-full mt-4 rounded-full border-2 border-black"
                >
                  View All Sessions
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Your Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Habits</span>
                  <span className="font-bold text-lg">{stats?.totalActiveHabits || habits.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Longest Streak</span>
                  <span className="font-bold text-lg text-orange-500 flex items-center gap-1">
                    {stats?.longestStreak || 0} <Flame className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-bold text-lg text-green-600">{stats?.completionRate || '0%'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Days Logged</span>
                  <span className="font-bold text-lg">{stats?.totalDaysLogged || 0}</span>
                </div>
              </div>
            </Card>

            {/* Buddies Card */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Accountability Buddies
              </h3>
              
              <div className="space-y-3">
                {buddies.length > 0 ? (
                  buddies.slice(0, 3).map((buddy) => (
                    <div key={buddy._id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-bold">
                        {buddy.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{buddy.name}</div>
                      </div>
                      <button 
                        onClick={() => onNavigate(`messages-${buddy._id}`)}
                        className="p-1.5 hover:bg-gray-200 rounded-full"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    <p>No buddies yet</p>
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('buddies')}
                  className="w-full rounded-full border-2 border-black relative"
                >
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {pendingRequests.length}
                    </span>
                  )}
                  {buddies.length > 0 ? 'View All Buddies' : 'Find Buddies'}
                </Button>
              </div>
            </Card>

            {/* Groups Card */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 bg-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Groups
              </h3>
              
              <div className="space-y-3">
                {groups.length > 0 ? (
                  groups.slice(0, 2).map((group, index) => (
                    <button 
                      key={group._id || index} 
                      onClick={() => onNavigate(`group-chat-${group._id}`)}
                      className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="font-bold">{group.name}</div>
                      <div className="text-sm text-gray-600">{group.members?.length || 0} members</div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-bold">No groups yet</div>
                    <div className="text-sm text-gray-600">Join a group to stay accountable</div>
                  </div>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => onNavigate('groups')}
                  className="w-full rounded-full border-2 border-black"
                >
                  {groups.length > 0 ? 'View All Groups' : 'Browse Groups'}
                </Button>
              </div>
            </Card>

            {/* Upgrade CTA (for free users) */}
            {userPlan === 'free' && (
              <Card className="border-2 border-gray-900 rounded-2xl p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Unlock More
                </h3>
                
                <p className="text-gray-300 text-sm mb-4">
                  Upgrade to track unlimited habits and get mentor support
                </p>
                
                <Button 
                  onClick={() => onNavigate('membership')}
                  className="w-full rounded-full bg-white text-gray-900 hover:bg-gray-100"
                >
                  View Plans
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Log Habit Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Log: {showLogModal.templateId?.name || showLogModal.name}</h2>
              <button onClick={() => { setShowLogModal(null); setLogNote(''); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="reflection">Reflection Note (optional)</Label>
                <Textarea
                  id="reflection"
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="How did it go? Any thoughts?"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-2">How did you do today?</p>
                <Button
                  onClick={() => handleLogHabit(showLogModal._id, 'Completed')}
                  className="w-full rounded-full bg-green-600 hover:bg-green-700 py-3"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Completed
                </Button>
                <Button
                  onClick={() => handleLogHabit(showLogModal._id, 'Paused')}
                  variant="outline"
                  className="w-full rounded-full border-2 border-purple-300 text-purple-600 hover:bg-purple-50 py-3"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Rest Day (keeps streak)
                </Button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Habits are automatically marked as missed if not completed within the time window
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Confirm Logout"
        description="Are you sure you want to log out of your account? You will need to sign in again to access your dashboard."
        confirmText="Logout"
        variant="logout"
        onConfirm={confirmLogout}
      />
    </div>
  );
}

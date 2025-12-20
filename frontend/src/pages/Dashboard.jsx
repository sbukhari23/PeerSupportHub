import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, habitsAPI, groupsAPI, profileAPI, habitLogsAPI, setLogoutCallback } from '../services/api';

export function Dashboard({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkedHabits, setCheckedHabits] = useState([]);
  const [habits, setHabits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user data from localStorage (persists across page reloads and tabs)
  const userData = authAPI.getCurrentUser() || {};
  const userPlan = localStorage.getItem('selectedPlan') || 'free';
  const userName = userData.name?.split(' ')[0] || userData.username || 'User';

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
        const [habitsData, groupsData, statsData, buddiesData, requestsData] = await Promise.all([
          habitsAPI.getHabits().catch(() => []),
          groupsAPI.getMyGroups().catch(() => []),
          profileAPI.getStats().catch(() => null),
          profileAPI.getBuddies().catch(() => []),
          profileAPI.getBuddyRequests().catch(() => []),
        ]);
        setHabits(habitsData);
        setGroups(groupsData);
        setStats(statsData);
        setBuddies(buddiesData);
        setPendingRequests(requestsData);
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
  })) : [];

  const weekProgress = stats?.completionRateRaw || 0;
  const currentStreak = stats?.longestStreak || 0;

  const handleHabitToggle = async (habitId) => {
    if (checkedHabits.includes(habitId)) {
      return; // Already logged today
    }
    
    try {
      await habitLogsAPI.createLog(habitId, { completionStatus: 'Completed' });
      setCheckedHabits(prev => [...prev, habitId]);
      toast.success('Great job! Keep it up! 🎯');
      
      // Refresh stats
      const newStats = await profileAPI.getStats().catch(() => null);
      if (newStats) setStats(newStats);
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to log habit');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      authAPI.logout();
      sessionStorage.clear();
      onNavigate('home');
    }
  };

  const completedToday = todayHabits.filter(h => checkedHabits.includes(h.id)).length;
  const totalHabits = todayHabits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

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
              <button className="text-gray-600 hover:text-gray-900 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
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
              <button className="block w-full text-left text-gray-600 hover:text-gray-900 transition-colors py-2">
                Settings
              </button>
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Welcome back, {userName}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                {completedToday === totalHabits 
                  ? "Amazing! You've completed all your habits today!" 
                  : `You have ${totalHabits - completedToday} habit${totalHabits - completedToday !== 1 ? 's' : ''} left today`}
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
                  <div className="text-2xl font-bold">{completedToday}/{totalHabits}</div>
                  <div className="text-sm text-gray-600">completed</div>
                </div>
              </div>

              <div className="mb-6">
                <Progress value={progressPercent} className="h-3" />
                <p className="text-sm text-gray-600 mt-2">{progressPercent}% complete</p>
              </div>

              <div className="space-y-3">
                {todayHabits.length > 0 ? todayHabits.map((habit) => {
                  const isCompleted = checkedHabits.includes(habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleHabitToggle(habit.id)}
                      disabled={isCompleted}
                      className={`
                        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isCompleted 
                          ? 'border-green-500 bg-green-50 cursor-default' 
                          : 'border-gray-300 hover:border-gray-400 bg-white cursor-pointer'
                        }
                      `}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                      )}
                      <span className={`flex-1 text-lg ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {habit.name}
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
                + Add New Habit
              </Button>
            </Card>

            {/* Weekly Overview */}
            <Card className="border-2 border-gray-900 rounded-2xl p-6 md:p-8 bg-white">
              <h2 className="text-2xl font-bold mb-6">This Week</h2>
              
              <div className="grid grid-cols-7 gap-2 mb-6">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                  const isCompleted = index < 5; // Mock data
                  return (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-600 mb-2">{day}</div>
                      <div className={`
                        w-full aspect-square rounded-lg
                        ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                      `}></div>
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
    </div>
  );
}

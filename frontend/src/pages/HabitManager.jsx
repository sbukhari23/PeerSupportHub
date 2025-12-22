import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Flame,
  Calendar,
  Clock,
  Target,
  X,
  Pause,
  XCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, habitsAPI, habitLogsAPI, profileAPI, setLogoutCallback } from '../services/api';
import { TopNavBar } from '../components/TopNavBar';

export function HabitManager({ onNavigate }) {
  const [habits, setHabits] = useState([]);
  const [publicTemplates, setPublicTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [showLogModal, setShowLogModal] = useState(null);
  const [logNote, setLogNote] = useState('');
  const [deleteHabitId, setDeleteHabitId] = useState(null);
  
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: 'Wellness',
    userIntention: '',
    dailyWindowStart: '',
    dailyWindowEnd: '',
  });

  // Categories must match backend validation: 'Wellness', 'Productivity', 'Learning', 'Social', 'Career'
  const categories = [
    'Wellness',
    'Productivity',
    'Learning',
    'Social',
    'Career',
  ];

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchData();
  }, [onNavigate]);

  const fetchData = async () => {
    try {
      const [habitsData, statsData, templatesData] = await Promise.all([
        habitsAPI.getHabits().catch(() => []),
        profileAPI.getStats().catch(() => null),
        habitsAPI.getPublicTemplates().catch(() => []),
      ]);
      setHabits(habitsData);
      setStats(statsData);
      setPublicTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newHabit.name.trim()) {
      toast.error('Please enter a habit name');
      return;
    }
    
    if (!newHabit.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!newHabit.userIntention?.trim()) {
      toast.error('Please enter your personal goal/intention');
      return;
    }
    
    if (!newHabit.dailyWindowStart?.trim()) {
      toast.error('Please select a daily window start time');
      return;
    }
    
    if (!newHabit.dailyWindowEnd?.trim()) {
      toast.error('Please select a daily window end time');
      return;
    }

    try {
      const habitData = {
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        category: newHabit.category,
        userIntention: newHabit.userIntention.trim(),
        dailyWindowStart: newHabit.dailyWindowStart.trim(),
        dailyWindowEnd: newHabit.dailyWindowEnd.trim(),
      };
      
      await habitsAPI.createHabit(habitData);
      toast.success('Habit created successfully!');
      setShowAddModal(false);
      setNewHabit({
        name: '',
        description: '',
        category: 'Wellness',
        userIntention: '',
        dailyWindowStart: '',
        dailyWindowEnd: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to create habit');
    }
  };

  const handleUpdateHabit = async (e) => {
    e.preventDefault();
    if (!editingHabit) return;

    try {
      await habitsAPI.updateHabit(editingHabit._id, {
        name: editingHabit.templateId?.name,
        description: editingHabit.templateId?.description,
        category: editingHabit.templateId?.category,
        userIntention: editingHabit.userIntention,
        dailyWindowStart: editingHabit.dailyWindowStart,
        dailyWindowEnd: editingHabit.dailyWindowEnd,
      });
      toast.success('Habit updated!');
      setEditingHabit(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update habit');
    }
  };

  const handleDeleteHabit = async (habitId) => {
    setDeleteHabitId(habitId);
  };

  const confirmDeleteHabit = async () => {
    if (!deleteHabitId) return;
    try {
      await habitsAPI.deleteHabit(deleteHabitId);
      toast.success('Habit deleted');
      setDeleteHabitId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to delete habit');
    }
  };

  const handleLogHabit = async (habitId, status) => {
    try {
      await habitLogsAPI.createLog(habitId, {
        completionStatus: status,
        reflectionNote: logNote,
      });
      toast.success(
        status === 'Completed' ? '🎉 Great job!' : 
        status === 'Paused' ? 'Rest day recorded' : 
        'Log recorded'
      );
      setShowLogModal(null);
      setLogNote('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to log habit');
    }
  };

  const handleAddFromTemplate = async (template) => {
    try {
      await habitsAPI.addFromTemplate(template._id, {
        userIntention: '',
        dailyWindowStart: '06:00',
        dailyWindowEnd: '22:00',
      });
      toast.success('Habit added from template!');
      setShowTemplatesModal(false);
      fetchData();
    } catch (error) {
      console.error('Error adding template:', error);
      const errorMsg = error.response?.data?.msg || error.response?.data?.message || error.message || 'Failed to add habit';
      toast.error(errorMsg);
    }
  };

  // Separate habits into public (from public templates) and private (user-created)
  const publicHabits = habits.filter(h => h.templateId?.isPublic === true);
  const privateHabits = habits.filter(h => h.templateId?.isPublic !== true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading habits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Top Navigation Bar */}
      <TopNavBar currentPage="habits" onNavigate={onNavigate} />
      
      {/* Header */}
      <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Habits</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Track and build consistent routines</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplatesModal(true)}
                className="rounded-full border-2 dark:border-gray-700 dark:text-gray-200"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Browse Templates
              </Button>
              <Button
                onClick={() => setShowAddModal(true)}
                className="rounded-full bg-black hover:bg-gray-800 dark:bg-primary dark:text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Habit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-black">{stats.totalActiveHabits}</div>
              <div className="text-sm text-gray-600">Active Habits</div>
            </Card>
            <Card className="border-2 border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-orange-500 flex items-center justify-center gap-1">
                {stats.longestStreak} <Flame className="w-6 h-6" />
              </div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </Card>
            <Card className="border-2 border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{stats.completionRate}</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </Card>
            <Card className="border-2 border-gray-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.totalDaysLogged}</div>
              <div className="text-sm text-gray-600">Days Tracked</div>
            </Card>
          </div>
        )}

        {/* Habits List */}
        <div className="space-y-6">
          {habits.length > 0 ? (
            <>
              {/* My Custom Habits (Private) */}
              {privateHabits.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    My Custom Habits
                  </h2>
                  <div className="space-y-4">
                    {privateHabits.map((habit) => (
                      <Card
                        key={habit._id}
                        className="border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-400 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{habit.templateId?.name || 'Habit'}</h3>
                              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                {habit.templateId?.category || 'General'}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{habit.templateId?.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-1 text-orange-500">
                                <Flame className="w-4 h-4" />
                                <span className="font-medium">{habit.streak || 0} day streak</span>
                              </div>
                              {habit.dailyWindowStart && habit.dailyWindowEnd && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{habit.dailyWindowStart} - {habit.dailyWindowEnd}</span>
                                </div>
                              )}
                              {habit.compassionatePauseCount > 0 && (
                                <div className="flex items-center gap-1 text-purple-500">
                                  <Pause className="w-4 h-4" />
                                  <span>{habit.compassionatePauseCount} rest days used</span>
                                </div>
                              )}
                            </div>

                            {habit.userIntention && (
                              <p className="mt-3 text-sm text-gray-500 italic">
                                Goal: {habit.userIntention}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setShowLogModal(habit)}
                              className="rounded-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Done
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingHabit(habit)}
                              className="rounded-full border-2"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteHabit(habit._id)}
                              className="rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Public Template Habits */}
              {publicHabits.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    From Public Templates
                  </h2>
                  <div className="space-y-4">
                    {publicHabits.map((habit) => (
                      <Card
                        key={habit._id}
                        className="border-2 border-blue-100 rounded-2xl p-6 hover:border-blue-300 transition-colors bg-blue-50/30"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{habit.templateId?.name || 'Habit'}</h3>
                              <span className="text-xs bg-blue-100 px-3 py-1 rounded-full text-blue-700">
                                {habit.templateId?.category || 'General'}
                              </span>
                              <span className="text-xs bg-blue-200 px-2 py-1 rounded-full text-blue-800">
                                Public
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{habit.templateId?.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-1 text-orange-500">
                                <Flame className="w-4 h-4" />
                                <span className="font-medium">{habit.streak || 0} day streak</span>
                              </div>
                              {habit.dailyWindowStart && habit.dailyWindowEnd && (
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>{habit.dailyWindowStart} - {habit.dailyWindowEnd}</span>
                                </div>
                              )}
                              {habit.compassionatePauseCount > 0 && (
                                <div className="flex items-center gap-1 text-purple-500">
                                  <Pause className="w-4 h-4" />
                                  <span>{habit.compassionatePauseCount} rest days used</span>
                                </div>
                              )}
                            </div>

                            {habit.userIntention && (
                              <p className="mt-3 text-sm text-gray-500 italic">
                                Goal: {habit.userIntention}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => setShowLogModal(habit)}
                              className="rounded-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Done
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setEditingHabit(habit)}
                              className="rounded-full border-2"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleDeleteHabit(habit._id)}
                              className="rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No habits yet</h3>
              <p className="text-gray-500 mb-4">Start building your routine by adding your first habit</p>
              <Button onClick={() => setShowAddModal(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Habit
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Habit</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <Label htmlFor="name">Habit Name *</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g., Exercise for 30 minutes"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  placeholder="What does completing this habit look like?"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Category</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, category: cat })}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        newHabit.category === cat
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="intention">Personal Goal *</Label>
                <Input
                  id="intention"
                  value={newHabit.userIntention}
                  onChange={(e) => setNewHabit({ ...newHabit, userIntention: e.target.value })}
                  placeholder="Why is this habit important to you?"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="windowStart">Daily Window Start</Label>
                  <Input
                    id="windowStart"
                    type="time"
                    value={newHabit.dailyWindowStart}
                    onChange={(e) => setNewHabit({ ...newHabit, dailyWindowStart: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="windowEnd">Daily Window End</Label>
                  <Input
                    id="windowEnd"
                    type="time"
                    value={newHabit.dailyWindowEnd}
                    onChange={(e) => setNewHabit({ ...newHabit, dailyWindowEnd: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-full border-2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-full bg-black hover:bg-gray-800">
                  Create Habit
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Edit Habit</h2>
              <button onClick={() => setEditingHabit(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateHabit} className="space-y-4">
              <div>
                <Label htmlFor="editName">Habit Name</Label>
                <Input
                  id="editName"
                  value={editingHabit.templateId?.name || ''}
                  onChange={(e) =>
                    setEditingHabit({
                      ...editingHabit,
                      templateId: { ...editingHabit.templateId, name: e.target.value },
                    })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingHabit.templateId?.description || ''}
                  onChange={(e) =>
                    setEditingHabit({
                      ...editingHabit,
                      templateId: { ...editingHabit.templateId, description: e.target.value },
                    })
                  }
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="editIntention">Personal Goal</Label>
                <Input
                  id="editIntention"
                  value={editingHabit.userIntention || ''}
                  onChange={(e) =>
                    setEditingHabit({ ...editingHabit, userIntention: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editWindowStart">Daily Window Start</Label>
                  <Input
                    id="editWindowStart"
                    type="time"
                    value={editingHabit.dailyWindowStart || ''}
                    onChange={(e) =>
                      setEditingHabit({ ...editingHabit, dailyWindowStart: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="editWindowEnd">Daily Window End</Label>
                  <Input
                    id="editWindowEnd"
                    type="time"
                    value={editingHabit.dailyWindowEnd || ''}
                    onChange={(e) =>
                      setEditingHabit({ ...editingHabit, dailyWindowEnd: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingHabit(null)}
                  className="flex-1 rounded-full border-2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-full bg-black hover:bg-gray-800">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Log Habit Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Log: {showLogModal.templateId?.name}</h2>
              <button onClick={() => setShowLogModal(null)} className="text-gray-500 hover:text-gray-700">
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

      {/* Browse Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl rounded-2xl p-6 bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Public Habit Templates</h2>
              <button onClick={() => setShowTemplatesModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {publicTemplates.length > 0 ? (
              <div className="space-y-3">
                {publicTemplates.map((template) => (
                  <div
                    key={template._id}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full mt-2 inline-block">
                          {template.category}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleAddFromTemplate(template)}
                        size="sm"
                        className="rounded-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No public templates available yet</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteHabitId}
        onOpenChange={(open) => !open && setDeleteHabitId(null)}
        title="Delete Habit"
        description="Are you sure you want to delete this habit? This action cannot be undone and all your progress data will be lost."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteHabit}
      />
    </div>
  );
}

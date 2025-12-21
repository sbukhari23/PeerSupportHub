import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Smile,
  Meh,
  Frown,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Heart,
  Brain,
  Sun,
  Moon,
  Cloud,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, reflectionsAPI, setLogoutCallback } from '../services/api';

export function Reflections({ onNavigate }) {
  const [reflections, setReflections] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReflection, setEditingReflection] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteReflectionId, setDeleteReflectionId] = useState(null);
  
  const [newReflection, setNewReflection] = useState({
    type: 'Daily',
    mood: 'Neutral',
    content: '',
    gratitude: '',
    goals: '',
  });

  const moodOptions = [
    { value: 'Great', icon: <Sparkles className="w-6 h-6" />, color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { value: 'Good', icon: <Smile className="w-6 h-6" />, color: 'text-green-500', bg: 'bg-green-100' },
    { value: 'Neutral', icon: <Meh className="w-6 h-6" />, color: 'text-gray-500', bg: 'bg-gray-100' },
    { value: 'Low', icon: <Cloud className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-100' },
    { value: 'Difficult', icon: <Frown className="w-6 h-6" />, color: 'text-red-500', bg: 'bg-red-100' },
  ];

  const typeOptions = [
    { value: 'Daily', icon: <Sun className="w-5 h-5" />, label: 'Daily Check-in' },
    { value: 'Weekly', icon: <Calendar className="w-5 h-5" />, label: 'Weekly Review' },
    { value: 'Gratitude', icon: <Heart className="w-5 h-5" />, label: 'Gratitude' },
    { value: 'Goals', icon: <TrendingUp className="w-5 h-5" />, label: 'Goal Setting' },
    { value: 'Freeform', icon: <Brain className="w-5 h-5" />, label: 'Free Write' },
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
      const [reflectionsData, statsData] = await Promise.all([
        reflectionsAPI.getReflections().catch(() => ({ reflections: [] })),
        reflectionsAPI.getStats().catch(() => null),
      ]);
      setReflections(reflectionsData.reflections || reflectionsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching reflections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReflection = async () => {
    if (!newReflection.content.trim()) {
      toast.error('Please write something in your reflection');
      return;
    }

    try {
      await reflectionsAPI.createReflection({
        type: newReflection.type,
        mood: newReflection.mood,
        content: newReflection.content,
        gratitude: newReflection.gratitude || undefined,
        goals: newReflection.goals || undefined,
      });
      toast.success('Reflection saved! 📝');
      setShowCreateModal(false);
      setNewReflection({
        type: 'Daily',
        mood: 'Neutral',
        content: '',
        gratitude: '',
        goals: '',
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to save reflection');
    }
  };

  const handleUpdateReflection = async () => {
    if (!editingReflection) return;

    try {
      await reflectionsAPI.updateReflection(editingReflection._id, {
        content: editingReflection.content,
        mood: editingReflection.mood,
        gratitude: editingReflection.gratitude,
        goals: editingReflection.goals,
      });
      toast.success('Reflection updated!');
      setEditingReflection(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update reflection');
    }
  };

  const handleDeleteReflection = async (reflectionId) => {
    setDeleteReflectionId(reflectionId);
  };

  const confirmDeleteReflection = async () => {
    if (!deleteReflectionId) return;
    try {
      await reflectionsAPI.deleteReflection(deleteReflectionId);
      toast.success('Reflection deleted');
      setDeleteReflectionId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to delete reflection');
    }
  };

  const getMoodIcon = (mood) => {
    const option = moodOptions.find(m => m.value === mood);
    return option || moodOptions[2]; // Default to Neutral
  };

  const filteredReflections = reflections.filter(r => 
    activeFilter === 'all' || r.type === activeFilter
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reflections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Reflections</h1>
                <p className="text-sm text-gray-500">Track your thoughts and growth</p>
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 text-center">
              <BookOpen className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.totalEntries || 0}</p>
              <p className="text-xs text-gray-500">Total Entries</p>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.currentStreak || 0}</p>
              <p className="text-xs text-gray-500">Day Streak</p>
            </Card>
            <Card className="p-4 text-center">
              <Smile className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.averageMood || 'N/A'}</p>
              <p className="text-xs text-gray-500">Avg Mood</p>
            </Card>
            <Card className="p-4 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats.gratitudeCount || 0}</p>
              <p className="text-xs text-gray-500">Gratitudes</p>
            </Card>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === 'all' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {typeOptions.map((type) => (
            <button
              key={type.value}
              onClick={() => setActiveFilter(type.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeFilter === type.value ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>

        {/* Reflections List */}
        <div className="space-y-4">
          {filteredReflections.length > 0 ? (
            filteredReflections.map((reflection) => {
              const mood = getMoodIcon(reflection.mood);
              return (
                <Card key={reflection._id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${mood.bg}`}>
                        <span className={mood.color}>{mood.icon}</span>
                      </div>
                      <div>
                        <p className="font-medium">{reflection.type} Reflection</p>
                        <p className="text-sm text-gray-500">{formatDate(reflection.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReflection(reflection)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReflection(reflection._id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{reflection.content}</p>

                  {reflection.gratitude && (
                    <div className="bg-pink-50 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-pink-700 flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4" /> Gratitude
                      </p>
                      <p className="text-sm text-pink-900">{reflection.gratitude}</p>
                    </div>
                  )}

                  {reflection.goals && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4" /> Goals
                      </p>
                      <p className="text-sm text-blue-900">{reflection.goals}</p>
                    </div>
                  )}
                </Card>
              );
            })
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reflections yet</h3>
              <p className="text-gray-500 mb-4">Start journaling to track your thoughts and growth</p>
              <Button onClick={() => setShowCreateModal(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Write Your First Entry
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingReflection) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingReflection ? 'Edit Reflection' : 'New Reflection'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingReflection(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingReflection && (
              <>
                {/* Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {typeOptions.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setNewReflection(prev => ({ ...prev, type: type.value }))}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
                          newReflection.type === type.value
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {type.icon}
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Mood Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">How are you feeling?</label>
              <div className="flex gap-2 justify-center">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => editingReflection 
                      ? setEditingReflection(prev => ({ ...prev, mood: mood.value }))
                      : setNewReflection(prev => ({ ...prev, mood: mood.value }))
                    }
                    className={`p-3 rounded-full transition-colors ${mood.bg} ${
                      (editingReflection?.mood || newReflection.mood) === mood.value
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                  >
                    <span className={mood.color}>{mood.icon}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your thoughts</label>
              <Textarea
                value={editingReflection?.content || newReflection.content}
                onChange={(e) => editingReflection
                  ? setEditingReflection(prev => ({ ...prev, content: e.target.value }))
                  : setNewReflection(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="What's on your mind today?"
                className="min-h-[120px]"
              />
            </div>

            {/* Gratitude */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-500" />
                Gratitude (optional)
              </label>
              <Textarea
                value={editingReflection?.gratitude || newReflection.gratitude}
                onChange={(e) => editingReflection
                  ? setEditingReflection(prev => ({ ...prev, gratitude: e.target.value }))
                  : setNewReflection(prev => ({ ...prev, gratitude: e.target.value }))
                }
                placeholder="What are you grateful for today?"
                className="min-h-[80px]"
              />
            </div>

            {/* Goals */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Goals (optional)
              </label>
              <Textarea
                value={editingReflection?.goals || newReflection.goals}
                onChange={(e) => editingReflection
                  ? setEditingReflection(prev => ({ ...prev, goals: e.target.value }))
                  : setNewReflection(prev => ({ ...prev, goals: e.target.value }))
                }
                placeholder="What do you want to accomplish?"
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingReflection(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={editingReflection ? handleUpdateReflection : handleCreateReflection}
                className="flex-1"
              >
                {editingReflection ? 'Save Changes' : 'Save Reflection'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Reflection Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteReflectionId}
        onOpenChange={(open) => !open && setDeleteReflectionId(null)}
        title="Delete Reflection"
        description="Are you sure you want to delete this reflection? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteReflection}
      />
    </div>
  );
}

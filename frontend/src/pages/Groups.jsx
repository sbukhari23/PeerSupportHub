import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Users,
  Plus,
  Search,
  ArrowLeft,
  MessageCircle,
  Settings,
  LogOut,
  Crown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, groupsAPI, setLogoutCallback } from '../services/api';

export function Groups({ onNavigate }) {
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover' or 'my-groups'
  const [newGroup, setNewGroup] = useState({
    name: '',
    type: 'FocusedSpace',
    topicFocus: '',
  });

  const userData = authAPI.getCurrentUser() || {};

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchGroups();
  }, [onNavigate]);

  const fetchGroups = async () => {
    try {
      const [allGroups, userGroups] = await Promise.all([
        groupsAPI.getGroups().catch(() => []),
        groupsAPI.getMyGroups().catch(() => []),
      ]);
      setGroups(allGroups);
      setMyGroups(userGroups);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      await groupsAPI.createGroup(newGroup);
      toast.success('Group created successfully!');
      setShowCreateModal(false);
      setNewGroup({ name: '', type: 'FocusedSpace', topicFocus: '' });
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await groupsAPI.joinGroup(groupId);
      toast.success('Successfully joined the group!');
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
      await groupsAPI.leaveGroup(groupId);
      toast.success('Successfully left the group');
      fetchGroups();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to leave group');
    }
  };

  const filteredGroups = (activeTab === 'discover' ? groups : myGroups).filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.topicFocus?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMember = (group) => {
    return group.members?.some((m) => m._id === userData._id || m === userData._id);
  };

  const groupTypes = [
    { value: 'FocusedSpace', label: 'Focused Space', description: 'Goal-oriented discussions' },
    { value: 'AnonymousVent', label: 'Anonymous Vent', description: 'Share anonymously' },
    { value: 'StudyGroup', label: 'Study Group', description: 'Academic support' },
    { value: 'WellnessCircle', label: 'Wellness Circle', description: 'Health & wellness' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading groups...</p>
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
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Groups</h1>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full bg-black hover:bg-gray-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Discover Groups
          </button>
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === 'my-groups'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Groups ({myGroups.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-3 rounded-full border-2 border-gray-300"
          />
        </div>

        {/* Groups Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <Card
                key={group._id}
                className="border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                    {group.type || 'Group'}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                {group.topicFocus && (
                  <p className="text-gray-600 text-sm mb-4">{group.topicFocus}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.members?.length || 0} members
                  </span>
                </div>

                <div className="flex gap-2">
                  {isMember(group) ? (
                    <>
                      <Button
                        onClick={() => onNavigate(`group-chat-${group._id}`)}
                        className="flex-1 rounded-full bg-black hover:bg-gray-800"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Chat
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleLeaveGroup(group._id)}
                        className="rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleJoinGroup(group._id)}
                      className="w-full rounded-full bg-black hover:bg-gray-800"
                    >
                      Join Group
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">No groups found</h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'my-groups'
                  ? "You haven't joined any groups yet"
                  : 'Try a different search term or create a new group'}
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Group
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md rounded-2xl p-6 bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name *</Label>
                <Input
                  id="groupName"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Enter group name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Group Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {groupTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setNewGroup({ ...newGroup, type: type.value })}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        newGroup.type === type.value
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="topicFocus">Topic/Description</Label>
                <Textarea
                  id="topicFocus"
                  value={newGroup.topicFocus}
                  onChange={(e) => setNewGroup({ ...newGroup, topicFocus: e.target.value })}
                  placeholder="What is this group about?"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-full border-2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 rounded-full bg-black hover:bg-gray-800">
                  Create Group
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

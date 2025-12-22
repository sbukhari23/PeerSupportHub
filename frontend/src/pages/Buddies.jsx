import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import {
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  MessageCircle,
  Check,
  X,
  Bell,
  TrendingUp,
  Clock,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, profileAPI, setLogoutCallback } from '../services/api';
import { TopNavBar } from '../components/TopNavBar';

export function Buddies({ onNavigate }) {
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [findSearchTerm, setFindSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('buddies'); // 'buddies', 'requests', or 'find'

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchBuddyData();
  }, [onNavigate]);

  // Search for users when activeTab is 'find' and search term changes
  useEffect(() => {
    if (activeTab === 'find') {
      const searchUsers = async () => {
        setIsSearching(true);
        try {
          const results = await profileAPI.searchUsers(findSearchTerm, 20);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching users:', error);
          toast.error('Failed to search users');
        } finally {
          setIsSearching(false);
        }
      };

      // Debounce search
      const timeoutId = setTimeout(searchUsers, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [findSearchTerm, activeTab]);

  // Initial load when switching to Find tab
  useEffect(() => {
    if (activeTab === 'find' && searchResults.length === 0) {
      const loadInitialUsers = async () => {
        setIsSearching(true);
        try {
          const results = await profileAPI.searchUsers('', 20);
          setSearchResults(results);
        } catch (error) {
          console.error('Error loading users:', error);
        } finally {
          setIsSearching(false);
        }
      };
      loadInitialUsers();
    }
  }, [activeTab]);

  const fetchBuddyData = async () => {
    try {
      const [buddiesData, requestsData, sentData] = await Promise.all([
        profileAPI.getBuddies().catch(() => []),
        profileAPI.getBuddyRequests().catch(() => []),
        profileAPI.getSentBuddyRequests().catch(() => []),
      ]);
      setBuddies(buddiesData);
      setPendingRequests(requestsData);
      setSentRequests(sentData);
    } catch (error) {
      console.error('Error fetching buddy data:', error);
      toast.error('Failed to load buddies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await profileAPI.acceptBuddyRequest(requestId);
      toast.success('Buddy request accepted!');
      fetchBuddyData();
      // Refresh search results if on find tab
      if (activeTab === 'find') {
        const results = await profileAPI.searchUsers(findSearchTerm, 20);
        setSearchResults(results);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await profileAPI.rejectBuddyRequest(requestId);
      toast.success('Request declined');
      fetchBuddyData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to reject request');
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await profileAPI.sendBuddyRequest(userId);
      toast.success('Buddy request sent!');
      // Update the search results to reflect pending status
      setSearchResults(prev => 
        prev.map(user => 
          user._id === userId ? { ...user, buddyStatus: 'pending_sent' } : user
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send request');
    }
  };

  const filteredBuddies = buddies.filter(
    (buddy) =>
      buddy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      buddy.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading buddies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Top Navigation Bar */}
      <TopNavBar currentPage="buddies" onNavigate={onNavigate} />
      
      {/* Header */}
      <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">Accountability Buddies</h1>
            </div>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-muted"
              >
                <Bell className="w-6 h-6 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('buddies')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === 'buddies'
                ? 'bg-black text-white dark:bg-primary dark:text-primary-foreground'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80'
            }`}
          >
            My Buddies ({buddies.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-full font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-black text-white dark:bg-primary dark:text-primary-foreground'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted/80'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === 'find'
                ? 'bg-blue-600 text-white dark:bg-blue-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Find Buddies
          </button>
        </div>

        {/* My Buddies Tab */}
        {activeTab === 'buddies' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search your buddies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 rounded-full border-2 border-gray-300 dark:border-input dark:bg-input dark:text-foreground"
              />
            </div>

            {/* Buddies List */}
            <div className="space-y-4">
              {filteredBuddies.length > 0 ? (
                filteredBuddies.map((buddy) => (
                  <Card
                    key={buddy._id}
                    className="border-2 border-gray-200 rounded-2xl p-4 hover:border-gray-400 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {buddy.avatarUrl ? (
                        <img 
                          src={buddy.avatarUrl}
                          alt={buddy.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xl font-bold">
                          {buddy.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{buddy.name}</h3>
                        <p className="text-gray-500 text-sm">@{buddy.username}</p>
                        {buddy.onboardingIntent && (
                          <p className="text-gray-600 text-sm mt-1">{buddy.onboardingIntent}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {buddy.currentProgressScore !== undefined && (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">{buddy.currentProgressScore}</span>
                          </div>
                        )}
                        <Button
                          onClick={() => onNavigate(`messages-${buddy._id}`)}
                          variant="outline"
                          className="rounded-full border-2"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No buddies yet</h3>
                  <p className="text-gray-500 mb-4">
                    Find and connect with other users to become accountability buddies
                  </p>
                  <Button onClick={() => setActiveTab('find')} className="rounded-full bg-blue-600 hover:bg-blue-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find Buddies
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Received Requests */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Received Requests ({pendingRequests.length})
              </h2>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <Card
                      key={request._id}
                      className="border-2 border-gray-200 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-xl font-bold text-blue-600">
                          {request.sender?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{request.sender?.name}</h3>
                          <p className="text-gray-500 text-sm">@{request.sender?.username}</p>
                          <p className="text-gray-600 text-sm mt-1">Wants to be your accountability buddy</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptRequest(request._id)}
                            className="rounded-full bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request._id)}
                            variant="outline"
                            className="rounded-full border-2 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center border-2 border-gray-200 rounded-2xl">
                  <p className="text-gray-500">No pending requests received</p>
                </Card>
              )}
            </div>

            {/* Sent Requests */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Sent Requests ({sentRequests.length})
              </h2>
              {sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((request) => (
                    <Card
                      key={request._id}
                      className="border-2 border-yellow-200 bg-yellow-50/50 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full flex items-center justify-center text-xl font-bold text-yellow-600">
                          {request.recipient?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{request.recipient?.name}</h3>
                          <p className="text-gray-500 text-sm">@{request.recipient?.username}</p>
                          <p className="text-yellow-600 text-sm mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Awaiting response
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                          Pending
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center border-2 border-gray-200 rounded-2xl">
                  <p className="text-gray-500">You haven't sent any buddy requests yet</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Find Buddies Tab */}
        {activeTab === 'find' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users by name or username..."
                value={findSearchTerm}
                onChange={(e) => setFindSearchTerm(e.target.value)}
                className="pl-12 py-3 rounded-full border-2 border-blue-300"
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
              )}
            </div>

            {/* Search Results */}
            <div className="space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <Card
                    key={user._id}
                    className={`border-2 rounded-2xl p-4 transition-colors ${
                      user.buddyStatus === 'buddy' 
                        ? 'border-green-200 bg-green-50/50'
                        : user.buddyStatus === 'pending_sent'
                        ? 'border-yellow-200 bg-yellow-50/50'
                        : user.buddyStatus === 'pending_received'
                        ? 'border-blue-200 bg-blue-50/50'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                          user.buddyStatus === 'buddy'
                            ? 'bg-gradient-to-br from-green-200 to-green-300 text-green-700'
                            : 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600'
                        }`}>
                          {user.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-gray-500 text-sm">@{user.username}</p>
                        {user.onboardingIntent && (
                          <p className="text-gray-600 text-sm mt-1">{user.onboardingIntent}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {user.currentProgressScore !== undefined && user.currentProgressScore > 0 && (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-medium">{user.currentProgressScore}</span>
                          </div>
                        )}
                        
                        {/* Action button based on status */}
                        {user.buddyStatus === 'buddy' && (
                          <Button
                            onClick={() => onNavigate(`messages-${user._id}`)}
                            variant="outline"
                            className="rounded-full border-2 border-green-500 text-green-600"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                        )}
                        
                        {user.buddyStatus === 'pending_sent' && (
                          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-100 px-4 py-2 rounded-full">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        )}
                        
                        {user.buddyStatus === 'pending_received' && (
                          <Button
                            onClick={() => setActiveTab('requests')}
                            className="rounded-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            View Request
                          </Button>
                        )}
                        
                        {user.buddyStatus === 'none' && (
                          <Button
                            onClick={() => handleSendRequest(user._id)}
                            className="rounded-full bg-blue-600 hover:bg-blue-700"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Send Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : isSearching ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Searching users...</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600 mb-2">No users found</h3>
                  <p className="text-gray-500">
                    Try searching with a different name or username
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

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
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, profileAPI, setLogoutCallback } from '../services/api';

export function Buddies({ onNavigate }) {
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('buddies'); // 'buddies' or 'requests'

  useEffect(() => {
    setLogoutCallback(onNavigate);
    
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }

    fetchBuddyData();
  }, [onNavigate]);

  const fetchBuddyData = async () => {
    try {
      const [buddiesData, requestsData] = await Promise.all([
        profileAPI.getBuddies().catch(() => []),
        profileAPI.getBuddyRequests().catch(() => []),
      ]);
      setBuddies(buddiesData);
      setPendingRequests(requestsData);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Accountability Buddies</h1>
            </div>
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab('requests')}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                <Bell className="w-6 h-6" />
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
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('buddies')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === 'buddies'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            My Buddies ({buddies.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-full font-medium transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pending Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'buddies' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search buddies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 rounded-full border-2 border-gray-300"
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
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-xl font-bold">
                        {buddy.name?.charAt(0) || '?'}
                      </div>
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
                    Connect with other users in groups to send buddy requests
                  </p>
                  <Button onClick={() => onNavigate('groups')} className="rounded-full">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Find People in Groups
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
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
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">No pending requests</h3>
                <p className="text-gray-500">
                  When someone sends you a buddy request, it will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

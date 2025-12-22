import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Trophy,
  Users,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Medal,
  Clock,
  ChevronRight,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, challengesAPI, setLogoutCallback } from '../services/api';
import { TopNavBar } from '../components/TopNavBar';

export function Challenges({ onNavigate }) {
  const [challenges, setChallenges] = useState([]);
  const [myChallenges, setMyChallenges] = useState([]);
  const [trending, setTrending] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover'); // 'discover', 'my-challenges', 'leaderboard'
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [leaveChallengeId, setLeaveChallengeId] = useState(null);
  const [logValue, setLogValue] = useState(1);

  // User data available if needed for future features
  // const userData = authAPI.getCurrentUser() || {};

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
      const [challengesData, myData, trendingData, leaderboardData] = await Promise.all([
        challengesAPI.getChallenges({ status: 'active' }).catch(() => ({ challenges: [] })),
        challengesAPI.getMyChallenges().catch(() => ({ challenges: [] })),
        challengesAPI.getTrending().catch(() => []),
        challengesAPI.getGlobalLeaderboard().catch(() => []),
      ]);
      setChallenges(challengesData.challenges || []);
      setMyChallenges(myData.challenges || []);
      setTrending(trendingData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await challengesAPI.joinChallenge(challengeId);
      toast.success('Successfully joined the challenge! 🎯');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to join challenge');
    }
  };

  const handleLogProgress = async () => {
    if (!selectedChallenge) return;
    
    try {
      await challengesAPI.logProgress(selectedChallenge._id || selectedChallenge.challengeId, {
        value: logValue,
        notes: '',
      });
      toast.success('Progress logged! Keep it up! 🔥');
      setShowLogModal(false);
      setSelectedChallenge(null);
      setLogValue(1);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to log progress');
    }
  };

  const handleLeaveChallenge = async (challengeId) => {
    setLeaveChallengeId(challengeId);
  };

  const confirmLeaveChallenge = async () => {
    if (!leaveChallengeId) return;
    try {
      await challengesAPI.leaveChallenge(leaveChallengeId);
      toast.success('Left the challenge');
      setLeaveChallengeId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to leave challenge');
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Individual': return <Target className="w-4 h-4" />;
      case 'Team': return <Users className="w-4 h-4" />;
      case 'Community': return <Trophy className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <TopNavBar currentPage="challenges" onNavigate={onNavigate} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Challenges</h1>
                <p className="text-sm text-gray-500">Compete, grow, and achieve together</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'discover', label: 'Discover', icon: <Target className="w-4 h-4" /> },
            { id: 'my-challenges', label: 'My Challenges', icon: <Flame className="w-4 h-4" /> },
            { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'my-challenges' && myChallenges.length > 0 && (
                <span className="ml-1 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full">
                  {myChallenges.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trending Section */}
        {activeTab === 'discover' && trending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Trending Now
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {trending.slice(0, 3).map((challenge) => (
                <Card key={challenge._id} className="min-w-[280px] p-4 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      {challenge.participantCount || 0}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2">{challenge.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{challenge.description}</p>
                  <Button 
                    onClick={() => handleJoinChallenge(challenge._id)}
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    size="sm"
                  >
                    Join Challenge
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <Card key={challenge._id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(challenge.type)}
                      <span className="text-sm text-gray-500">{challenge.type}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                      {challenge.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{challenge.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{challenge.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {challenge.participantCount || 0} joined
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {challenge.duration} days
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {challenge.category}
                    </span>
                    <Button 
                      onClick={() => handleJoinChallenge(challenge._id)}
                      size="sm"
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Join
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No challenges available</h3>
                <p className="text-gray-500">Check back later for new challenges!</p>
              </div>
            )}
          </div>
        )}

        {/* My Challenges Tab */}
        {activeTab === 'my-challenges' && (
          <div className="space-y-6">
            {myChallenges.length > 0 ? (
              myChallenges.map((participation) => {
                const challenge = participation.challengeId || participation;
                const progress = participation.currentProgress || 0;
                const target = challenge.targetValue || 100;
                const progressPercent = Math.min((progress / target) * 100, 100);
                
                return (
                  <Card key={participation._id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{challenge.title}</h3>
                          {participation.status === 'completed' && (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{challenge.description}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        participation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        participation.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {participation.status}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress} / {target}</span>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {participation.currentStreak || 0} day streak
                        </span>
                        <span className="flex items-center gap-1">
                          <Medal className="w-4 h-4 text-yellow-500" />
                          Rank #{participation.rank || '-'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {participation.status === 'active' && (
                          <Button 
                            onClick={() => {
                              setSelectedChallenge(participation);
                              setShowLogModal(true);
                            }}
                            size="sm"
                            className="rounded-full"
                          >
                            Log Progress
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleLeaveChallenge(participation._id)}
                          variant="outline"
                          size="sm"
                          className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Leave
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active challenges</h3>
                <p className="text-gray-500 mb-4">Join a challenge to start competing!</p>
                <Button onClick={() => setActiveTab('discover')} className="rounded-full">
                  Browse Challenges
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Global Leaderboard - This Week
              </h2>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry._id || index}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                        index === 1 ? 'bg-gray-50 border border-gray-200' :
                        index === 2 ? 'bg-orange-50 border border-orange-200' :
                        'bg-white border border-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{entry.userId?.name || entry.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-500">@{entry.userId?.username || entry.username || 'user'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{entry.totalPoints || entry.points || 0}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Medal className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No leaderboard data yet</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>

      {/* Log Progress Modal */}
      {showLogModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Log Progress</h3>
            <p className="text-gray-600 mb-4">
              {selectedChallenge.challengeId?.title || selectedChallenge.title}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Progress Value</label>
              <input
                type="number"
                min="1"
                value={logValue}
                onChange={(e) => setLogValue(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLogModal(false);
                  setSelectedChallenge(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleLogProgress} className="flex-1">
                Log Progress
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Leave Challenge Confirmation Dialog */}
      <ConfirmDialog
        open={!!leaveChallengeId}
        onOpenChange={(open) => !open && setLeaveChallengeId(null)}
        title="Leave Challenge"
        description="Are you sure you want to leave this challenge? Your progress will be saved but you'll no longer be part of the leaderboard."
        confirmText="Leave"
        variant="warning"
        onConfirm={confirmLeaveChallenge}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  Users,
  Star,
  Calendar,
  Clock,
  MessageCircle,
  Search,
  Award,
  CheckCircle2,
  X,
  ChevronRight,
  Video,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, mentorsAPI, setLogoutCallback } from '../services/api';

export function Mentors({ onNavigate }) {
  const [mentors, setMentors] = useState([]);
  const [mySessions, setMySessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse', 'sessions', 'become-mentor'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [cancelSessionId, setCancelSessionId] = useState(null);
  
  const [bookingData, setBookingData] = useState({
    sessionDate: '',
    sessionTime: '',
    topic: '',
    notes: '',
  });

  const [mentorProfile, setMentorProfile] = useState({
    expertise: [],
    bio: '',
    oneOnOneLink: '',
    meetingLink: '',
  });

  const expertiseOptions = [
    'Study Skills',
    'Time Management',
    'Career Guidance',
    'Mental Wellness',
    'Productivity',
    'Goal Setting',
    'Stress Management',
    'Work-Life Balance',
  ];

  const userData = authAPI.getCurrentUser() || {};

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
      const [mentorsData, sessionsData, historyData, profileData] = await Promise.all([
        mentorsAPI.getMentors().catch(() => ({ mentors: [] })),
        mentorsAPI.getUpcomingSessions().catch(() => []),
        mentorsAPI.getSessionHistory().catch(() => ({ sessions: [] })),
        mentorsAPI.getMyMentorProfile().catch(() => null),
      ]);
      setMentors(mentorsData.mentors || mentorsData || []);
      setMySessions(sessionsData.sessions || sessionsData || []);
      setSessionHistory(historyData.sessions || historyData || []);
      setMyProfile(profileData);
      
      if (profileData) {
        setMentorProfile({
          expertise: profileData.expertise || [],
          bio: profileData.bio || '',
          oneOnOneLink: profileData.oneOnOneLink || '',
          meetingLink: profileData.meetingLink || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!selectedMentor || !bookingData.sessionDate || !bookingData.topic) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const sessionDateTime = new Date(`${bookingData.sessionDate}T${bookingData.sessionTime || '10:00'}`);
      
      await mentorsAPI.bookSession(selectedMentor.userId?._id || selectedMentor._id, {
        sessionDate: sessionDateTime.toISOString(),
        topic: bookingData.topic,
        notes: bookingData.notes,
      });
      
      toast.success('Session booked successfully! 📅');
      setShowBookingModal(false);
      setSelectedMentor(null);
      setBookingData({ sessionDate: '', sessionTime: '', topic: '', notes: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to book session');
    }
  };

  const handleCancelSession = async (sessionId) => {
    setCancelSessionId(sessionId);
  };

  const confirmCancelSession = async () => {
    if (!cancelSessionId) return;
    try {
      await mentorsAPI.cancelSession(cancelSessionId);
      toast.success('Session cancelled');
      setCancelSessionId(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to cancel session');
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await mentorsAPI.completeSession(sessionId);
      toast.success('Session marked as completed!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to complete session');
    }
  };

  const handleRateSession = async () => {
    if (!showRatingModal) return;

    try {
      await mentorsAPI.rateSession(showRatingModal, rating, feedback);
      toast.success('Thank you for your feedback! ⭐');
      setShowRatingModal(null);
      setRating(5);
      setFeedback('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to submit rating');
    }
  };

  const handleUpdateMentorProfile = async () => {
    if (!mentorProfile.bio.trim()) {
      toast.error('Please add a bio');
      return;
    }

    try {
      await mentorsAPI.updateMentorProfile(mentorProfile);
      toast.success('Mentor profile updated! 🎉');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update profile');
    }
  };

  const toggleExpertise = (expertise) => {
    setMentorProfile(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise],
    }));
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.expertise?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
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
          <p className="mt-4 text-gray-600">Loading mentors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Mentorship</h1>
                <p className="text-sm text-gray-500">Connect with experienced mentors</p>
              </div>
            </div>
            <Award className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'browse', label: 'Find Mentors', icon: <Search className="w-4 h-4" /> },
            { id: 'sessions', label: 'My Sessions', icon: <Calendar className="w-4 h-4" /> },
            { id: 'become-mentor', label: 'Become a Mentor', icon: <Award className="w-4 h-4" /> },
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
            </button>
          ))}
        </div>

        {/* Browse Mentors Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search mentors by name or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-3 rounded-full"
              />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.length > 0 ? (
                filteredMentors.map((mentor) => (
                  <Card key={mentor._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        {mentor.userId?.name?.charAt(0) || 'M'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{mentor.userId?.name || 'Mentor'}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{mentor.averageRating?.toFixed(1) || 'New'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{mentor.completedSessions || 0} sessions</span>
                        </div>
                      </div>
                      {mentor.isVerified && (
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      )}
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{mentor.bio}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {mentor.expertise?.slice(0, 3).map((exp, i) => (
                        <span key={i} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {exp}
                        </span>
                      ))}
                      {mentor.expertise?.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          +{mentor.expertise.length - 3}
                        </span>
                      )}
                    </div>

                    <Button 
                      onClick={() => {
                        setSelectedMentor(mentor);
                        setShowBookingModal(true);
                      }}
                      className="w-full rounded-full"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Book Session
                    </Button>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No mentors found</h3>
                  <p className="text-gray-500">Try a different search or check back later</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* My Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Upcoming Sessions</h2>
              {mySessions.length > 0 ? (
                <div className="space-y-4">
                  {mySessions.map((session) => (
                    <Card key={session._id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.topic}</h3>
                            <p className="text-sm text-gray-500">
                              with {session.mentorId?.userId?.name || session.menteeId?.name || 'User'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatDate(session.sessionDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.status === 'scheduled' && (
                            <>
                              {userData._id === session.mentorId?.userId?._id && (
                                <Button
                                  onClick={() => handleCompleteSession(session._id)}
                                  size="sm"
                                  className="rounded-full"
                                >
                                  Complete
                                </Button>
                              )}
                              <Button
                                onClick={() => handleCancelSession(session._id)}
                                variant="outline"
                                size="sm"
                                className="rounded-full text-red-600 border-red-200"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming sessions</p>
                  <Button
                    onClick={() => setActiveTab('browse')}
                    variant="outline"
                    className="mt-4 rounded-full"
                  >
                    Find a Mentor
                  </Button>
                </Card>
              )}
            </div>

            {/* Session History */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Past Sessions</h2>
              {sessionHistory.length > 0 ? (
                <div className="space-y-4">
                  {sessionHistory.map((session) => (
                    <Card key={session._id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            session.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <CheckCircle2 className={`w-6 h-6 ${
                              session.status === 'completed' ? 'text-green-600' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="font-semibold">{session.topic}</h3>
                            <p className="text-sm text-gray-500">
                              {formatDate(session.sessionDate)}
                            </p>
                            {session.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < session.rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {session.status === 'completed' && !session.rating && userData._id === session.menteeId?._id && (
                          <Button
                            onClick={() => setShowRatingModal(session._id)}
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            Rate
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No past sessions yet</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Become a Mentor Tab */}
        {activeTab === 'become-mentor' && (
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                {myProfile ? 'Your Mentor Profile' : 'Become a Mentor'}
              </h2>
              <p className="text-gray-600">
                {myProfile 
                  ? 'Update your profile to attract more mentees'
                  : 'Share your expertise and help others grow'
                }
              </p>
            </div>

            {/* Approval Status Banner */}
            {myProfile && (
              <div className={`mb-6 p-4 rounded-lg ${
                myProfile.approvalStatus === 'approved' 
                  ? 'bg-green-50 border border-green-200'
                  : myProfile.approvalStatus === 'rejected'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-2">
                  {myProfile.approvalStatus === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Your mentor profile is approved!</span>
                    </>
                  ) : myProfile.approvalStatus === 'rejected' ? (
                    <>
                      <X className="w-5 h-5 text-red-600" />
                      <div>
                        <span className="font-medium text-red-800">Application was not approved</span>
                        {myProfile.rejectionReason && (
                          <p className="text-sm text-red-600 mt-1">{myProfile.rejectionReason}</p>
                        )}
                        <p className="text-sm text-red-600 mt-1">Update your profile and resubmit for review.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Pending admin approval</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-2">About You *</label>
                <Textarea
                  value={mentorProfile.bio}
                  onChange={(e) => setMentorProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell potential mentees about your experience and how you can help them..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-sm font-medium mb-2">Areas of Expertise</label>
                <div className="flex flex-wrap gap-2">
                  {expertiseOptions.map((exp) => (
                    <button
                      key={exp}
                      onClick={() => toggleExpertise(exp)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        mentorProfile.expertise.includes(exp)
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Meeting Link</label>
                <Input
                  value={mentorProfile.meetingLink}
                  onChange={(e) => setMentorProfile(prev => ({ ...prev, meetingLink: e.target.value }))}
                  placeholder="https://zoom.us/j/your-meeting-id or Google Meet link"
                />
                <p className="text-xs text-gray-500 mt-1">This link will be shared with mentees when sessions are booked</p>
              </div>

              {/* Scheduling Link */}
              <div>
                <label className="block text-sm font-medium mb-2">Scheduling Link (optional)</label>
                <Input
                  value={mentorProfile.oneOnOneLink}
                  onChange={(e) => setMentorProfile(prev => ({ ...prev, oneOnOneLink: e.target.value }))}
                  placeholder="https://calendly.com/yourname"
                />
                <p className="text-xs text-gray-500 mt-1">Add a Calendly or other scheduling link for mentees to book time</p>
              </div>

              <Button onClick={handleUpdateMentorProfile} className="w-full rounded-full">
                {myProfile 
                  ? myProfile.approvalStatus === 'rejected'
                    ? 'Resubmit Application'
                    : 'Update Profile'
                  : 'Submit Application'
                }
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* Booking Modal */}
      {showBookingModal && selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Book a Session</h3>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedMentor(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {selectedMentor.userId?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <p className="font-medium">{selectedMentor.userId?.name}</p>
                <p className="text-sm text-gray-500">{selectedMentor.expertise?.slice(0, 2).join(', ')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <Input
                  type="date"
                  value={bookingData.sessionDate}
                  onChange={(e) => setBookingData(prev => ({ ...prev, sessionDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time</label>
                <Input
                  type="time"
                  value={bookingData.sessionTime}
                  onChange={(e) => setBookingData(prev => ({ ...prev, sessionTime: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Topic *</label>
                <Input
                  value={bookingData.topic}
                  onChange={(e) => setBookingData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="What would you like to discuss?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <Textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any specific questions or context..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedMentor(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleBookSession} className="flex-1">
                Book Session
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-6 text-center">Rate Your Session</h3>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Feedback (optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRatingModal(null);
                  setRating(5);
                  setFeedback('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleRateSession} className="flex-1">
                Submit Rating
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Cancel Session Confirmation Dialog */}
      <ConfirmDialog
        open={!!cancelSessionId}
        onOpenChange={(open) => !open && setCancelSessionId(null)}
        title="Cancel Session"
        description="Are you sure you want to cancel this mentoring session? The mentor will be notified of the cancellation."
        confirmText="Cancel Session"
        variant="warning"
        onConfirm={confirmCancelSession}
      />
    </div>
  );
}

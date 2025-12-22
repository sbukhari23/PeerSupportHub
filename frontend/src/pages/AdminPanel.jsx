import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { 
  ArrowLeft, Users, FileText, Shield, BarChart3, Loader2, 
  Search, Ban, CheckCircle, Trash2, Eye, AlertTriangle, RefreshCw,
  TrendingUp, Activity, Calendar, MessageSquare, Award, X, Clock, Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { adminAPI, authAPI, setLogoutCallback } from '../services/api';
import { toast } from 'sonner';
import { TopNavBar } from '../components/TopNavBar';

export function AdminPanel({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [mentorApplications, setMentorApplications] = useState([]);
  const [pendingMentorCount, setPendingMentorCount] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [habitTemplates, setHabitTemplates] = useState([]);
  const [pendingTemplatesCount, setPendingTemplatesCount] = useState(0);

  // Set logout callback
  useEffect(() => {
    setLogoutCallback(onNavigate);
  }, [onNavigate]);

  // Check authentication and admin status
  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      onNavigate('login');
      return;
    }
    // Check if user is admin (this should be verified by backend)
    const user = authAPI.getCurrentUser() || {};
    if (user.userType !== 'Admin') {
      toast.error('Access denied. Admin privileges required.');
      onNavigate('dashboard');
      return;
    }
    fetchAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNavigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, reportsRes, flaggedRes, mentorAppsRes, templatesRes] = await Promise.all([
        adminAPI.getStats().catch(() => null),
        adminAPI.getUsers().catch(() => ({ users: [] })),
        adminAPI.getReports().catch(() => []),
        adminAPI.getFlaggedContent().catch(() => []),
        adminAPI.getMentorApplications({ status: 'pending' }).catch(() => ({ applications: [], pendingCount: 0 })),
        adminAPI.getHabitTemplates().catch(() => [])
      ]);
      
      setStats(statsRes || defaultStats);
      // usersRes returns { users: [], total, currentPage, totalPages }
      const usersArray = Array.isArray(usersRes) ? usersRes : (usersRes?.users || []);
      setUsers(usersArray);
      setReports(Array.isArray(reportsRes) ? reportsRes : []);
      // flaggedRes returns { flaggedFeedback: [], flaggedMessages: [] }
      const combinedFlagged = [
        ...(flaggedRes?.flaggedFeedback || []).map(f => ({ ...f, type: 'feedback' })),
        ...(flaggedRes?.flaggedMessages || []).map(m => ({ ...m, type: 'message' }))
      ];
      setFlaggedContent(combinedFlagged);
      setMentorApplications(mentorAppsRes?.applications || []);
      setPendingMentorCount(mentorAppsRes?.pendingCount || 0);
      
      const templates = Array.isArray(templatesRes) ? templatesRes : [];
      setHabitTemplates(templates);
      setPendingTemplatesCount(templates.filter(t => !t.isPublic).length);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Default stats for fallback
  const defaultStats = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalGroups: 0,
    totalHabits: 0,
    totalMessages: 0,
    pendingReports: 0,
    flaggedContent: 0
  };

  const handleBanUser = async (userId) => {
    try {
      await adminAPI.banUser(userId);
      toast.success('User banned successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminAPI.unbanUser(userId);
      toast.success('User unbanned successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Failed to unban user');
    }
  };

  const handleDeleteContent = async (contentId, contentType) => {
    try {
      await adminAPI.deleteContent(contentId, contentType);
      toast.success('Content deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const handleResolveContent = async (contentId, contentType) => {
    try {
      await adminAPI.resolveContent(contentId, contentType);
      toast.success('Content resolved successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error resolving content:', error);
      toast.error('Failed to resolve content');
    }
  };

  const handleResolveReport = async (reportId) => {
    try {
      await adminAPI.resolveReport(reportId);
      toast.success('Report resolved');
      fetchAdminData();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleApproveMentor = async (applicationId) => {
    try {
      await adminAPI.approveMentorApplication(applicationId);
      toast.success('Mentor application approved!');
      fetchAdminData();
    } catch (error) {
      console.error('Error approving mentor:', error);
      toast.error('Failed to approve mentor application');
    }
  };

  const handleRejectMentor = async () => {
    if (!showRejectModal) return;
    
    try {
      await adminAPI.rejectMentorApplication(showRejectModal, rejectionReason);
      toast.success('Mentor application rejected');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchAdminData();
    } catch (error) {
      console.error('Error rejecting mentor:', error);
      toast.error('Failed to reject mentor application');
    }
  };

  const handleApproveTemplate = async (templateId) => {
    try {
      await adminAPI.approveHabitTemplate(templateId);
      toast.success('Template approved and made public!');
      fetchAdminData();
    } catch (error) {
      console.error('Error approving template:', error);
      toast.error('Failed to approve template');
    }
  };

  const handleRevokeTemplate = async (templateId) => {
    try {
      await adminAPI.revokeHabitTemplate(templateId);
      toast.success('Template public status revoked');
      fetchAdminData();
    } catch (error) {
      console.error('Error revoking template:', error);
      toast.error('Failed to revoke template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await adminAPI.deleteHabitTemplate(templateId);
      toast.success('Template deleted successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Filter users based on search
  const filteredUsers = Array.isArray(users) ? users.filter(user =>
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'mentors', label: `Mentor Applications${pendingMentorCount > 0 ? ` (${pendingMentorCount})` : ''}`, icon: Award },
    { id: 'templates', label: `Habit Templates${pendingTemplatesCount > 0 ? ` (${pendingTemplatesCount})` : ''}`, icon: Target },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'content', label: 'Flagged Content', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <TopNavBar currentPage="admin" onNavigate={onNavigate} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-600" />
              <h1 className="text-2xl font-bold">Admin Panel</h1>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={fetchAdminData}
            className="rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full ${activeTab === tab.id ? 'bg-black hover:bg-gray-800' : ''}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                    <p className="text-gray-500 text-sm">Total Users</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
                    <p className="text-gray-500 text-sm">Active Today</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.newUsersToday || 0}</p>
                    <p className="text-gray-500 text-sm">New Today</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.pendingReports || reports.length}</p>
                    <p className="text-gray-500 text-sm">Pending Reports</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <Calendar className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-xl font-bold">{stats?.totalGroups || 0}</p>
                    <p className="text-gray-500 text-sm">Total Groups</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-xl font-bold">{stats?.totalHabits || 0}</p>
                    <p className="text-gray-500 text-sm">Total Habits</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-gray-200 rounded-2xl">
                <div className="flex items-center gap-4">
                  <MessageSquare className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="text-xl font-bold">{stats?.totalMessages || 0}</p>
                    <p className="text-gray-500 text-sm">Total Messages</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <Card className="p-8 text-center border-2 border-gray-200 rounded-2xl">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No users found</p>
                </Card>
              ) : (
                filteredUsers.map((user) => (
                  <Card key={user._id} className="p-4 border-2 border-gray-200 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-600">
                            {user.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold">{user.name}</p>
                          <p className="text-gray-500 text-sm">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              user.userType === 'Admin' ? 'bg-red-100 text-red-700' :
                              user.userType === 'Mentor' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {user.userType || 'User'}
                            </span>
                            {user.isBanned && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                                Banned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          className="rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {user.isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user._id)}
                            className="rounded-full text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanUser(user._id)}
                            className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Ban className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <Card className="p-8 text-center border-2 border-gray-200 rounded-2xl">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending reports</p>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report._id} className="p-6 border-2 border-gray-200 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <span className="font-bold capitalize">{report.type} Report</span>
                      </div>
                      <p className="text-gray-700 mb-2">{report.reason}</p>
                      <p className="text-gray-500 text-sm">
                        Reported by: {report.reportedBy?.name || 'Anonymous'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Target: {report.targetUser?.name || report.targetContent || 'Unknown'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleResolveReport(report._id)}
                      className="rounded-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Resolve
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Mentor Applications Tab */}
        {activeTab === 'mentors' && (
          <div className="space-y-4">
            {mentorApplications.length === 0 ? (
              <Card className="p-8 text-center border-2 border-gray-200 rounded-2xl">
                <Award className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-gray-500">No pending mentor applications</p>
              </Card>
            ) : (
              mentorApplications.map((application) => (
                <Card key={application._id} className="p-6 border-2 border-gray-200 rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                        {application.userId?.name?.charAt(0) || 'M'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-lg">{application.userId?.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            application.approvalStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : application.approvalStatus === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {application.approvalStatus}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-2">{application.userId?.email}</p>
                        
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Bio:</p>
                          <p className="text-gray-600 text-sm line-clamp-3">{application.bio}</p>
                        </div>
                        
                        {application.expertise?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Expertise:</p>
                            <div className="flex flex-wrap gap-1">
                              {application.expertise.map((exp, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                  {exp}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {application.meetingLink && (
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Meeting Link:</span> {application.meetingLink}
                          </p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-2">
                          Applied: {new Date(application.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleApproveMentor(application._id)}
                        className="rounded-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectModal(application._id)}
                        className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Habit Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            {habitTemplates.length === 0 ? (
              <Card className="p-8 text-center border-2 border-gray-200 rounded-2xl">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No habit templates found</p>
              </Card>
            ) : (
              <>
                {/* Pending Templates */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Pending Approval ({habitTemplates.filter(t => !t.isPublic).length})</h3>
                  {habitTemplates.filter(t => !t.isPublic).length === 0 ? (
                    <Card className="p-4 border-2 border-gray-200 rounded-xl text-center">
                      <p className="text-gray-500 text-sm">No pending templates</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {habitTemplates.filter(t => !t.isPublic).map((template) => (
                        <Card key={template._id} className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-xl">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold">{template.name}</p>
                                <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs">
                                  Pending
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {template.category}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                              <p className="text-xs text-gray-500">
                                Created by: {template.creatorId?.name || 'Unknown'} ({template.creatorId?.email || 'N/A'})
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(template.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => handleApproveTemplate(template._id)}
                                size="sm"
                                className="rounded-full bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeleteTemplate(template._id)}
                                size="sm"
                                className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Public Templates */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Public Templates ({habitTemplates.filter(t => t.isPublic).length})</h3>
                  {habitTemplates.filter(t => t.isPublic).length === 0 ? (
                    <Card className="p-4 border-2 border-gray-200 rounded-xl text-center">
                      <p className="text-gray-500 text-sm">No public templates</p>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {habitTemplates.filter(t => t.isPublic).map((template) => (
                        <Card key={template._id} className="p-4 border-2 border-green-200 bg-green-50 rounded-xl">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold">{template.name}</p>
                                <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs">
                                  Public
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                  {template.category}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                              <p className="text-xs text-gray-500">
                                Created by: {template.creatorId?.name || 'Unknown'} ({template.creatorId?.email || 'N/A'})
                              </p>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleRevokeTemplate(template._id)}
                                size="sm"
                                className="rounded-full text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Revoke
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeleteTemplate(template._id)}
                                size="sm"
                                className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Flagged Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {flaggedContent.length === 0 ? (
              <Card className="p-8 text-center border-2 border-gray-200 rounded-2xl">
                <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500">No flagged content</p>
              </Card>
            ) : (
              flaggedContent.map((content) => (
                <Card key={content._id} className="p-6 border-2 border-gray-200 rounded-2xl">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-red-500" />
                        <span className="font-bold capitalize">{content.type}</span>
                      </div>
                      <p className="text-gray-700 mb-2 line-clamp-3">{content.text || content.content}</p>
                      <p className="text-gray-500 text-sm">
                        Author: {content.senderId?.name || content.author?.name || 'Unknown'}
                      </p>
                      {content.groupId && (
                        <p className="text-gray-500 text-sm">
                          Group: {content.groupId?.name || 'Unknown group'}
                        </p>
                      )}
                      {content.recipientId && (
                        <p className="text-gray-500 text-sm">
                          To: {content.recipientId?.name || 'Unknown recipient'}
                        </p>
                      )}
                      <p className="text-gray-500 text-sm">
                        Flagged: {content.flaggedAt ? new Date(content.flaggedAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleResolveContent(content._id, content.type)}
                        className="rounded-full text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteContent(content._id, content.type)}
                        className="rounded-full text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {selectedUser.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedUser.name}</p>
                  <p className="text-gray-500">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{selectedUser.role || 'user'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium ${selectedUser.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                    {selectedUser.isBanned ? 'Banned' : 'Active'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Joined</p>
                  <p className="font-medium">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-500">Streak</p>
                  <p className="font-medium">{selectedUser.currentStreak || 0} days</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {selectedUser.isBanned ? (
                  <Button
                    onClick={() => {
                      handleUnbanUser(selectedUser._id);
                      setShowUserModal(false);
                    }}
                    className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unban User
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      handleBanUser(selectedUser._id);
                      setShowUserModal(false);
                    }}
                    variant="destructive"
                    className="flex-1 rounded-full"
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Ban User
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mentor Rejection Modal */}
      <Dialog open={!!showRejectModal} onOpenChange={(open) => !open && setShowRejectModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Reject Mentor Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Please provide a reason for rejecting this application. This will be shared with the applicant.
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectMentor}
                className="flex-1 rounded-full bg-red-600 hover:bg-red-700"
              >
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

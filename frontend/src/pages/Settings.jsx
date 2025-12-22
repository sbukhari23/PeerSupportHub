import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ConfirmDialog } from '../components/ui/confirm-dialog';
import {
  ArrowLeft,
  User,
  Settings as SettingsIcon,
  Bell,
  Shield,
  LogOut,
  Save,
  Camera,
  Globe,
  Moon,
  Sun,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, profileAPI, notificationsAPI, setLogoutCallback } from '../services/api';
import { TopNavBar } from '../components/TopNavBar';

export function Settings({ onNavigate }) {
  const [, setProfile] = useState(null); // Profile state for potential future use
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'notifications', 'preferences'
  const [unreadCount, setUnreadCount] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    gender: '',
    bio: '',
    avatarUrl: null,
  });

  const [settings, setSettings] = useState({
    language: 'en',
    reminders: true,
    emailNotifications: true,
    darkMode: false,
    contentPreference: 'Mixed',
  });

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
      const [profileData, notifCount] = await Promise.all([
        profileAPI.getProfile().catch(() => null),
        notificationsAPI.getUnreadCount().catch(() => ({ count: 0 })),
      ]);
      
      if (profileData) {
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          username: profileData.username || '',
          email: profileData.email || '',
          gender: profileData.gender || '',
          bio: profileData.bio || '',
          avatarUrl: profileData.avatarUrl || null,
        });
        setSettings(profileData.settings || {
          language: 'en',
          reminders: true,
          emailNotifications: true,
          darkMode: false,
          contentPreference: 'Mixed',
        });
      }
      setUnreadCount(notifCount.count || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only image files are allowed (jpg, png, gif, webp)');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await profileAPI.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatarUrl: result.avatarUrl }));
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(error.response?.data?.msg || 'Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      await profileAPI.removeAvatar();
      setFormData(prev => ({ ...prev, avatarUrl: null }));
      toast.success('Profile picture removed!');
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast.error(error.response?.data?.msg || 'Failed to remove profile picture');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await profileAPI.updateProfile({
        name: formData.name,
        username: formData.username,
        gender: formData.gender,
        settings,
      });
      toast.success('Profile updated successfully!');
      
      // Update local storage with new data
      const currentUserData = authAPI.getCurrentUser();
      if (currentUserData) {
        localStorage.setItem('userData', JSON.stringify({
          ...currentUserData,
          name: formData.name,
          username: formData.username,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update profile');
    } finally {
      setIsSaving(false);
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

  const genderOptions = ['Male', 'Female'];
  const contentPreferences = ['Guided', 'Self-directed', 'Mixed'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <TopNavBar currentPage="settings" onNavigate={onNavigate} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
            { id: 'preferences', label: 'Preferences', icon: <SettingsIcon className="w-4 h-4" /> },
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
              {tab.id === 'notifications' && unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card className="p-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b">
              <div className="relative">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {formData.name?.charAt(0) || 'U'}
                  </div>
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <button 
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border hover:bg-gray-50 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{formData.name}</h2>
                <p className="text-gray-500">@{formData.username}</p>
                <p className="text-sm text-gray-400">{formData.email}</p>
                {formData.avatarUrl && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="mt-2 text-sm text-red-500 hover:text-red-600 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove photo
                  </button>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="mt-2 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label>Gender</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {genderOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setFormData(prev => ({ ...prev, gender: option }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.gender === option
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleUpdateProfile} disabled={isSaving} className="rounded-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card className="p-8">
            <h2 className="text-lg font-semibold mb-6">Notification Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-500">Receive reminders and updates</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, reminders: !prev.reminders }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reminders ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.reminders ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive weekly digests and important updates</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.emailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <Button onClick={handleUpdateProfile} disabled={isSaving} className="rounded-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <Card className="p-8">
            <h2 className="text-lg font-semibold mb-6">App Preferences</h2>
            
            <div className="space-y-6">
              {/* Theme */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-3">Theme</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, darkMode: false }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      !settings.darkMode
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, darkMode: true }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      settings.darkMode
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </p>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-2 rounded-lg border bg-white"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {/* Content Preference */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium mb-3">Content Preference</p>
                <div className="flex flex-wrap gap-2">
                  {contentPreferences.map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setSettings(prev => ({ ...prev, contentPreference: pref }))}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        settings.contentPreference === pref
                          ? 'bg-black text-white'
                          : 'bg-white text-gray-700 border hover:bg-gray-100'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {settings.contentPreference === 'Guided' && 'Structured programs and step-by-step guidance'}
                  {settings.contentPreference === 'Self-directed' && 'Flexible approach with full control over your journey'}
                  {settings.contentPreference === 'Mixed' && 'A balance of guided and self-directed content'}
                </p>
              </div>

              <Button onClick={handleUpdateProfile} disabled={isSaving} className="rounded-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </Card>
        )}

        {/* Account Actions */}
        <Card className="mt-8 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600">
            <Shield className="w-5 h-5" />
            Account Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full rounded-full border-red-200 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </Card>
      </main>

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

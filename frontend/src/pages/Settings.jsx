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
  Bell,
  Shield,
  LogOut,
  Save,
  Camera,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, profileAPI, notificationsAPI, setLogoutCallback } from '../services/api';

export function Settings({ onNavigate, defaultTab }) {
  const [, setProfile] = useState(null); // Profile state for potential future use
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab || 'profile'); // 'profile', 'notifications', 'preferences'
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

  // Apply dark mode when settings change
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [settings.darkMode]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => onNavigate('dashboard')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-accent border border-border'
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
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
              <div className="relative">
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-3xl font-bold">
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
                  className="absolute bottom-0 right-0 p-2 bg-card rounded-full shadow-lg border border-border hover:bg-accent disabled:opacity-50"
                >
                  <Camera className="w-4 h-4 text-foreground" />
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
                <h2 className="text-xl font-semibold text-foreground">{formData.name}</h2>
                <p className="text-muted-foreground">@{formData.username}</p>
                <p className="text-sm text-muted-foreground/80">{formData.email}</p>
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
                  className="mt-2 bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
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
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/80'
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
            <h2 className="text-lg font-semibold mb-6 text-foreground">Notification Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive reminders and updates</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, reminders: !prev.reminders }))}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reminders ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.reminders ? 'translate-x-6' : 'translate-x-0.5'
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

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Home,
  Users,
  MessageCircle,
  Target,
  Trophy,
  BookOpen,
  GraduationCap,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { authAPI, profileAPI } from '../services/api';
import { NotificationsDropdown } from './NotificationsDropdown';

export function TopNavBar({ onNavigate }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  const userData = authAPI.getCurrentUser() || {};
  const isAdmin = userData.userType === 'Admin';

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requests = await profileAPI.getBuddyRequests();
        setPendingRequests(requests);
      } catch (error) {
        console.error('Failed to fetch buddy requests', error);
      }
    };

    if (authAPI.isAuthenticated()) {
      fetchRequests();
    }

    // Listen for buddy requests updates from Buddies page
    const handleBuddyRequestsUpdated = () => {
      if (authAPI.isAuthenticated()) {
        fetchRequests();
      }
    };

    window.addEventListener('buddyRequestsUpdated', handleBuddyRequestsUpdated);
    return () => window.removeEventListener('buddyRequestsUpdated', handleBuddyRequestsUpdated);
  }, []);

  const handleLogout = () => {
    authAPI.logout();
    sessionStorage.clear();
    onNavigate('home');
  };

  return (
    <header className="bg-white dark:bg-background border-b border-gray-200 dark:border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => onNavigate('dashboard')}>
            <span className="text-foreground font-bold text-2xl">PeerSupportHub</span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => onNavigate('habits')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              My Habits
            </button>
            <button 
              onClick={() => onNavigate('groups')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Groups
            </button>
            <button 
              onClick={() => onNavigate('challenges')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Challenges
            </button>
            <button 
              onClick={() => onNavigate('mentors')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Mentors
            </button>
            <button 
              onClick={() => onNavigate('buddies')}
              className="text-muted-foreground hover:text-foreground transition-colors relative"
            >
              Buddies
              {pendingRequests.length > 0 && (
                <span className="absolute -top-2 -right-3 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('messages')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <NotificationsDropdown onNavigate={onNavigate} />
            <button 
              onClick={() => onNavigate('reflections')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Reflections
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            {isAdmin && (
              <button 
                onClick={() => onNavigate('admin')}
                className="text-red-600 hover:text-red-700 transition-colors"
              >
                <Shield className="w-5 h-5" />
              </button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-full border-2 border-foreground/10 px-6 py-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3 border-t border-border pt-4">
            <button 
              onClick={() => onNavigate('habits')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              My Habits
            </button>
            <button 
              onClick={() => onNavigate('groups')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Groups
            </button>
            <button 
              onClick={() => onNavigate('challenges')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Challenges
            </button>
            <button 
              onClick={() => onNavigate('mentors')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Mentors
            </button>
            <button 
              onClick={() => onNavigate('buddies')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center"
            >
              Buddies
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => onNavigate('messages')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Messages
            </button>
            <button 
              onClick={() => onNavigate('reflections')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Reflections
            </button>
            <button 
              onClick={() => onNavigate('settings')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Settings
            </button>
            {isAdmin && (
              <button 
                onClick={() => onNavigate('admin')}
                className="block w-full text-left text-red-600 hover:text-red-700 transition-colors py-2"
              >
                Admin Panel
              </button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start rounded-lg mt-2"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}

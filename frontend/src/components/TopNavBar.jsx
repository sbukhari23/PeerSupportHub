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
  ChevronRight,
} from 'lucide-react';
import { authAPI } from '../services/api';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'habits', label: 'Habits', icon: Target },
  { id: 'buddies', label: 'Buddies', icon: Users },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'challenges', label: 'Challenges', icon: Trophy },
  { id: 'reflections', label: 'Reflections', icon: BookOpen },
  { id: 'mentors', label: 'Mentors', icon: GraduationCap },
];

export function TopNavBar({ currentPage, onNavigate }) {
  const userData = authAPI.getCurrentUser() || {};
  const isAdmin = userData.userType === 'Admin';

  // Get the base page name for comparison (handles messages-{id} etc.)
  const getBasePage = (page) => {
    if (page?.startsWith('messages-')) return 'messages';
    if (page?.startsWith('group-chat-')) return 'groups';
    return page;
  };

  const basePage = getBasePage(currentPage);

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-1 min-w-max">
          {/* Logo/Home */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="font-bold text-lg mr-4 hidden sm:block"
          >
            PSH
          </button>

          {/* Nav Items */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = basePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}

          {/* Admin Link */}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                basePage === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              basePage === 'settings'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

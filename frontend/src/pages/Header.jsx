import { useState } from 'react';
import { Menu, Settings, LogOut, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { authAPI } from '../services/api';

export function Header({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = authAPI.isAuthenticated();
  const userData = authAPI.getCurrentUser() || {};
  const userName = userData.name?.split(' ')[0] || userData.username || 'User';
  const isAdmin = userData.userType === 'Admin';

  // Navigation items for logged-out users
  const publicNavItems = [
    { label: 'Home', page: 'home' },
    { label: 'How It Works', page: 'how-it-works' },
    { label: 'Membership', page: 'membership' },
    { label: 'Community', page: 'community' },
    { label: 'Blogs & Resources', page: 'blogs' },
    { label: 'FAQs', page: 'faqs' },
    { label: 'Contact', page: 'contact' },
  ];

  // Navigation items for logged-in users - now includes all main pages
  const authNavItems = [
    { label: 'Dashboard', page: 'dashboard' },
    { label: 'My Habits', page: 'habits' },
    { label: 'Buddies', page: 'buddies' },
    { label: 'Groups', page: 'groups' },
    { label: 'Messages', page: 'messages' },
    { label: 'Challenges', page: 'challenges' },
    { label: 'Reflections', page: 'reflections' },
    { label: 'Mentors', page: 'mentors' },
    { label: 'Resources', page: 'blogs' },
  ];

  // Add admin panel for admins
  if (isAdmin) {
    authNavItems.push({ label: 'Admin', page: 'admin' });
  }

  const handleNavClick = (page) => {
    onNavigate(page);
    setOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
    setOpen(false);
  };

  const handleLogoutConfirm = () => {
    authAPI.logout();
    sessionStorage.clear();
    setShowLogoutDialog(false);
    onNavigate('home');
  };

  // Logout confirmation dialog
  const LogoutDialog = () => (
    <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5 text-red-500" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out of your account? You will need to sign in again to access your dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setShowLogoutDialog(false)}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogoutConfirm}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Logged-in header style (similar to Dashboard)
  if (isLoggedIn) {
    return (
      <>
        <header className="sticky top-0 bg-background border-b border-border z-50">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo */}
            <button 
              onClick={() => handleNavClick('dashboard')} 
              className="font-bold text-xl text-foreground hover:text-muted-foreground transition-colors"
            >
              PeerSupportHub
            </button>

            {/* Desktop Navigation - show key pages */}
            <nav className="hidden lg:flex items-center gap-4">
              {authNavItems.slice(0, 8).map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentPage === 'admin'
                      ? 'bg-red-600 text-white'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  Admin
                </button>
              )}
              <button 
                onClick={() => handleNavClick('settings')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Button 
                variant="outline" 
                className="rounded-full gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 transition-all"
                onClick={handleLogoutClick}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </nav>

            {/* Tablet Navigation - fewer items */}
            <nav className="hidden md:flex lg:hidden items-center gap-3">
              {authNavItems.slice(0, 5).map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.page)}
                  className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                    currentPage === item.page
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button 
                onClick={() => handleNavClick('settings')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
              <Button 
                variant="outline" 
                size="sm"
                className="rounded-full gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 transition-all"
                onClick={handleLogoutClick}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </nav>

            {/* Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <button className="p-2 hover:bg-accent rounded-lg transition-colors text-foreground" aria-label="Menu">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-6">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetDescription className="sr-only">
                  Navigate through PeerSupportHub
                </SheetDescription>
                <div className="flex flex-col gap-2 mt-8">
                  <p className="text-sm text-muted-foreground mb-4">Welcome, {userName}</p>
                  {authNavItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleNavClick(item.page)}
                      className={`text-left px-3 py-2 rounded-lg transition-all ${
                        currentPage === item.page
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleNavClick('settings')}
                    className={`text-left px-3 py-2 rounded-lg transition-all ${
                      currentPage === 'settings'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    Settings
                  </button>
                  <hr className="border-border my-2" />
                  <button
                    onClick={handleLogoutClick}
                    className="text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <LogOut className="w-4 h-4 inline mr-2" />
                    Logout
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <LogoutDialog />
      </>
    );
  }

  // Default header for logged-out users
  return (
    <>
      <header className="sticky top-0 bg-background border-b border-border z-50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 hover:bg-accent rounded-lg transition-colors text-foreground" aria-label="Menu">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px] p-6">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate through the PeerSupportHub website
              </SheetDescription>
              <nav className="flex flex-col gap-2 mt-8 px-2">
                {publicNavItems.map((item) => (
                  <button
                    key={item.page}
                    onClick={() => handleNavClick(item.page)}
                    className={`text-left px-3 py-2 rounded-lg transition-all ${
                      currentPage === item.page 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <Button 
                  className="mt-4 rounded-full"
                  onClick={() => handleNavClick('membership')}
                >
                  Join Now
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo/Brand */}
          <button 
            onClick={() => handleNavClick('home')} 
            className="flex-1 text-center hover:opacity-80 transition-opacity"
          >
            <span className="text-foreground font-bold text-[32px]">PeerSupportHub</span>
          </button>

          {/* Login Button */}
          <Button 
            variant="ghost" 
            className="rounded-full px-4 hover:bg-accent transition-colors"
            onClick={() => handleNavClick('login')}
          >
            Login
          </Button>
        </div>
      </header>
      <LogoutDialog />
    </>
  );
}

import { useState } from 'react';
import { Menu, Settings, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { authAPI } from '../services/api';

export function Header({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false);
  
  // Check if user is logged in
  const isLoggedIn = authAPI.isAuthenticated();
  const userData = authAPI.getCurrentUser() || {};
  const userName = userData.name?.split(' ')[0] || userData.username || 'User';

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

  // Navigation items for logged-in users
  const authNavItems = [
    { label: 'Dashboard', page: 'dashboard' },
    { label: 'My Habits', page: 'dashboard' },
    { label: 'Groups', page: 'community' },
    { label: 'Resources', page: 'blogs' },
  ];

  const handleNavClick = (page) => {
    onNavigate(page);
    setOpen(false);
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      authAPI.logout();
      sessionStorage.clear();
      onNavigate('home');
      setOpen(false);
    }
  };

  // Logged-in header style (similar to Dashboard)
  if (isLoggedIn) {
    return (
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <button 
            onClick={() => handleNavClick('dashboard')} 
            className="font-bold text-xl"
          >
            PeerSupportHub
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {authNavItems.slice(1).map((item) => (
              <button
                key={item.label}
                onClick={() => handleNavClick(item.page)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button className="text-gray-600 hover:text-gray-900">
              <Settings className="w-5 h-5" />
            </button>
            <Button 
              variant="outline" 
              className="rounded-full gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="p-2" aria-label="Menu">
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-6">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate through PeerSupportHub
              </SheetDescription>
              <div className="flex flex-col gap-6 mt-8">
                <p className="text-sm text-gray-500">Welcome, {userName}</p>
                {authNavItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.page)}
                    className="text-left text-gray-600 hover:text-gray-900"
                  >
                    {item.label}
                  </button>
                ))}
                <hr className="border-gray-200" />
                <button
                  onClick={handleLogout}
                  className="text-left text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  // Default header for logged-out users
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-2 -ml-2" aria-label="Menu">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] sm:w-[320px] p-6">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate through the PeerSupportHub website
            </SheetDescription>
            <nav className="flex flex-col gap-6 mt-8 px-2">
              {publicNavItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => handleNavClick(item.page)}
                  className={`text-left transition-colors ${
                    currentPage === item.page 
                      ? 'text-foreground' 
                      : 'text-gray-600 hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Button 
                className="mt-4 rounded-full bg-black hover:bg-gray-800"
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
          className="flex-1 text-center"
        >
          <span className="text-foreground font-bold text-[32px]">PeerSupportHub</span>
        </button>

        {/* Login Button */}
        <Button 
          variant="ghost" 
          className="rounded-full px-4"
          onClick={() => handleNavClick('login')}
        >
          Login
        </Button>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '../components/ui/sheet';

export function Header({ currentPage, onNavigate }) {
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: 'Home', page: 'home' },
    { label: 'How It Works', page: 'howitworks' },
    { label: 'Membership', page: 'membership' },
    { label: 'Community', page: 'community' },
    { label: 'Blogs & Resources', page: 'resources' },
    { label: 'FAQs', page: 'faqs' },
    { label: 'Contact', page: 'contact' },
  ];

  const handleNavClick = (page) => {
    onNavigate(page);
    setOpen(false);
    window.scrollTo(0, 0);
  };

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
              {navItems.map((item) => (
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

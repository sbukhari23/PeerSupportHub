import { useState, useEffect, useCallback } from 'react';
import { Toaster } from './components/ui/sonner';
import { Header } from './pages/Header';
import { Home } from './pages/Home';
import { HowItWorks } from './pages/HowItWorks';
import { Membership } from './pages/Membership';
import { Community } from './pages/Community';
import { BlogsResources } from './pages/BlogsResources';
import { FAQs } from './pages/FAQs';
import { Contact } from './pages/Contact';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Payment } from './pages/Payment';
import { Onboarding } from './pages/Onboarding';
import { Groups } from './pages/Groups';
import { GroupChat } from './pages/GroupChat';
import { Buddies } from './pages/Buddies';
import { Messages } from './pages/Messages';
import { HabitManager } from './pages/HabitManager';
import { Challenges } from './pages/Challenges';
import { Reflections } from './pages/Reflections';
import { Mentors } from './pages/Mentors';
import { Settings } from './pages/Settings';
import { AdminPanel } from './pages/AdminPanel';
import { Footer } from './pages/Footer';
import { authAPI } from './services/api';

// Pages that require authentication
const protectedPages = ['dashboard', 'groups', 'buddies', 'messages', 'habits', 'onboarding', 'payment', 'challenges', 'reflections', 'mentors', 'settings', 'admin'];

export default function App() {
  // Get initial page from URL hash or default based on auth status
  const getInitialPage = () => {
    const hash = window.location.hash.slice(1); // Remove the '#'
    
    if (hash) {
      // Check if it's a protected page and user is not authenticated
      const basePage = hash.split('-')[0]; // Handle group-chat-{id}, messages-{id}
      const isProtected = protectedPages.includes(basePage) || 
                          hash.startsWith('group-chat-') || 
                          hash.startsWith('messages-');
      
      if (isProtected && !authAPI.isAuthenticated()) {
        return 'login';
      }
      return hash;
    }
    
    // Default: if authenticated go to dashboard, else home
    return authAPI.isAuthenticated() ? 'dashboard' : 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);

  // Initialize dark mode from local storage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Custom navigation function that also updates the URL
  const navigate = useCallback((page) => {
    setCurrentPage(page);
    window.location.hash = page;
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      
      // Check if it's a protected page and user is not authenticated
      const basePage = hash.split('-')[0];
      const isProtected = protectedPages.includes(basePage) || 
                          hash.startsWith('group-chat-') || 
                          hash.startsWith('messages-');
      
      if (isProtected && !authAPI.isAuthenticated()) {
        navigate('login');
        return;
      }
      
      setCurrentPage(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if not present
    if (!window.location.hash) {
      window.location.hash = currentPage;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage, navigate]);

  const renderPage = () => {
    // Handle dynamic routes like group-chat-{id} and messages-{id}
    if (currentPage.startsWith('group-chat-')) {
      const groupId = currentPage.replace('group-chat-', '');
      return <GroupChat groupId={groupId} onNavigate={navigate} />;
    }
    if (currentPage.startsWith('messages-')) {
      const userId = currentPage.replace('messages-', '');
      return <Messages userId={userId} onNavigate={navigate} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'how-it-works':
        return <HowItWorks onNavigate={navigate} />;
      case 'membership':
        return <Membership onNavigate={navigate} />;
      case 'community':
        return <Community onNavigate={navigate} />;
      case 'blogs':
        return <BlogsResources onNavigate={navigate} />;
      case 'faqs':
        return <FAQs onNavigate={navigate} />;
      case 'contact':
        return <Contact onNavigate={navigate} />;
      case 'login':
        return <Login onNavigate={navigate} />;
      case 'signup':
        return <Signup onNavigate={navigate} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard onNavigate={navigate} />;
      case 'payment':
        return <Payment onNavigate={navigate} />;
      case 'onboarding':
        return <Onboarding onNavigate={navigate} />;
      case 'groups':
        return <Groups onNavigate={navigate} />;
      case 'buddies':
        return <Buddies onNavigate={navigate} />;
      case 'messages':
        return <Messages onNavigate={navigate} />;
      case 'habits':
        return <HabitManager onNavigate={navigate} />;
      case 'challenges':
        return <Challenges onNavigate={navigate} />;
      case 'reflections':
        return <Reflections onNavigate={navigate} />;
      case 'mentors':
        return <Mentors onNavigate={navigate} />;
      case 'settings':
        return <Settings onNavigate={navigate} />;
      case 'notifications':
        return <Settings onNavigate={navigate} defaultTab="notifications" />;
      case 'admin':
        return <AdminPanel onNavigate={navigate} />;
      default:
        return <Home onNavigate={navigate} />;
    }
  };

  // These pages have their own layout, so we don't show header/footer
  const hasCustomLayout = [
    'login', 
    'signup', 
    'forgot-password', 
    'payment', 
    'onboarding', 
    'dashboard',
    'groups',
    'buddies',
    'messages',
    'habits',
    'challenges',
    'reflections',
    'mentors',
    'settings',
    'notifications',
    'admin',
  ].includes(currentPage) || currentPage.startsWith('group-chat-') || currentPage.startsWith('messages-');

  return (
    <div className="min-h-screen bg-white">
      {!hasCustomLayout && <Header currentPage={currentPage} onNavigate={navigate} />}
      <main>
        {renderPage()}
      </main>
      {!hasCustomLayout && <Footer onNavigate={navigate} />}
      <Toaster />
    </div>
  );
}

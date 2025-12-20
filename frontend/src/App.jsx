import { useState } from 'react';
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
import { Footer } from './pages/Footer';
import { authAPI } from './services/api';

export default function App() {
  // Check if user is already logged in on initial load
  const getInitialPage = () => {
    // If user is authenticated, take them to dashboard
    if (authAPI.isAuthenticated()) {
      return 'dashboard';
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);

  const renderPage = () => {
    // Handle dynamic routes like group-chat-{id} and messages-{id}
    if (currentPage.startsWith('group-chat-')) {
      const groupId = currentPage.replace('group-chat-', '');
      return <GroupChat groupId={groupId} onNavigate={setCurrentPage} />;
    }
    if (currentPage.startsWith('messages-')) {
      const userId = currentPage.replace('messages-', '');
      return <Messages userId={userId} onNavigate={setCurrentPage} />;
    }

    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'how-it-works':
        return <HowItWorks onNavigate={setCurrentPage} />;
      case 'membership':
        return <Membership onNavigate={setCurrentPage} />;
      case 'community':
        return <Community onNavigate={setCurrentPage} />;
      case 'blogs':
        return <BlogsResources onNavigate={setCurrentPage} />;
      case 'faqs':
        return <FAQs onNavigate={setCurrentPage} />;
      case 'contact':
        return <Contact onNavigate={setCurrentPage} />;
      case 'login':
        return <Login onNavigate={setCurrentPage} />;
      case 'signup':
        return <Signup onNavigate={setCurrentPage} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'payment':
        return <Payment onNavigate={setCurrentPage} />;
      case 'onboarding':
        return <Onboarding onNavigate={setCurrentPage} />;
      case 'groups':
        return <Groups onNavigate={setCurrentPage} />;
      case 'buddies':
        return <Buddies onNavigate={setCurrentPage} />;
      case 'messages':
        return <Messages onNavigate={setCurrentPage} />;
      case 'habits':
        return <HabitManager onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
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
  ].includes(currentPage) || currentPage.startsWith('group-chat-') || currentPage.startsWith('messages-');

  return (
    <div className="min-h-screen bg-white">
      {!hasCustomLayout && <Header currentPage={currentPage} onNavigate={setCurrentPage} />}
      <main>
        {renderPage()}
      </main>
      {!hasCustomLayout && <Footer />}
      <Toaster />
    </div>
  );
}

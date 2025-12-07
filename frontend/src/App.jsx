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
// import { Payment } from './pages/Payment';
// import { Onboarding } from './pages/Onboarding';
// import { Dashboard } from './pages/Dashboard';
import { Footer } from './pages/Footer';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
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
      // case 'payment':
      //   return <Payment onNavigate={setCurrentPage} />;
      // case 'onboarding':
      //   return <Onboarding onNavigate={setCurrentPage} />;
      // case 'dashboard':
      //   return <Dashboard onNavigate={setCurrentPage} />;
      default:
        return <Home />;
    }
  };

  // These pages have their own layout, so we don't show header/footer
  const hasCustomLayout = [
    'login', 
    'signup', 
    'forgot-password', 
    'payment', 
    'onboarding', 
    'dashboard'
  ].includes(currentPage);

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

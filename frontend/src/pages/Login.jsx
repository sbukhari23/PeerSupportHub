import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export function Login({ onNavigate }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Test credentials for quick dashboard access
    const TEST_CREDENTIALS = [
      { email: 'demo@test.com', password: 'demo123', plan: 'free' },
      { email: 'growth@test.com', password: 'demo123', plan: 'growth' },
      { email: 'pro@test.com', password: 'demo123', plan: 'pro' }
    ];
    
    // Check if credentials match test accounts
    const testAccount = TEST_CREDENTIALS.find(
      cred => cred.email === formData.email && cred.password === formData.password
    );
    
    if (testAccount) {
      // Set up mock user data for test account
      const mockUserData = {
        fullName: testAccount.plan === 'free' ? 'Demo User' : 
                  testAccount.plan === 'growth' ? 'Growth User' : 'Pro User',
        email: testAccount.email,
        plan: testAccount.plan,
        focusArea: 'study',
        receiveUpdates: true,
        planStatus: 'active',
        loginDate: new Date().toISOString()
      };
      
      const mockOnboardingData = {
        habits: ['study', 'exercise', 'reading'],
        group: 'study-students',
        completedAt: new Date().toISOString()
      };
      
      localStorage.setItem('userData', JSON.stringify(mockUserData));
      localStorage.setItem('onboardingData', JSON.stringify(mockOnboardingData));
      localStorage.setItem('selectedPlan', testAccount.plan);
      
      // Navigate to dashboard
      onNavigate('dashboard');
    } else {
      // Show error for invalid credentials
      alert('Invalid credentials. Use test accounts:\n\n' +
            '📧 demo@test.com (Free Plan)\n' +
            '📧 growth@test.com (Growth Plan)\n' +
            '📧 pro@test.com (Pro Plan)\n\n' +
            '🔑 Password: demo123\n\n' +
            'Or create a new account to go through the full onboarding flow.');
    }
  };

  const handleSocialLogin = (provider) => {
    alert(`${provider} OAuth login coming soon!`);
  };

  const handleForgotPassword = () => {
    onNavigate('forgot-password');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal Header */}
      <header className="py-8 px-6 text-center">
        <button 
          onClick={() => onNavigate('home')} 
          className="inline-block"
        >
          <span className="text-foreground font-bold text-[32px]">PeerSupportHub</span>
        </button>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Test Credentials Info Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🧪</div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2">Test Credentials</h3>
                <div className="text-sm text-blue-800 space-y-2">
                  <p className="font-mono bg-white rounded px-3 py-2 border border-blue-200">
                    <strong>Free Plan:</strong><br/>
                    demo@test.com / demo123
                  </p>
                  <p className="font-mono bg-white rounded px-3 py-2 border border-blue-200">
                    <strong>Growth Plan:</strong><br/>
                    growth@test.com / demo123
                  </p>
                  <p className="font-mono bg-white rounded px-3 py-2 border border-blue-200">
                    <strong>Pro Plan:</strong><br/>
                    pro@test.com / demo123
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Welcome Back 👋
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
              Log in to track your habits, connect with peers, and stay consistent.
            </p>
            <div className="pt-2">
              <div className="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Email Field */}
            <div className="space-y-3">
              <Label htmlFor="email" className="text-lg">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
                className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label htmlFor="password" className="text-lg">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                  className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-gray-600 hover:text-gray-900 transition-colors underline text-lg"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Log In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-gray-500 text-lg">or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-2 border-black px-6 py-7 text-xl hover:bg-gray-50 transition-all"
              onClick={() => handleSocialLogin('Google')}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-2 border-black px-6 py-7 text-xl hover:bg-gray-50 transition-all"
              onClick={() => handleSocialLogin('Apple')}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          {/* Signup Prompt */}
          <div className="text-center pt-6 space-y-3">
            <p className="text-gray-600 text-lg">
              New here?
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-2 border-black px-10 py-6 text-xl hover:bg-gray-50 transition-all"
              onClick={() => onNavigate('signup')}
            >
              Create an Account
            </Button>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <button
            onClick={() => onNavigate('contact')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg"
          >
            Need help? <span className="underline">Contact Support</span>
          </button>
          <span className="hidden sm:inline text-gray-300">•</span>
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg underline"
          >
            Back to Home
          </button>
        </div>
      </footer>
    </div>
  );
}
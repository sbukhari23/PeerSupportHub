import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending reset email
    console.log('Password reset link sent to:', email);
    setIsSubmitted(true);
  };

  const handleResendLink = () => {
    if (email) {
      console.log('Resending password reset link to:', email);
      alert('Reset link has been resent! Please check your email.');
    } else {
      alert('Please enter your email address first.');
    }
  };

  const handleContactSupport = () => {
    onNavigate('contact');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Back Arrow */}
      <header className="py-8 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => onNavigate('login')} 
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back to login"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => onNavigate('home')} 
            className="flex-1 text-center"
          >
            <span className="text-foreground font-bold text-[32px]">PeerSupportHub</span>
          </button>
          
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {!isSubmitted ? (
            <>
              {/* Page Intro */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Forgot Your Password?
                </h1>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                  No worries — enter your email and we'll send you a reset link.
                </p>
                <div className="pt-2">
                  <div className="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
                </div>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {/* Email Field */}
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-lg">
                    Enter the email associated with your account
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your.email@example.com"
                    className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
                >
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <>
              {/* Confirmation Message */}
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                    We've sent a password reset link to <span className="font-medium text-gray-900">{email}</span>. 
                    Please check your inbox (and spam folder).
                  </p>
                </div>

                {/* Return to Login Button */}
                <div className="pt-4">
                  <Button
                    type="button"
                    className="w-full rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
                    onClick={() => onNavigate('login')}
                  >
                    Return to Login
                  </Button>
                </div>
              </div>

              {/* Need Help Section */}
              <div className="border-t-2 border-gray-200 pt-8">
                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-lg">
                    Didn't get the email?
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                      onClick={handleResendLink}
                    >
                      Resend Link
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                      onClick={handleContactSupport}
                    >
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Need Help Section (before submission) */}
          {!isSubmitted && (
            <div className="border-t-2 border-gray-200 pt-8">
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-lg">
                  Need help?
                </p>
                
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                  onClick={handleContactSupport}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <button
            onClick={() => alert('Privacy Policy coming soon!')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg"
          >
            Privacy Policy
          </button>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button
            onClick={() => alert('Terms of Use coming soon!')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg"
          >
            Terms of Use
          </button>
        </div>
        <div className="text-center mt-4">
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

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft, GraduationCap, Heart, Smartphone, Sparkles } from 'lucide-react';

const focusAreas = [
  { id: 'study', label: 'Study & Learning', icon: GraduationCap },
  { id: 'health', label: 'Health & Fitness', icon: Heart },
  { id: 'digital', label: 'Digital Discipline', icon: Smartphone },
  { id: 'growth', label: 'Personal Growth', icon: Sparkles },
];

export function Signup({ onNavigate }) {
  const [selectedPlan, setSelectedPlan] = useState(() => {
    return localStorage.getItem('selectedPlan') || 'free';
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    focusArea: '',
    receiveUpdates: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFocusAreaSelect = (areaId) => {
    setFormData(prev => ({ ...prev, focusArea: areaId }));
  };

  const handleChangePlan = () => {
    onNavigate('membership');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    if (!formData.focusArea) {
      alert('Please select a focus area!');
      return;
    }
    
    // Save user data
    localStorage.setItem('userData', JSON.stringify({
      ...formData,
      plan: selectedPlan
    }));
    
    // Route based on plan
    if (selectedPlan === 'free') {
      onNavigate('onboarding');
    } else {
      onNavigate('payment');
    }
  };

  const handleSocialSignup = (provider) => {
    alert(`${provider} OAuth signup coming soon!`);
  };

  const handleTermsClick = (type) => {
    alert(`${type} document coming soon!`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header with Back Arrow */}
      <header className="py-8 px-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button 
            onClick={() => onNavigate('home')} 
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Go back"
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
      <main className="flex-1 px-6 py-12">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Plan Indicator */}
          <div className="bg-gray-50 border-2 border-gray-900 rounded-2xl p-6 text-center space-y-3">
            <p className="text-gray-600 text-lg">
              You're signing up for the{' '}
              <span className="font-bold text-gray-900 capitalize">{selectedPlan}</span> plan
            </p>
            <button
              type="button"
              onClick={handleChangePlan}
              className="text-gray-900 underline hover:text-gray-600 transition-colors text-lg"
            >
              Change Plan
            </button>
          </div>

          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Join the Peer Support Hub 🚀
            </h1>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
              Build habits that last — with peers, mentors, and a community that keeps you accountable.
            </p>
            <div className="pt-2">
              <div className="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {/* Full Name Field */}
            <div className="space-y-3">
              <Label htmlFor="fullName" className="text-lg">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50"
              />
            </div>

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
                  placeholder="Create a strong password"
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

            {/* Confirm Password Field */}
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-lg">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  placeholder="Re-enter your password"
                  className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-900 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-6 h-6" />
                  ) : (
                    <Eye className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Focus Area Selection */}
            <div className="space-y-4">
              <Label className="text-lg">Select Your Focus Area</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {focusAreas.map((area) => {
                  const Icon = area.icon;
                  const isSelected = formData.focusArea === area.id;
                  
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleFocusAreaSelect(area.id)}
                      className={`
                        flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected 
                          ? 'border-black bg-gray-900 text-white' 
                          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                        }
                      `}
                    >
                      <Icon className="w-6 h-6 flex-shrink-0" />
                      <span className="text-lg">{area.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Updates Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="receiveUpdates"
                checked={formData.receiveUpdates}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, receiveUpdates: checked === true }))
                }
                className="mt-1"
              />
              <Label 
                htmlFor="receiveUpdates" 
                className="text-lg cursor-pointer leading-relaxed"
              >
                I want to receive weekly growth prompts and updates.
              </Label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            >
              Create Account
            </Button>

            {/* Terms & Privacy Note */}
            <p className="text-gray-600 text-center text-sm leading-relaxed">
              By signing up, you agree to our{' '}
              <button
                type="button"
                onClick={() => handleTermsClick('Terms of Service')}
                className="underline hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => handleTermsClick('Privacy Policy')}
                className="underline hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </button>
              .
            </p>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-gray-500 text-lg">or sign up with</span>
            </div>
          </div>

          {/* Social Signup Buttons */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full border-2 border-black px-6 py-7 text-xl hover:bg-gray-50 transition-all"
              onClick={() => handleSocialSignup('Google')}
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
              onClick={() => handleSocialSignup('Apple')}
            >
              <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </Button>
          </div>

          {/* Existing User Prompt */}
          <div className="text-center pt-6 space-y-3">
            <p className="text-gray-600 text-lg">
              Already have an account?
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-2 border-black px-10 py-6 text-xl hover:bg-gray-50 transition-all"
              onClick={() => onNavigate('login')}
            >
              Log In Here
            </Button>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="py-8 px-6 border-t border-gray-200">
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <button
            onClick={() => onNavigate('faqs')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg"
          >
            FAQs
          </button>
          <span className="hidden sm:inline text-gray-300">|</span>
          <button
            onClick={() => onNavigate('contact')}
            className="text-gray-600 hover:text-gray-900 transition-colors text-lg"
          >
            Contact Support
          </button>
        </div>
        <p className="text-center text-gray-500 text-sm mt-4">
          Copyright © Peer Support Hub 2025
        </p>
      </footer>
    </div>
  );
}

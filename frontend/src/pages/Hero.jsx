import { Button } from '../components/ui/button';
import { Sparkles } from 'lucide-react';

export function Hero({ onNavigate } = {}) {
  const handleJoinNow = () => {
    if (onNavigate) {
      onNavigate('membership');
    }
  };

  const handleLogin = () => {
    if (onNavigate) {
      onNavigate('login');
    }
  };

  return (
    <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Eyebrow text */}
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm tracking-wide uppercase">Your Journey Starts Here</span>
        </div>

        {/* Headline - Large and Bold */}
        <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
          Build Better Habits.{' '}
          <span className="inline-block">Together.</span>
        </h1>

        {/* Subtext - Larger and more prominent */}
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          PeerSupportHub helps students and young professionals stay consistent 
          and accountable — with peers and mentors by your side.
        </p>

        {/* CTA Buttons - More prominent */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center items-center">
          <Button 
            onClick={handleJoinNow}
            className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg min-w-[200px] shadow-lg hover:shadow-xl transition-all"
          >
            Join Now
          </Button>
          <button 
            onClick={handleLogin}
            className="text-foreground underline underline-offset-4 py-2 text-lg hover:text-gray-600 transition-colors"
          >
            Log In
          </button>
        </div>

        {/* Trust indicator */}
        <p className="text-sm text-gray-500 pt-8">
          Join hundreds of students building lasting habits
        </p>
      </div>
    </section>
  );
}

import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export function HowItWorks({ onNavigate }) {
  const mentors = [
    {
      name: "Sarah Chen",
      quote: "Consistency beats motivation."
    },
    {
      name: "Marcus Johnson",
      quote: "Small steps lead to big changes."
    },
    {
      name: "Priya Patel",
      quote: "Your habits shape your future."
    }
  ];

  return (
    <div className="bg-white">
      {/* Intro Section - Enhanced like Hero */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Heading - Large and Bold */}
          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            How It Works
          </h1>

          {/* Subheading - Larger and more prominent */}
          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Just three steps to build habits that last.
          </p>

          {/* Divider and scroll prompt */}
          <div className="pt-4">
            <div className="w-16 h-px bg-black mx-auto mb-6"></div>
            <div className="text-gray-400 text-3xl animate-bounce">↓</div>
          </div>
        </div>
      </section>

      {/* Three-Step Flow - Enhanced with bold styling */}
      <section className="px-4 py-16 md:py-20 max-w-5xl mx-auto">
        <div className="space-y-8">
          {/* Step 1: Join */}
          <div className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-shadow duration-300 bg-white">
            <div className="flex items-start gap-6 md:gap-8">
              <div className="text-6xl md:text-7xl flex-shrink-0">👋</div>
              <div className="flex-1">
                <div className="text-sm tracking-widest uppercase text-gray-500 mb-2">Step 1</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Join</h3>
                <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed">
                  Sign up and choose your focus areas — study, health, mindset, or digital discipline.
                </p>
                <Button 
                  className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                  onClick={() => onNavigate('membership')}
                >
                  Join Now
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Log Habits */}
          <div className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-shadow duration-300 bg-white">
            <div className="flex items-start gap-6 md:gap-8">
              <div className="text-6xl md:text-7xl flex-shrink-0">🕓</div>
              <div className="flex-1">
                <div className="text-sm tracking-widest uppercase text-gray-500 mb-2">Step 2</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Log Habits</h3>
                <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed">
                  Track daily progress with our simple habit logger and reflection prompts.
                </p>
                <Button 
                  variant="outline" 
                  className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                  onClick={() => alert('Dashboard demo coming soon!')}
                >
                  View Dashboard Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Step 3: Grow with Peers */}
          <div className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-shadow duration-300 bg-white">
            <div className="flex items-start gap-6 md:gap-8">
              <div className="text-6xl md:text-7xl flex-shrink-0">🤝</div>
              <div className="flex-1">
                <div className="text-sm tracking-widest uppercase text-gray-500 mb-2">Step 3</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Grow with Peers</h3>
                <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed">
                  Connect with peers, join challenges, and get guidance from mentors to stay consistent.
                </p>
                <Button 
                  variant="outline" 
                  className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all"
                  onClick={() => onNavigate('community')}
                >
                  Meet the Community
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accountability & Mentorship Section - Enhanced */}
      <section className="px-6 py-20 md:py-28 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stay Accountable.{' '}
              <span className="inline-block">Never Alone.</span>
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Each group includes accountability partners and access to mentors for real, lasting support.
            </p>
          </div>

          {/* Mentor Cards - Horizontal Scroll */}
          <div className="overflow-x-auto pb-6 -mx-4 px-4 md:-mx-6 md:px-6">
            <div className="flex gap-6 min-w-min">
              {mentors.map((mentor, index) => (
                <Card key={index} className="flex-shrink-0 w-[300px] md:w-[320px] p-8 border-2 border-gray-900 rounded-2xl hover:shadow-2xl transition-all duration-300 bg-white">
                  <div className="w-20 h-20 bg-gray-900 rounded-full mb-6 mx-auto"></div>
                  <h4 className="text-center mb-4 text-xl font-bold">{mentor.name}</h4>
                  <p className="text-gray-700 text-center italic text-lg leading-relaxed">
                    "{mentor.quote}"
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={() => onNavigate('community')}
            >
              See Mentor Corner
            </Button>
          </div>
        </div>
      </section>

      {/* CTA / Transition Section - Enhanced */}
      <section className="px-6 py-24 md:py-32 text-center bg-white relative overflow-hidden">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Ready to get started?
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join hundreds of students building better habits today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={() => onNavigate('membership')}
            >
              Join Free Today
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={() => onNavigate('membership')}
            >
              Learn More About Plans
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

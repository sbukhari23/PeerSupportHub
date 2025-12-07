import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Users, MessageCircle, Trophy, Heart } from 'lucide-react';

export function Community({ onNavigate }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  const peerGroups = [
    {
      name: "Study Focus Group",
      members: 132,
      description: "Daily check-ins and shared progress updates.",
    },
    {
      name: "Fitness & Wellness",
      members: 98,
      description: "Track workouts, nutrition, and mental health goals together.",
    },
    {
      name: "Digital Balance",
      members: 156,
      description: "Reduce screen time and build healthier tech habits.",
    },
    {
      name: "General Consistency",
      members: 204,
      description: "Build any habit with a supportive, diverse community.",
    },
  ];

  const mentors = [
    {
      name: "Sara",
      role: "Productivity Coach",
      quote: "Small wins build momentum.",
    },
    {
      name: "James",
      role: "Mindfulness Mentor",
      quote: "Progress over perfection, always.",
    },
    {
      name: "Maya",
      role: "Student Success Guide",
      quote: "Consistency beats intensity every time.",
    },
  ];

  const testimonials = [
    {
      quote: "I've never stayed this consistent before.",
      author: "Alex, Student",
    },
    {
      quote: "My accountability buddy changed everything.",
      author: "Jordan, Young Professional",
    },
    {
      quote: "The vent space helped me get through burnout.",
      author: "Taylor, Graduate Student",
    },
  ];

  const leaderboard = [
    { name: "Chris M.", streak: 47 },
    { name: "Sam K.", streak: 42 },
    { name: "Riley T.", streak: 38 },
    { name: "Morgan L.", streak: 35 },
    { name: "Casey P.", streak: 33 },
  ];

  const handleJoinGroup = (groupName) => {
    setSelectedGroup(groupName);
    alert(`Dashboard integration coming soon! You selected: ${groupName}`);
  };

  const handleAskQuestion = (mentorName) => {
    alert(`Mentor Q&A form coming soon for ${mentorName}!`);
  };

  const scrollToPeerGroups = () => {
    const element = document.getElementById('peer-groups-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMentors = () => {
    const element = document.getElementById('mentor-corner-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        {/* Subtle background illustration suggestion */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="flex gap-8">
            <div className="w-32 h-32 border-8 border-black rounded-full" />
            <div className="w-32 h-32 border-8 border-black rounded-full" />
            <div className="w-32 h-32 border-8 border-black rounded-full" />
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Grow Together. Stay Accountable.
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Join peers who share your goals — build consistency, track progress, and get inspired by real stories.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={scrollToPeerGroups}
            >
              Join a Peer Group
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={scrollToMentors}
            >
              Meet Mentors
            </Button>
          </div>
        </div>
      </section>

      {/* Peer Groups Section */}
      <section id="peer-groups-section" className="px-6 py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Find Your People
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Connect with peers based on your goals — study, fitness, digital balance, or general consistency.
            </p>
          </div>

          <div className="space-y-6">
            {peerGroups.map((group, index) => (
              <Card key={index} className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{group.name}</h3>
                    <p className="text-gray-500 mb-4 text-lg">{group.members} members</p>
                    <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed">
                      {group.description}
                    </p>
                    <Button 
                      className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                      onClick={() => handleJoinGroup(group.name)}
                    >
                      Join Group
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={() => alert('Groups list page coming soon!')}
            >
              View All Groups
            </Button>
          </div>
        </div>
      </section>

      {/* Mentor Corner Section */}
      <section id="mentor-corner-section" className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Guidance from People Who've Been There
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Access mentor-led sessions, Q&As, and personal tips to keep you on track.
            </p>
          </div>

          <div className="space-y-6">
            {mentors.map((mentor, index) => (
              <Card key={index} className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-400 rounded-full" style={{ filter: 'grayscale(100%)' }}></div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold mb-2">{mentor.name}</h3>
                    <p className="text-gray-600 mb-4 text-lg">{mentor.role}</p>
                    <p className="text-gray-700 text-xl md:text-2xl italic mb-6 leading-relaxed">
                      "{mentor.quote}"
                    </p>
                    <Button 
                      variant="outline" 
                      className="rounded-full border-2 border-black px-8 py-6 text-lg hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
                      onClick={() => handleAskQuestion(mentor.name)}
                    >
                      Ask a Question
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges & Leaderboards Section */}
      <section className="px-6 py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stay Motivated with Challenges
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Join monthly focus challenges and track your streaks with the community leaderboard.
            </p>
          </div>

          {/* Current Challenge Banner */}
          <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 mb-10 bg-white">
            <div className="flex items-start gap-6 mb-8">
              <Trophy className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Current Challenge: Digital Detox Week</h3>
                <p className="text-gray-700 text-lg md:text-xl mb-6 leading-relaxed">
                  Reduce screen time by 30% this week and build healthier tech habits.
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 text-lg">Challenge Progress</span>
                <span className="text-gray-900 font-bold text-lg">68% Complete</span>
              </div>
              <Progress value={68} className="h-3" />
            </div>

            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
              onClick={() => alert('Challenge dashboard coming soon!')}
            >
              Join This Challenge
            </Button>
          </Card>

          {/* Top Members Leaderboard */}
          <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 bg-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-8">Top Members</h3>
            <div className="space-y-4">
              {leaderboard.map((member, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <span className="text-lg md:text-xl font-bold">{member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-bold">{member.streak}</span>
                    <span className="text-gray-600 text-lg">day streak</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-6 py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              What Members Are Saying
            </h2>
          </div>

          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-all duration-300 bg-white">
                <div className="flex flex-col items-center text-center">
                  <Heart className="w-12 h-12 mb-6 text-gray-900" />
                  <p className="text-2xl md:text-3xl italic mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <p className="text-gray-600 text-lg">— {testimonial.author}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={() => alert('Extended stories page coming soon!')}
            >
              Read More Stories
            </Button>
          </div>
        </div>
      </section>

      {/* Anonymous Vent Space Section */}
      <section className="px-6 py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Need a Safe Space to Vent?
            </h2>
            <p className="text-gray-700 text-xl md:text-2xl leading-relaxed">
              Express what's on your mind anonymously. Get empathy, not judgment.
            </p>
          </div>

          <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 bg-white relative overflow-hidden">
            {/* Blurred preview effect */}
            <div className="mb-8 p-8 bg-gray-100 rounded-xl relative">
              <div className="absolute inset-0 backdrop-blur-sm bg-gray-200/50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-gray-400 blur-sm select-none">
                Sometimes I feel like I'm the only one struggling with staying focused...
              </p>
            </div>

            <div className="text-center">
              <Button 
                className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
                onClick={() => alert('Login required. Vent space coming soon!')}
              >
                Enter Vent Space
              </Button>
              <p className="text-gray-600 mt-4 text-lg">Login required • Moderated for safety</p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA / Transition Section */}
      <section className="px-6 py-24 md:py-32 text-center bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Join the Community Today
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Be part of a supportive network building better habits together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={() => onNavigate('signup')}
            >
              Create Account
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={() => onNavigate('login')}
            >
              Login to Your Group
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Mail, MessageCircle, Users, Check } from 'lucide-react';

export function Contact({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    
    // Reset form after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 5000);
  };

  const handleLiveChat = () => {
    alert('Live chat widget coming soon! For now, please use the contact form or email us directly.');
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        {/* Subtle background envelope icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Mail className="w-64 h-64 md:w-96 md:h-96" />
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-center mb-6">
            <Mail className="w-16 h-16 md:w-20 md:h-20 text-gray-900" />
          </div>

          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            We'd Love to Hear from You.
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Got feedback, questions, or need help? Reach out — we're here to listen.
          </p>

          <div className="pt-4">
            <div className="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Send Us a Message</h2>
        </div>

        <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Field */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-lg">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Your name"
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

            {/* Message Field */}
            <div className="space-y-3">
              <Label htmlFor="message" className="text-lg">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                placeholder="Tell us what's on your mind..."
                rows={6}
                className="w-full px-6 py-6 text-lg rounded-xl border-2 border-gray-300 focus:border-black transition-all bg-gray-50 resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              disabled={submitted}
            >
              {submitted ? 'Message Sent!' : 'Submit Message'}
            </Button>

            {/* Confirmation Message */}
            {submitted && (
              <div className="flex items-center justify-center gap-3 p-6 bg-green-50 border-2 border-green-600 rounded-xl">
                <Check className="w-6 h-6 text-green-600" />
                <p className="text-green-700 text-lg">
                  Thanks! We'll get back to you within 24 hours.
                </p>
              </div>
            )}
          </form>
        </Card>
      </section>

      {/* Email & Support Info Section */}
      <section className="px-6 py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Prefer Email?</h2>
          </div>

          <div className="space-y-6">
            {/* General Support */}
            <Card className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">General Support</h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    Reach us directly for any questions or assistance.
                  </p>
                  <a
                    href="mailto:support@peersupporthub.com"
                    className="text-xl text-gray-900 hover:underline break-all"
                  >
                    support@peersupporthub.com
                  </a>
                </div>
              </div>
            </Card>

            {/* Collaboration & Mentor Inquiries */}
            <Card className="border-2 border-gray-900 rounded-2xl p-8 md:p-10 hover:shadow-2xl transition-all duration-300 bg-white">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-gray-900 rounded-full flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Collaboration & Mentors</h3>
                  <p className="text-gray-700 text-lg mb-4 leading-relaxed">
                    For collaboration opportunities or mentor inquiries.
                  </p>
                  <a
                    href="mailto:team@peersupporthub.com"
                    className="text-xl text-gray-900 hover:underline break-all"
                  >
                    team@peersupporthub.com
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Live Chat Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 bg-white text-center hover:shadow-2xl transition-all duration-300">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">Need Quick Help?</h2>
            
            <p className="text-gray-700 text-xl md:text-2xl mb-8 leading-relaxed max-w-2xl mx-auto">
              Chat with us live during support hours (9 AM – 9 PM PKT).
            </p>

            <Button
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={handleLiveChat}
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              Start Live Chat
            </Button>
          </Card>
        </div>
      </section>

      {/* CTA / Transition Section */}
      <section className="px-6 py-24 md:py-32 text-center bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-gray-50/50 pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <div className="flex justify-center mb-6">
            <Users className="w-16 h-16 md:w-20 md:h-20 text-gray-900" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Want to connect with peers instead?
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Join our community spaces for daily support and inspiration.
          </p>
          
          <Button
            className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            onClick={() => onNavigate('community')}
          >
            Visit Community
          </Button>
        </div>
      </section>
    </div>
  );
}

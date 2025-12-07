import { useState } from 'react';
import { Button } from '../components/ui/button';
import { MessageCircle, HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

export function FAQs({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('General');

  const categories = [
    'General',
    'Membership & Billing',
    'Peer Groups',
    'Mentorship',
    'Privacy & Safety',
  ];

  const faqs = [
    // General
    {
      category: 'General',
      question: 'What is Peer Support Hub?',
      answer: "It's a platform where students and professionals build habits and stay accountable with peers and mentors. We provide the structure, community, and support you need to achieve your goals consistently.",
    },
    {
      category: 'General',
      question: 'Is it free to use?',
      answer: 'Yes! You can start with our Free Plan and upgrade anytime for more features. The Free Plan includes 3 habit logs, access to one peer group, and weekly community challenges.',
    },
    {
      category: 'General',
      question: 'Do I need to download an app?',
      answer: 'No app download required! Peer Support Hub works entirely in your web browser on any device. Simply create an account and start building better habits right away.',
    },
    {
      category: 'General',
      question: 'How is this different from other habit trackers?',
      answer: 'Unlike traditional habit trackers, we focus on peer accountability and mentorship. You\'re not alone—you have a community of people with similar goals supporting you every step of the way.',
    },

    // Membership & Billing
    {
      category: 'Membership & Billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are securely processed through industry-standard encryption.',
    },
    {
      category: 'Membership & Billing',
      question: 'Can I cancel my paid plan anytime?',
      answer: 'Absolutely! You can cancel your subscription at any time from your account settings. You\'ll continue to have access to paid features until the end of your current billing period.',
    },
    {
      category: 'Membership & Billing',
      question: 'Is there a student discount?',
      answer: 'Yes! Students receive 20% off all paid plans. Simply verify your student status with a valid .edu email address or student ID during signup.',
    },
    {
      category: 'Membership & Billing',
      question: 'What happens if I downgrade to the Free Plan?',
      answer: 'Your data remains safe! If you downgrade, you\'ll retain access to your habit logs and progress history, but some features like unlimited habits and mentor sessions will be limited to Free Plan levels.',
    },

    // Peer Groups
    {
      category: 'Peer Groups',
      question: 'How do peer groups work?',
      answer: 'You join a small group (5-10 people) that shares your goals. Members log daily progress, check in together weekly, and provide mutual support and accountability. Groups are moderated to ensure a positive environment.',
    },
    {
      category: 'Peer Groups',
      question: 'Can I join multiple peer groups?',
      answer: 'Yes! Free Plan members can join one group, Growth Plan members can join up to 3 groups, and Pro Plan members can join up to 3 groups plus private focus groups.',
    },
    {
      category: 'Peer Groups',
      question: 'How are peer groups matched?',
      answer: 'Groups are formed based on shared goals, time zones, and availability. Our matching algorithm ensures you\'re paired with peers who have similar objectives and schedules for optimal accountability.',
    },
    {
      category: 'Peer Groups',
      question: 'What if my peer group isn\'t a good fit?',
      answer: 'You can leave any group at any time and join a different one. We want you to find a community that truly supports your growth, so feel free to explore until you find your perfect match.',
    },

    // Mentorship
    {
      category: 'Mentorship',
      question: 'Who are the mentors?',
      answer: 'Our mentors are experienced professionals, coaches, and students who have successfully built strong habits and achieved their goals. All mentors are vetted and trained to provide supportive, non-judgmental guidance.',
    },
    {
      category: 'Mentorship',
      question: 'How do I access mentor support?',
      answer: 'Free Plan members get limited mentor insights. Growth Plan members can access Mentor Q&A sessions. Pro Plan members get everything plus private 1-on-1 mentor sessions scheduled at your convenience.',
    },
    {
      category: 'Mentorship',
      question: 'Can I request a specific mentor?',
      answer: 'Pro Plan members can request preferred mentors based on availability. We do our best to match you with mentors whose expertise aligns with your specific goals and challenges.',
    },

    // Privacy & Safety
    {
      category: 'Privacy & Safety',
      question: 'Is my data private and secure?',
      answer: 'Yes! We use industry-standard encryption to protect your data. Your personal information is never shared with third parties, and you control what information is visible to your peer groups.',
    },
    {
      category: 'Privacy & Safety',
      question: 'Can I use the platform anonymously?',
      answer: 'You can use a username instead of your real name in peer groups and community spaces. The anonymous vent space allows you to share thoughts completely anonymously with community support.',
    },
    {
      category: 'Privacy & Safety',
      question: 'How do you moderate community spaces?',
      answer: 'All community spaces are actively moderated by our team. We have clear community guidelines, and any harassment, bullying, or inappropriate behavior results in immediate action to maintain a safe, supportive environment.',
    },
    {
      category: 'Privacy & Safety',
      question: 'What happens to my data if I delete my account?',
      answer: 'When you delete your account, all your personal data is permanently removed from our servers within 30 days. You can export your habit logs and progress data before deletion if you wish to keep a personal copy.',
    },
  ];

  const filteredFAQs = faqs.filter(faq => faq.category === selectedCategory);

  const handleContactSupport = () => {
    onNavigate('contact');
  };

  const handleLiveChat = () => {
    alert('Live chat coming soon! For now, please use the Contact page.');
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="flex justify-center mb-6">
            <HelpCircle className="w-16 h-16 md:w-20 md:h-20 text-gray-900" />
          </div>

          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Got Questions?
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            We've got quick, honest answers to help you get started and stay on track.
          </p>

          <div className="pt-4">
            <div className="w-16 h-1 bg-gray-900 mx-auto rounded-full"></div>
          </div>
        </div>
      </section>

      {/* FAQ Categories Filter */}
      <section className="px-6 py-12 bg-gradient-to-b from-white to-gray-50 sticky top-16 z-40 border-b border-gray-200">
        <div className="max-w-5xl mx-auto">
          {/* Mobile: Dropdown-style tabs */}
          <div className="md:hidden">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-6 py-4 text-lg rounded-full border-2 border-gray-900 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop: Horizontal scroll tabs */}
          <div className="hidden md:block overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-min justify-center">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-8 py-4 rounded-full text-lg font-bold whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-black text-white shadow-lg'
                      : 'bg-white border-2 border-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {filteredFAQs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-2 border-gray-900 rounded-2xl px-6 overflow-hidden bg-white hover:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left text-lg md:text-xl font-bold hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="pb-6 text-gray-700 text-lg leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-600 text-xl">No FAQs found in this category.</p>
          </div>
        )}
      </section>

      {/* Still Need Help CTA Section */}
      <section className="px-6 py-24 md:py-32 text-center bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-gray-50/50 pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <div className="flex justify-center mb-6">
            <MessageCircle className="w-16 h-16 md:w-20 md:h-20 text-gray-900" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
            Can't find your answer?
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            We're here for you.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={handleContactSupport}
            >
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={handleLiveChat}
            >
              Live Chat
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

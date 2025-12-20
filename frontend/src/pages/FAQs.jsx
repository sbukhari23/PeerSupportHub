import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { MessageCircle, HelpCircle, ThumbsUp, ThumbsDown, Loader2, ArrowLeft, Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import { faqsAPI, setLogoutCallback } from '../services/api';
import { toast } from 'sonner';

export function FAQs({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpfulVotes, setHelpfulVotes] = useState({});

  // Set logout callback
  useEffect(() => {
    setLogoutCallback(onNavigate);
  }, [onNavigate]);

  // Fetch FAQs from backend
  useEffect(() => {
    fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await faqsAPI.getFAQs();
      const faqData = response.data || response || [];
      
      if (faqData.length > 0) {
        setFaqs(faqData);
      } else {
        // Use fallback static data
        setFaqs(staticFaqs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      // Use fallback static data if API fails
      setFaqs(staticFaqs);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'General',
    'Membership & Billing',
    'Peer Groups',
    'Mentorship',
    'Privacy & Safety',
  ];

  // Static fallback FAQs
  const staticFaqs = [
    // General
    {
      _id: '1',
      category: 'General',
      question: 'What is Peer Support Hub?',
      answer: "It's a platform where students and professionals build habits and stay accountable with peers and mentors. We provide the structure, community, and support you need to achieve your goals consistently.",
      helpful: 45,
      notHelpful: 2
    },
    {
      _id: '2',
      category: 'General',
      question: 'Is it free to use?',
      answer: 'Yes! You can start with our Free Plan and upgrade anytime for more features. The Free Plan includes 3 habit logs, access to one peer group, and weekly community challenges.',
      helpful: 38,
      notHelpful: 1
    },
    {
      _id: '3',
      category: 'General',
      question: 'Do I need to download an app?',
      answer: 'No app download required! Peer Support Hub works entirely in your web browser on any device. Simply create an account and start building better habits right away.',
      helpful: 32,
      notHelpful: 3
    },
    {
      _id: '4',
      category: 'General',
      question: 'How is this different from other habit trackers?',
      answer: 'Unlike traditional habit trackers, we focus on peer accountability and mentorship. You\'re not alone—you have a community of people with similar goals supporting you every step of the way.',
      helpful: 56,
      notHelpful: 4
    },
    // Membership & Billing
    {
      _id: '5',
      category: 'Membership & Billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are securely processed through industry-standard encryption.',
      helpful: 22,
      notHelpful: 0
    },
    {
      _id: '6',
      category: 'Membership & Billing',
      question: 'Can I cancel my paid plan anytime?',
      answer: 'Absolutely! You can cancel your subscription at any time from your account settings. You\'ll continue to have access to paid features until the end of your current billing period.',
      helpful: 41,
      notHelpful: 2
    },
    // Peer Groups
    {
      _id: '7',
      category: 'Peer Groups',
      question: 'How do peer groups work?',
      answer: 'You join a small group (5-10 people) that shares your goals. Members log daily progress, check in together weekly, and provide mutual support and accountability. Groups are moderated to ensure a positive environment.',
      helpful: 67,
      notHelpful: 3
    },
    {
      _id: '8',
      category: 'Peer Groups',
      question: 'Can I join multiple peer groups?',
      answer: 'Yes! Free Plan members can join one group, Growth Plan members can join up to 3 groups, and Pro Plan members can join up to 3 groups plus private focus groups.',
      helpful: 29,
      notHelpful: 1
    },
    // Mentorship
    {
      _id: '9',
      category: 'Mentorship',
      question: 'Who are the mentors?',
      answer: 'Our mentors are experienced professionals, coaches, and students who have successfully built strong habits and achieved their goals. All mentors are vetted and trained to provide supportive, non-judgmental guidance.',
      helpful: 45,
      notHelpful: 2
    },
    {
      _id: '10',
      category: 'Mentorship',
      question: 'How do I access mentor support?',
      answer: 'Free Plan members get limited mentor insights. Growth Plan members can access Mentor Q&A sessions. Pro Plan members get everything plus private 1-on-1 mentor sessions scheduled at your convenience.',
      helpful: 33,
      notHelpful: 5
    },
    // Privacy & Safety
    {
      _id: '11',
      category: 'Privacy & Safety',
      question: 'Is my data private and secure?',
      answer: 'Yes! We use industry-standard encryption to protect your data. Your personal information is never shared with third parties, and you control what information is visible to your peer groups.',
      helpful: 89,
      notHelpful: 1
    },
    {
      _id: '12',
      category: 'Privacy & Safety',
      question: 'Can I use the platform anonymously?',
      answer: 'You can use a username instead of your real name in peer groups and community spaces. The anonymous vent space allows you to share thoughts completely anonymously with community support.',
      helpful: 51,
      notHelpful: 2
    },
  ];

  const handleVoteHelpful = async (faqId, isHelpful) => {
    // Check if already voted
    if (helpfulVotes[faqId]) {
      toast.info('You already voted on this FAQ');
      return;
    }

    try {
      if (isHelpful) {
        await faqsAPI.markHelpful(faqId).catch(() => {});
      } else {
        await faqsAPI.markNotHelpful(faqId).catch(() => {});
      }
      
      setHelpfulVotes(prev => ({ ...prev, [faqId]: isHelpful ? 'helpful' : 'not-helpful' }));
      toast.success(isHelpful ? 'Thanks for the feedback!' : 'We\'ll work on improving this');
      
      // Update local state
      setFaqs(prev => prev.map(faq => {
        if (faq._id === faqId) {
          return {
            ...faq,
            helpful: isHelpful ? (faq.helpful || 0) + 1 : faq.helpful,
            notHelpful: !isHelpful ? (faq.notHelpful || 0) + 1 : faq.notHelpful
          };
        }
        return faq;
      }));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  // Filter FAQs by category and search
  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactSupport = () => {
    onNavigate('contact');
  };

  const handleLiveChat = () => {
    toast.info('Live chat coming soon! For now, please use the Contact page.');
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Back Button */}
          <div className="absolute left-0 top-0">
            <Button
              variant="ghost"
              onClick={() => onNavigate('dashboard')}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          </div>

          <div className="flex justify-center mb-6">
            <HelpCircle className="w-16 h-16 md:w-20 md:h-20 text-gray-900" />
          </div>

          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Got Questions?
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            We've got quick, honest answers to help you get started and stay on track.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-full border-2 border-gray-300 focus:border-black transition-all"
              />
            </div>
          </div>

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
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {filteredFAQs.map((faq, index) => (
                <AccordionItem
                  key={faq._id || index}
                  value={`faq-${faq._id || index}`}
                  className="border-2 border-gray-900 rounded-2xl px-6 overflow-hidden bg-white hover:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="text-left text-lg md:text-xl font-bold hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-gray-700 text-lg leading-relaxed mb-4">
                      {faq.answer}
                    </p>
                    
                    {/* Helpful Vote Section */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">Was this helpful?</span>
                      <button
                        onClick={() => handleVoteHelpful(faq._id, true)}
                        disabled={!!helpfulVotes[faq._id]}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                          helpfulVotes[faq._id] === 'helpful'
                            ? 'bg-green-100 text-green-700'
                            : 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{faq.helpful || 0}</span>
                      </button>
                      <button
                        onClick={() => handleVoteHelpful(faq._id, false)}
                        disabled={!!helpfulVotes[faq._id]}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                          helpfulVotes[faq._id] === 'not-helpful'
                            ? 'bg-red-100 text-red-700'
                            : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{faq.notHelpful || 0}</span>
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {filteredFAQs.length === 0 && (
              <div className="text-center py-16">
                <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-xl">No FAQs found matching your search.</p>
                <p className="text-gray-500 mt-2">Try a different search term or category.</p>
              </div>
            )}
          </>
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

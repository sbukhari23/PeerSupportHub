import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Check, X } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

export function Membership({ onNavigate }) {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const scrollToComparison = () => {
    const element = document.getElementById('comparison-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoinFree = () => {
    setSelectedPlan('free');
    localStorage.setItem('selectedPlan', 'free');
    onNavigate('signup');
  };

  const handleChoosePlan = (plan) => {
    setSelectedPlan(plan);
    localStorage.setItem('selectedPlan', plan.toLowerCase());
    onNavigate('signup');
  };

  return (
    <div className="bg-white">
      {/* Page Intro / Hero */}
      <section className="bg-white px-6 py-20 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h1 className="text-foreground text-4xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            Choose a plan that fits your growth.
          </h1>

          <p className="text-gray-600 text-xl md:text-2xl leading-relaxed max-w-3xl mx-auto">
            Start free — upgrade anytime for deeper guidance and mentor access.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
            <Button 
              className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
              onClick={handleJoinFree}
            >
              Join Free
            </Button>
            <Button 
              variant="outline" 
              className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
              onClick={scrollToComparison}
            >
              Compare Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Free Plan Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-all duration-300 bg-white">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Free Plan</h2>
            <p className="text-gray-700 text-lg md:text-xl leading-relaxed">
              Perfect for getting started with focus and consistency.
            </p>
          </div>

          <ul className="space-y-4 mb-10">
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-gray-700 text-lg">Log up to 3 habits</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-gray-700 text-lg">Join one peer group</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-gray-700 text-lg">Access weekly community challenges</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-gray-700 text-lg">Limited mentor insights</span>
            </li>
          </ul>

          <Button 
            className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
            onClick={handleJoinFree}
          >
            Start Free
          </Button>
        </Card>
      </section>

      {/* Paid Plans Section */}
      <section className="px-6 py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Upgrade for accountability that lasts.
            </h2>
          </div>

          <div className="space-y-8">
            {/* Growth Plan */}
            <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-all duration-300 bg-white">
              <div className="mb-8">
                <div className="text-sm tracking-widest uppercase text-gray-500 mb-2">Mid-Tier</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Growth Plan</h3>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Unlimited habit logs</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Join up to 3 peer groups</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Mentor Q&A access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Monthly growth review</span>
                </li>
              </ul>

              <Button 
                className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleChoosePlan('Growth')}
              >
                Choose Growth
              </Button>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-gray-900 rounded-2xl p-10 md:p-12 hover:shadow-2xl transition-all duration-300 bg-white">
              <div className="mb-8">
                <div className="text-sm tracking-widest uppercase text-gray-500 mb-2">Top-Tier</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Pro Plan</h3>
              </div>

              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">All Growth features</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">1-on-1 mentor sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Private focus group access</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                  <span className="text-gray-700 text-lg">Digital discipline toolkit downloads</span>
                </li>
              </ul>

              <Button 
                className="rounded-full bg-black hover:bg-gray-800 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                onClick={() => handleChoosePlan('Pro')}
              >
                Go Pro
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section id="comparison-section" className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Compare All Features</h2>
          <p className="text-gray-600 text-lg">See what's included in each plan</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="comparison" className="border-2 border-gray-900 rounded-2xl px-6 mb-4">
            <AccordionTrigger className="text-xl font-bold hover:no-underline py-6">
              View Feature Comparison
            </AccordionTrigger>
            <AccordionContent className="pb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="pb-4 pr-4 text-lg">Feature</th>
                      <th className="pb-4 px-4 text-lg">Free</th>
                      <th className="pb-4 px-4 text-lg">Growth</th>
                      <th className="pb-4 pl-4 text-lg">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Habit Logs</td>
                      <td className="py-4 px-4">3 habits</td>
                      <td className="py-4 px-4">Unlimited</td>
                      <td className="py-4 pl-4">Unlimited</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Peer Groups</td>
                      <td className="py-4 px-4">1 group</td>
                      <td className="py-4 px-4">3 groups</td>
                      <td className="py-4 pl-4">3 groups</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Community Challenges</td>
                      <td className="py-4 px-4"><Check className="w-5 h-5" /></td>
                      <td className="py-4 px-4"><Check className="w-5 h-5" /></td>
                      <td className="py-4 pl-4"><Check className="w-5 h-5" /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Mentor Insights</td>
                      <td className="py-4 px-4">Limited</td>
                      <td className="py-4 px-4">Q&A Access</td>
                      <td className="py-4 pl-4">Q&A + 1-on-1</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Monthly Review</td>
                      <td className="py-4 px-4"><X className="w-5 h-5 text-gray-400" /></td>
                      <td className="py-4 px-4"><Check className="w-5 h-5" /></td>
                      <td className="py-4 pl-4"><Check className="w-5 h-5" /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-4 pr-4">Private Focus Groups</td>
                      <td className="py-4 px-4"><X className="w-5 h-5 text-gray-400" /></td>
                      <td className="py-4 px-4"><X className="w-5 h-5 text-gray-400" /></td>
                      <td className="py-4 pl-4"><Check className="w-5 h-5" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 pr-4">Toolkit Downloads</td>
                      <td className="py-4 px-4"><X className="w-5 h-5 text-gray-400" /></td>
                      <td className="py-4 px-4"><X className="w-5 h-5 text-gray-400" /></td>
                      <td className="py-4 pl-4"><Check className="w-5 h-5" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
            onClick={handleJoinFree}
          >
            Join Free
          </Button>
          <Button 
            className="rounded-full bg-black hover:bg-gray-800 px-10 py-7 text-xl shadow-xl hover:shadow-2xl transition-all"
            onClick={() => handleChoosePlan('Upgrade')}
          >
            Upgrade Now
          </Button>
        </div>
      </section>

      {/* FAQ Prompt Section */}
      <section className="px-6 py-20 md:py-28 text-center bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
            Not sure which plan is right for you?
          </h2>
          
          <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
            We're here to help you find the perfect fit for your growth journey.
          </p>
          
          <Button 
            variant="outline" 
            className="rounded-full border-2 border-black px-10 py-7 text-xl hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
            onClick={() => onNavigate('faqs')}
          >
            Read FAQs
          </Button>
        </div>
      </section>
    </div>
  );
}

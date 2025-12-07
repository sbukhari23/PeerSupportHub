import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, CreditCard, Lock, Check } from 'lucide-react';

export function Payment({ onNavigate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const selectedPlan = localStorage.getItem('selectedPlan') || 'growth';
  
  const planDetails = {
    growth: { name: 'Growth', price: 9, billing: 'month' },
    pro: { name: 'Pro', price: 19, billing: 'month' }
  };

  const plan = planDetails[selectedPlan] || planDetails.growth;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Store payment status
      localStorage.setItem('paymentComplete', 'true');
      onNavigate('onboarding');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => onNavigate('signup')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="font-bold text-xl">PeerSupportHub</span>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600">You're one step away from unlocking your potential</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card className="p-6 border-2 border-gray-200">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold">{plan.name} Plan</p>
                    <p className="text-sm text-gray-600">Billed monthly</p>
                  </div>
                  <p className="text-xl font-bold">${plan.price}/mo</p>
                </div>
                
                <hr className="border-gray-200" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Unlimited habit tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Access to all groups</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Mentor support</span>
                  </div>
                  {selectedPlan === 'pro' && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>1-on-1 mentor sessions</span>
                    </div>
                  )}
                </div>

                <hr className="border-gray-200" />

                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>${plan.price}/month</span>
                </div>
              </div>
            </Card>

            {/* Payment Form */}
            <Card className="p-6 border-2 border-gray-900">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5" />
                <h2 className="text-xl font-bold">Payment Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    required
                    className="py-3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="4242 4242 4242 4242"
                    required
                    className="py-3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      required
                      className="py-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      required
                      className="py-3"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-6 text-lg rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-400"
                >
                  {isProcessing ? 'Processing...' : `Pay $${plan.price}/month`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
              </form>
            </Card>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            You can cancel anytime. No questions asked.
          </p>
        </div>
      </main>
    </div>
  );
}

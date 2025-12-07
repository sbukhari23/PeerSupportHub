import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowRight, Target, Users, Sparkles, Check } from 'lucide-react';

const FOCUS_AREAS = [
  { id: 'health', label: 'Health & Fitness', icon: '💪' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
  { id: 'learning', label: 'Learning', icon: '📚' },
  { id: 'creativity', label: 'Creativity', icon: '🎨' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'sleep', label: 'Sleep', icon: '😴' },
];

const STARTER_HABITS = [
  { id: 'water', name: 'Drink 8 glasses of water', category: 'health' },
  { id: 'exercise', name: '30 min exercise', category: 'health' },
  { id: 'read', name: 'Read for 20 minutes', category: 'learning' },
  { id: 'meditate', name: 'Meditate for 10 minutes', category: 'mindfulness' },
  { id: 'journal', name: 'Write in journal', category: 'mindfulness' },
  { id: 'sleep', name: 'Sleep by 10pm', category: 'sleep' },
];

export function Onboarding({ onNavigate }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    focusAreas: [],
    selectedHabits: [],
    wantsMentor: false,
  });

  const totalSteps = 4;

  const handleFocusToggle = (areaId) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(areaId)
        ? prev.focusAreas.filter((id) => id !== areaId)
        : [...prev.focusAreas, areaId],
    }));
  };

  const handleHabitToggle = (habitId) => {
    setFormData((prev) => ({
      ...prev,
      selectedHabits: prev.selectedHabits.includes(habitId)
        ? prev.selectedHabits.filter((id) => id !== habitId)
        : [...prev.selectedHabits, habitId],
    }));
  };

  const handleComplete = () => {
    // Save onboarding data
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('onboardingData', JSON.stringify(formData));
    onNavigate('dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome aboard! 👋</h2>
              <p className="text-gray-600">Let's personalize your experience</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">What should we call you?</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  placeholder="Your name or nickname"
                  className="py-3 text-lg"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">What are your focus areas?</h2>
              <p className="text-gray-600">Select all that apply</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => handleFocusToggle(area.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.focusAreas.includes(area.id)
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{area.icon}</span>
                  <span className="font-medium text-sm">{area.label}</span>
                  {formData.focusAreas.includes(area.id) && (
                    <Check className="w-4 h-4 inline ml-2 text-green-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Pick some starter habits</h2>
              <p className="text-gray-600">You can always add more later</p>
            </div>

            <div className="space-y-3">
              {STARTER_HABITS.map((habit) => (
                <Card
                  key={habit.id}
                  className={`p-4 cursor-pointer transition-all ${
                    formData.selectedHabits.includes(habit.id)
                      ? 'border-2 border-black bg-gray-50'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleHabitToggle(habit.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={formData.selectedHabits.includes(habit.id)}
                      onCheckedChange={() => handleHabitToggle(habit.id)}
                    />
                    <span className="font-medium">{habit.name}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Want a mentor?</h2>
              <p className="text-gray-600">Get matched with someone who's been there</p>
            </div>

            <div className="space-y-4">
              <Card
                className={`p-6 cursor-pointer transition-all ${
                  formData.wantsMentor
                    ? 'border-2 border-black bg-gray-50'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, wantsMentor: true })}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">Yes, match me with a mentor</h3>
                    <p className="text-sm text-gray-600">
                      Get personalized guidance and accountability from someone with experience
                    </p>
                  </div>
                  {formData.wantsMentor && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </Card>

              <Card
                className={`p-6 cursor-pointer transition-all ${
                  !formData.wantsMentor
                    ? 'border-2 border-black bg-gray-50'
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData({ ...formData, wantsMentor: false })}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">Not right now</h3>
                    <p className="text-sm text-gray-600">
                      I'll start on my own and maybe connect later
                    </p>
                  </div>
                  {!formData.wantsMentor && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress bar */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Step {step} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md p-8 border-2 border-gray-200">
          {renderStep()}

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
                className="flex-1 py-6 rounded-full"
              >
                Back
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !formData.displayName.trim()) ||
                  (step === 2 && formData.focusAreas.length === 0)
                }
                className="flex-1 py-6 rounded-full bg-black hover:bg-gray-800 disabled:bg-gray-300"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex-1 py-6 rounded-full bg-black hover:bg-gray-800"
              >
                Get Started
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

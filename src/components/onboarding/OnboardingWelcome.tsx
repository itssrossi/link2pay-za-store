import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Store, Zap, Users, ArrowRight, ChevronLeft } from 'lucide-react';

interface OnboardingWelcomeProps {
  onComplete: (selections: { sellType: string; businessType: string }) => void;
}

const OnboardingWelcome: React.FC<OnboardingWelcomeProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    sellType: '',
    businessType: ''
  });

  const steps = [
    {
      title: "What do you plan to sell?",
      options: [
        { id: 'products', label: 'Physical Products', icon: Package, desc: 'Items you can ship or deliver' },
        { id: 'services', label: 'Services', icon: Users, desc: 'Appointments, consultations, etc.' },
        { id: 'both', label: 'Products & Services', icon: Store, desc: 'Mix of physical and service offerings' }
      ]
    },
    {
      title: "Tell us about your business",
      options: [
        { id: 'new', label: 'New Business', icon: Zap, desc: "I'm just getting started" },
        { id: 'existing', label: 'Existing Business', icon: Store, desc: 'Already selling elsewhere' },
        { id: 'growing', label: 'Growing Business', icon: Users, desc: 'Ready to expand online' }
      ]
    }
  ];

  const handleOptionSelect = (value: string) => {
    const stepKeys = ['sellType', 'businessType'];
    const newSelections = { ...selections, [stepKeys[currentStep]]: value };
    setSelections(newSelections);

    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => onComplete(newSelections), 300);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-2 sm:p-4 py-4 sm:py-8">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
        <div className="mb-4 sm:mb-8 px-2 sm:px-0">
          <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <Card className="border-0 shadow-2xl mx-2 sm:mx-0">
          <CardContent className="p-4 sm:p-8 lg:p-12">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2 sm:mb-4 leading-tight">
                {steps[currentStep].title}
              </h1>
              <p className="text-sm sm:text-lg text-muted-foreground">
                Help us customize your experience
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 lg:gap-6">
              {steps[currentStep].options.map((option, index) => {
                const Icon = option.icon;
                return (
                  <Card 
                    key={option.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${
                      selections[Object.keys(selections)[currentStep] as keyof typeof selections] === option.id 
                        ? 'border-primary shadow-lg' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleOptionSelect(option.id)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-3 sm:p-6 flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-lg text-foreground mb-1">
                          {option.label}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {option.desc}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {currentStep > 0 && (
              <div className="flex justify-start mt-6 sm:mt-8 px-2 sm:px-0">
                <Button variant="ghost" onClick={handleBack} className="flex items-center text-sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWelcome;
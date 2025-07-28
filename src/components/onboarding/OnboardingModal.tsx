
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Store, CreditCard, Users, BarChart3, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();
  const { setShowOnboarding, setNeedsBillingSetup } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Link2Pay!",
      icon: <Store className="w-12 h-12 text-green-600" />,
      description: "Transform your business with our complete e-commerce solution. Let's get you started!",
      features: [
        "Create your online store in minutes",
        "Accept payments with PayFast integration",
        "WhatsApp automation for customer engagement",
        "Professional invoice generation"
      ]
    },
    {
      title: "Start Your Free Trial",
      icon: <CreditCard className="w-12 h-12 text-blue-600" />,
      description: "Get 7 days free to explore all features. Setup billing information now to activate your trial.",
      features: [
        "7-day completely free trial",
        "Full access to all features",
        "No charges until trial ends",
        "Cancel anytime during trial"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleStartTrial = () => {
    setShowOnboarding(false);
    setNeedsBillingSetup(true);
    onClose();
    navigate('/billing-setup');
  };

  const handleSkip = () => {
    setShowOnboarding(false);
    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {currentStepData.icon}
          </div>

          {/* Content */}
          <div>
            <h2 className="text-2xl font-bold mb-3">{currentStepData.title}</h2>
            <p className="text-gray-600 mb-6">{currentStepData.description}</p>
          </div>

          {/* Features */}
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {currentStepData.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {currentStep === 0 ? (
              <Button onClick={handleNext} className="w-full bg-green-600 hover:bg-green-700">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleStartTrial} className="w-full bg-blue-600 hover:bg-blue-700">
                Start Free Trial
                <CreditCard className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            <Button variant="outline" onClick={handleSkip} className="w-full">
              Skip for now
            </Button>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-green-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

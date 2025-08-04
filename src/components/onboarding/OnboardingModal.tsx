
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Store, ArrowRight, Play } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();
  const { completeOnboarding, skipOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);

  const stepData = {
    title: "Welcome to Link2Pay!",
    icon: <Store className="w-12 h-12 text-green-600" />,
    description: "Transform your business with our complete e-commerce solution. Let's get you started!",
    features: [
      "Create your online store in minutes",
      "Accept payments with PayFast integration",
      "WhatsApp automation for customer engagement",
      "Professional invoice generation"
    ]
  };

  const handleNext = () => {
    setCurrentStep(1);
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
    onClose();
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    await skipOnboarding();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
        </DialogHeader>
        
        {currentStep === 0 ? (
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              {stepData.icon}
            </div>

            {/* Content */}
            <div>
              <h2 className="text-2xl font-bold mb-3">{stepData.title}</h2>
              <p className="text-gray-600 mb-6">{stepData.description}</p>
            </div>

            {/* Features */}
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-3">
                  {stepData.features.map((feature, index) => (
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
              <Button onClick={handleNext} className="w-full bg-green-600 hover:bg-green-700">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button variant="outline" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            {/* Tutorial Icon */}
            <div className="flex justify-center">
              <Play className="w-12 h-12 text-green-600" />
            </div>

            {/* Tutorial Content */}
            <div>
              <h2 className="text-2xl font-bold mb-3">Onboarding Tutorial</h2>
              <p className="text-gray-600 mb-6">Watch this quick tutorial to get the most out of Link2Pay</p>
            </div>

            {/* Video */}
            <div className="w-full">
              <video 
                controls 
                className="w-full rounded-lg"
                preload="metadata"
              >
                <source src="https://mpzqlidtvlbijloeusuj.supabase.co/storage/v1/object/public/onboarding-content/Link2pay%20onboarding%20.mov" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleGetStarted} className="w-full bg-green-600 hover:bg-green-700">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button variant="outline" onClick={handleSkip} className="w-full">
                Skip for now
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

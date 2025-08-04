
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
            {/* Tutorial Content */}
            <div>
              <h2 className="text-2xl font-bold mb-3">Welcome to Link2Pay!</h2>
            </div>

            {/* Video */}
            <div className="w-full">
              <video 
                controls 
                className="w-full rounded-lg shadow-lg"
                preload="metadata"
                poster="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgdmlld0JveD0iMCAwIDQwMCAyMjUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjI1IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTEyLjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGluazJQYXkgT25ib2FyZGluZzwvdGV4dD4KPHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeD0iMTY4IiB5PSI4MCI+CjxwYXRoIGQ9Im04IDIgOC4wOTgtLjA4IDEuOTcyIDEuOTdBMSAxIDAgMCAxIDIwIDVsLS4wMzEgOC4wNjYtMS45MDQgMS45MDRhMSAxIDAgMCAxLTEuNDE0IDBMMTMgMTFoLTFhMSAxIDAgMCAxIDAtMmgxem0wIDQuIDUtNXY4eiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4KPC9zdmc+"
              >
                <source src="https://mpzqlidtvlbijloeusuj.supabase.co/storage/v1/object/public/onboarding-content/Link2pay%20onboarding%20.mov" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={handleGetStarted} className="w-full bg-green-600 hover:bg-green-700">
                Done
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button variant="outline" onClick={handleSkip} className="w-full">
                Skip
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

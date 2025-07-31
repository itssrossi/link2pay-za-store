
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Store, ArrowRight } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useNavigate } from 'react-router-dom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const navigate = useNavigate();
  const { setShowOnboarding, setNeedsBillingSetup } = useOnboarding();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
        </DialogHeader>
        
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
            <Button onClick={handleStartTrial} className="w-full bg-green-600 hover:bg-green-700">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button variant="outline" onClick={handleSkip} className="w-full">
              Skip for now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

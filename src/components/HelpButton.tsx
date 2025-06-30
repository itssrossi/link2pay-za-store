
import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';

const HelpButton: React.FC = () => {
  const { startOverlayTutorial } = useOnboardingFlow();

  return (
    <Button
      onClick={startOverlayTutorial}
      variant="ghost"
      size="sm"
      className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-[#4C9F70] text-white hover:bg-[#3d8159] shadow-lg"
    >
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
};

export default HelpButton;

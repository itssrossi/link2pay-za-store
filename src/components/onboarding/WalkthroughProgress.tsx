import React from 'react';
import { Progress } from '@/components/ui/progress';

interface WalkthroughProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

const WalkthroughProgress: React.FC<WalkthroughProgressProps> = ({ 
  currentStep, 
  totalSteps, 
  stepTitles 
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-white/20 rounded-lg p-4 min-w-[300px] max-w-[500px] pointer-events-auto z-[10001]">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-900">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-gray-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="text-sm font-medium text-gray-900 truncate">
          {stepTitles[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default WalkthroughProgress;
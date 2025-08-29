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
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-5 min-w-[300px] max-w-[500px] pointer-events-auto z-[10001] shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-gray-900">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-gray-600 font-medium">
            {Math.round(progress)}% Complete
          </span>
        </div>
        
        <Progress value={progress} className="h-3" />
        
        <div className="text-sm font-semibold text-gray-900 truncate">
          {stepTitles[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default WalkthroughProgress;
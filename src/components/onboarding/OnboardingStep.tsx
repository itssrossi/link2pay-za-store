
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
  title,
  subtitle,
  description,
  icon,
  children
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] px-4 sm:px-8 text-center">
      {icon && (
        <div className="mb-4 sm:mb-6 text-6xl animate-pulse">
          {icon}
        </div>
      )}
      
      <div className="space-y-3 sm:space-y-4 max-w-sm sm:max-w-md">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{title}</h2>
        
        {subtitle && (
          <p className="text-base sm:text-lg text-[#4C9F70] font-medium">{subtitle}</p>
        )}
        
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
        
        {children}
      </div>
    </div>
  );
};

export default OnboardingStep;

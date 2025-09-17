import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar } from 'lucide-react';
import { OnboardingChoice } from '../NewOnboardingContainer';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

interface OnboardingChoiceProps {
  onChoice: (choice: OnboardingChoice) => void;
}

const OnboardingChoiceComponent: React.FC<OnboardingChoiceProps> = ({ onChoice }) => {
  const { trackCompletion } = useOnboardingTracking({
    stepName: 'choice_selection',
    stepNumber: 0
  });

  const handleChoice = async (choice: OnboardingChoice) => {
    await trackCompletion({ selected_choice: choice });
    onChoice(choice);
  };
  return (
    <div className="text-center space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          Welcome to Link2Pay!
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-600">
          Let's get your business set up. What type of business are you running?
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 md:gap-6 md:grid-cols-2">
        <Card 
          className="cursor-pointer border-2 hover:border-primary transition-all duration-200 hover:shadow-lg"
          onClick={() => handleChoice('physical_products')}
        >
          <CardHeader className="text-center pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <CardTitle className="text-base sm:text-lg md:text-xl">Physical Products</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-3 sm:p-4 md:p-6 pt-0">
            <CardDescription className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">
              Sell physical products like clothing, electronics, handmade items, or any tangible goods that need to be shipped or picked up.
            </CardDescription>
            <Button 
              onClick={() => handleChoice('physical_products')}
              className="w-full min-h-[40px] sm:min-h-[44px]"
              size="sm"
            >
              Choose Products
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-2 hover:border-primary transition-all duration-200 hover:shadow-lg"
          onClick={() => handleChoice('bookings')}
        >
          <CardHeader className="text-center pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <CardTitle className="text-base sm:text-lg md:text-xl">Bookings / Appointments</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-3 sm:p-4 md:p-6 pt-0">
            <CardDescription className="text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">
              Offer appointment-based services like consultations, beauty treatments, repairs, or any business that requires scheduling.
            </CardDescription>
            <Button 
              onClick={() => handleChoice('bookings')}
              className="w-full min-h-[40px] sm:min-h-[44px]"
              size="sm"
            >
              Choose Bookings
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs sm:text-sm text-gray-500">
        Don't worry, you can always add the other option later from your dashboard.
      </p>
    </div>
  );
};

export default OnboardingChoiceComponent;
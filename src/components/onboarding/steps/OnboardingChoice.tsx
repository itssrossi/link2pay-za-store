import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar } from 'lucide-react';
import { OnboardingChoice } from '../NewOnboardingContainer';

interface OnboardingChoiceProps {
  onChoice: (choice: OnboardingChoice) => void;
}

const OnboardingChoiceComponent: React.FC<OnboardingChoiceProps> = ({ onChoice }) => {
  return (
    <div className="text-center space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome to Link2Pay!
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Let's get your business set up. What type of business are you running?
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card 
          className="cursor-pointer border-2 hover:border-primary transition-all duration-200 hover:shadow-lg"
          onClick={() => onChoice('physical_products')}
        >
          <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Physical Products</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-4 sm:p-6 pt-0">
            <CardDescription className="text-sm sm:text-base mb-4 sm:mb-6">
              Sell physical products like clothing, electronics, handmade items, or any tangible goods that need to be shipped or picked up.
            </CardDescription>
            <Button 
              onClick={() => onChoice('physical_products')}
              className="w-full min-h-[44px]"
              size="lg"
            >
              Choose Products
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-2 hover:border-primary transition-all duration-200 hover:shadow-lg"
          onClick={() => onChoice('bookings')}
        >
          <CardHeader className="text-center pb-3 sm:pb-4 p-4 sm:p-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl">Bookings / Appointments</CardTitle>
          </CardHeader>
          <CardContent className="text-center p-4 sm:p-6 pt-0">
            <CardDescription className="text-sm sm:text-base mb-4 sm:mb-6">
              Offer appointment-based services like consultations, beauty treatments, repairs, or any business that requires scheduling.
            </CardDescription>
            <Button 
              onClick={() => onChoice('bookings')}
              className="w-full min-h-[44px]"
              size="lg"
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
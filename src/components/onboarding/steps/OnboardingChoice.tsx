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
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Welcome to Link2Pay!
        </h1>
        <p className="text-lg text-gray-600">
          Let's get your business set up. What type of business are you running?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className="cursor-pointer border-2 hover:border-primary transition-all duration-200 hover:shadow-lg"
          onClick={() => onChoice('physical_products')}
        >
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Physical Products</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription className="text-base mb-6">
              Sell physical products like clothing, electronics, handmade items, or any tangible goods that need to be shipped or picked up.
            </CardDescription>
            <Button 
              onClick={() => onChoice('physical_products')}
              className="w-full"
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
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Bookings / Appointments</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription className="text-base mb-6">
              Offer appointment-based services like consultations, beauty treatments, repairs, or any business that requires scheduling.
            </CardDescription>
            <Button 
              onClick={() => onChoice('bookings')}
              className="w-full"
              size="lg"
            >
              Choose Bookings
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-gray-500">
        Don't worry, you can always add the other option later from your dashboard.
      </p>
    </div>
  );
};

export default OnboardingChoiceComponent;
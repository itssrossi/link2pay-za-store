import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Confetti, triggerConfetti } from '@/components/ui/confetti';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';

interface SuccessStepProps {
  onComplete: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ onComplete, state }) => {
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [uniqueLink, setUniqueLink] = useState('');

  useEffect(() => {
    // Trigger confetti on mount
    setShowConfetti(true);
    triggerConfetti();
    generateUniqueLink();
    enableInvoiceTabGlow();
  }, []);

  const generateUniqueLink = () => {
    const baseUrl = window.location.origin;
    if (state.choice === 'bookings') {
      setUniqueLink(`${baseUrl}/book/${state.storeHandle}`);
    } else {
      setUniqueLink(`${baseUrl}/storefront/${state.storeHandle}`);
    }
  };

  const enableInvoiceTabGlow = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ glowing_invoice_tab: true })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error enabling invoice tab glow:', error);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(uniqueLink);
    toast.success('Link copied to clipboard!');
  };

  const openLink = () => {
    window.open(uniqueLink, '_blank');
  };

  const getSuccessMessage = () => {
    if (state.choice === 'bookings') {
      return {
        title: 'Congratulations! 🎉',
        subtitle: 'Your booking system is ready!',
        description: 'Share your booking link and begin to accept bookings.',
        linkLabel: 'Your Booking Link'
      };
    } else {
      return {
        title: 'Congratulations! 🎉',
        subtitle: 'Your store is live!',
        description: 'Share your store link and begin to accept orders.',
        linkLabel: 'Your Store Link'
      };
    }
  };

  const success = getSuccessMessage();

  return (
    <div className="text-center space-y-6 sm:space-y-8 px-4 sm:px-0 pb-20 sm:pb-12">
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="space-y-3 sm:space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {success.title}
        </h2>
        <p className="text-lg sm:text-xl text-gray-700 font-medium">
          {success.subtitle}
        </p>
        <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto">
          {success.description}
        </p>
      </div>

      <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">{success.linkLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="bg-white rounded-lg p-3 font-mono text-xs sm:text-sm break-all">
            {uniqueLink}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button onClick={copyLink} className="flex-1 min-h-[44px]" size="lg">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={openLink} variant="outline" className="flex-1 min-h-[44px]" size="lg">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
          <p className="text-xs sm:text-sm text-yellow-800">
            💡 <strong>Don't forget to invoice your clients to get paid!</strong> Check out the Invoice tab (it's glowing!) to create your first invoice.
          </p>
        </div>
        
        {state.choice === 'bookings' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
            <p className="text-xs sm:text-sm text-blue-800">
              ⚡ <strong>Automatic payments</strong> can be setup via PayFast in Bookings tab in settings.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700 min-h-[44px] w-full sm:w-auto sm:min-w-48">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Confetti, triggerConfetti } from '@/components/ui/confetti';
import { Copy, ExternalLink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';
import { playCelebrationSound } from '@/utils/celebrationSound';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

interface SuccessStepProps {
  onComplete: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
}

const SuccessStep: React.FC<SuccessStepProps> = ({ onComplete, state }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showConfetti, setShowConfetti] = useState(false);
  const [uniqueLink, setUniqueLink] = useState('');
  const [soundPlayed, setSoundPlayed] = useState(false);
  
  const { trackCompletion } = useOnboardingTracking({
    stepName: 'success',
    stepNumber: 4,
    onboardingType: state.choice || undefined
  });

  useEffect(() => {
    // Trigger confetti and sound on mount
    setShowConfetti(true);
    triggerConfetti();
    
    // Try to play sound immediately, but also set up user interaction fallback
    playCelebrationSound().then(() => {
      setSoundPlayed(true);
    }).catch(() => {
      // Will be handled by user interaction
    });
  }, []);

  // Handle user interaction to play sound on mobile
  const handleUserInteraction = () => {
    if (!soundPlayed) {
      playCelebrationSound().then(() => {
        setSoundPlayed(true);
      });
    }
  };

  // Generate link when storeHandle is available
  useEffect(() => {
    if (state.storeHandle) {
      generateUniqueLink();
    }
  }, [state.storeHandle]);

  const generateUniqueLink = () => {
    const baseUrl = window.location.origin;
    // Both bookings and store use the same /store/:username route
    setUniqueLink(`${baseUrl}/store/${state.storeHandle}`);
  };

  const enableInvoiceTabGlow = async () => {
    if (!user) return;

    try {
      await supabase
        .from('profiles')
        .update({ glowing_invoice_tab: true })
        .eq('id', user.id);
      // Signal Layout to allow glow immediately on Success page
      localStorage.setItem('invoiceGlowReady', 'true');
      window.dispatchEvent(new Event('invoice-glow-ready'));
      
      // Enable tip popup for when user reaches dashboard
      localStorage.setItem('tipPopupReady', 'true');
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

  const handleGoToDashboard = async () => {
    await trackCompletion({
      store_handle: state.storeHandle,
      final_choice: state.choice
    });
    await enableInvoiceTabGlow();
    
    // Dispatch custom events for immediate UI updates
    window.dispatchEvent(new Event('invoice-glow-ready'));
    window.dispatchEvent(new Event('tip-popup-ready'));
    
    navigate('/invoice/quick-start');
  };

  const success = {
    title: '🎉 You\'re all set up!',
    subtitle: 'Let\'s send your first invoice — it only takes 30 seconds',
    linkLabel: state.choice === 'bookings' ? 'Your Booking Link' : 'Your Store Link'
  };

  return (
    <div 
      className="text-center space-y-4 sm:space-y-6 px-2 sm:px-0 pb-16 sm:pb-12" 
      onClick={handleUserInteraction}
      onKeyDown={handleUserInteraction}
      tabIndex={0}
    >
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      
      <div className="space-y-2 sm:space-y-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-green-600" />
        </div>
        
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          {success.title}
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium">
          {success.subtitle}
        </p>
      </div>

      <Card className="max-w-xs sm:max-w-sm md:max-w-md mx-auto bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg">{success.linkLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-2 sm:space-y-3">
          <div className="bg-white rounded-lg p-2 sm:p-3 font-mono text-xs break-all">
            {uniqueLink}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={copyLink} className="flex-1 min-h-[40px] sm:min-h-[44px]" size="sm" disabled={!state.storeHandle}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
            <Button onClick={openLink} variant="outline" className="flex-1 min-h-[40px] sm:min-h-[44px]" size="sm" disabled={!state.storeHandle}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <Button onClick={handleGoToDashboard} size="lg" className="bg-green-600 hover:bg-green-700 min-h-[48px] w-full sm:w-auto sm:min-w-64">
          Create Your First Invoice
        </Button>
      </div>
    </div>
  );
};

export default SuccessStep;
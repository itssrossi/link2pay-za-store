import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import WalkthroughOverlay from './WalkthroughOverlay';
import WalkthroughSpotlight from './WalkthroughSpotlight';
import WalkthroughProgress from './WalkthroughProgress';
import WalkthroughTooltip from './WalkthroughTooltip';
import Confetti from './Confetti';

const WALKTHROUGH_STEPS = [
  {
    id: 'upload-logo',
    title: 'Upload Your Store Logo',
    description: 'Start by uploading your store logo to personalize your brand!',
    targetSelector: '[data-walkthrough="logo-upload"]',
    route: '/settings',
    tab: 'business',
    validation: () => checkLogoUpload()
  },
  {
    id: 'whatsapp-location',
    title: 'Add WhatsApp & Location',
    description: 'Add your WhatsApp number and store location so clients can reach you.',
    targetSelector: '[data-walkthrough="whatsapp-input"]',
    route: '/settings',
    tab: 'business',
    validation: () => checkWhatsAppAndLocation()
  },
  {
    id: 'add-product',
    title: 'Add Your First Product',
    description: "Now let's add your first product or service!",
    targetSelector: '[data-walkthrough="add-product"]',
    route: '/dashboard',
    validation: () => checkFirstProduct()
  },
  {
    id: 'setup-payments',
    title: 'Setup Payment Method',
    description: 'Link your payment method so you can get paid.',
    targetSelector: '[data-walkthrough="payment-settings"]',
    route: '/settings',
    tab: 'payments',
    validation: () => checkPaymentSetup()
  },
  {
    id: 'store-complete',
    title: 'Store Setup Complete',
    description: '🎉 Congratulations, your store is live! Share your store link below.',
    targetSelector: '[data-walkthrough="store-link"]',
    route: '/dashboard',
    celebration: true
  },
  {
    id: 'create-invoice',
    title: 'Create Your First Invoice',
    description: "Let's try sending your first invoice.",
    targetSelector: '[data-walkthrough="new-invoice"]',
    route: '/dashboard',
    validation: () => checkFirstInvoice()
  },
  {
    id: 'enable-bookings',
    title: 'Enable Bookings',
    description: 'Turn on bookings so clients can schedule with you 24/7.',
    targetSelector: '[data-walkthrough="booking-toggle"]',
    route: '/settings',
    tab: 'booking',
    validation: () => checkBookingsEnabled()
  },
  {
    id: 'completion',
    title: 'All Set!',
    description: '✅ You\'re all set! Your Link2Pay store is fully ready. Let\'s grow your business!',
    targetSelector: '[data-walkthrough="dashboard-title"]',
    route: '/dashboard',
    celebration: true,
    final: true
  }
];

// Validation functions
const checkLogoUpload = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('logo_url')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.logo_url);
};

const checkWhatsAppAndLocation = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('whatsapp_number, store_location')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.whatsapp_number && data?.store_location);
};

const checkFirstProduct = async () => {
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', (window as any).currentUserId);
  
  return (count || 0) > 0;
};

const checkPaymentSetup = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('payfast_merchant_id, payfast_merchant_key, snapscan_link, eft_details')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.payfast_merchant_id || data?.snapscan_link || data?.eft_details);
};

const checkFirstInvoice = async () => {
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', (window as any).currentUserId);
  
  return (count || 0) > 0;
};

const checkBookingsEnabled = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('booking_payments_enabled')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.booking_payments_enabled);
};

const InteractiveWalkthrough: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    walkthroughActive, 
    currentWalkthroughStep, 
    setCurrentWalkthroughStep,
    completeWalkthrough,
    skipWalkthrough 
  } = useOnboarding();

  const [showConfetti, setShowConfetti] = useState(false);
  const [stepCompleted, setStepCompleted] = useState(false);

  const currentStep = WALKTHROUGH_STEPS[currentWalkthroughStep];

  // Set current user ID for validation functions
  useEffect(() => {
    if (user?.id) {
      (window as any).currentUserId = user.id;
    }
  }, [user?.id]);

  // Check step completion periodically
  useEffect(() => {
    if (!currentStep || !currentStep.validation || stepCompleted) return;

    const checkCompletion = async () => {
      const completed = await currentStep.validation();
      if (completed && !stepCompleted) {
        setStepCompleted(true);
        setShowConfetti(true);
        
        // Show success message
        const messages = [
          'Nice work! 🎉',
          'Great job! 🚀',
          'Awesome! 💪',
          'Perfect! ✨',
          'Excellent! 🌟'
        ];
        
        toast.success(messages[Math.floor(Math.random() * messages.length)]);
        
        // Auto-advance after celebration
        setTimeout(() => {
          handleNext();
        }, 2000);
      }
    };

    const interval = setInterval(checkCompletion, 1000);
    return () => clearInterval(interval);
  }, [currentStep, stepCompleted]);

  // Navigate to correct route when step changes
  useEffect(() => {
    if (!currentStep) return;

    const targetRoute = currentStep.route;
    const currentRoute = location.pathname;
    
    if (currentRoute !== targetRoute) {
      navigate(targetRoute);
    }

    // Reset step completion when step changes
    setStepCompleted(false);
  }, [currentWalkthroughStep, currentStep, navigate, location.pathname]);

  const handleNext = () => {
    if (currentWalkthroughStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentWalkthroughStep(currentWalkthroughStep + 1);
    } else {
      completeWalkthrough();
    }
  };

  const handleSkip = () => {
    skipWalkthrough();
  };

  if (!walkthroughActive || !currentStep) {
    return null;
  }

  const isStepValidated = currentStep.validation && stepCompleted;
  const showNextButton = !currentStep.validation || isStepValidated || currentStep.celebration;

  return (
    <>
      <WalkthroughOverlay onSkip={handleSkip}>
        <WalkthroughProgress 
          currentStep={currentWalkthroughStep}
          totalSteps={WALKTHROUGH_STEPS.length}
          stepTitles={WALKTHROUGH_STEPS.map(step => step.title)}
        />
        
        <WalkthroughSpotlight 
          targetSelector={currentStep.targetSelector}
        />
        
        <WalkthroughTooltip
          targetSelector={currentStep.targetSelector}
          title={currentStep.title}
          description={currentStep.description}
          showNext={showNextButton}
          onNext={currentStep.final ? completeWalkthrough : handleNext}
          nextText={currentStep.final ? 'Complete Walkthrough' : 'Next'}
          completed={isStepValidated}
        />
      </WalkthroughOverlay>
      
      <Confetti 
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
    </>
  );
};

export default InteractiveWalkthrough;
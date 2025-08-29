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
import WelcomeModal from './WelcomeModal';
import Confetti from './Confetti';

const WALKTHROUGH_STEPS = [
  {
    id: 'upload-logo',
    title: 'Upload Your Store Logo',
    description: 'Start by uploading your store logo to personalize your brand! Click the "Upload Image" button below.',
    targetSelector: '[data-walkthrough="logo-upload"]',
    route: '/settings',
    tab: 'business',
    validation: () => checkLogoUpload()
  },
  {
    id: 'whatsapp-number',
    title: 'Add Your WhatsApp Number',
    description: 'Add your WhatsApp number so customers can easily contact you.',
    targetSelector: '[data-walkthrough="whatsapp-input"]',
    route: '/settings',
    tab: 'business',
    validation: () => checkWhatsAppNumber()
  },
  {
    id: 'store-location',
    title: 'Set Your Store Location',
    description: 'Add your store address for local pickup and delivery options.',
    targetSelector: '[data-walkthrough="store-location"]',
    route: '/settings',
    tab: 'business',
    validation: () => checkStoreLocation()
  },
  {
    id: 'add-product',
    title: 'Add Your First Product',
    description: "Now let's add your first product or service! Click the 'Add Product' button to get started.",
    targetSelector: '[data-walkthrough="add-product"]',
    route: '/dashboard',
    validation: () => checkFirstProduct()
  },
  {
    id: 'setup-payments',
    title: 'Setup Payment Method',
    description: 'Link at least one payment method so customers can pay you. Enable any of the payment options below.',
    targetSelector: '[data-walkthrough="payment-settings"]',
    route: '/settings',
    tab: 'payment',
    validation: () => checkPaymentSetup()
  },
  {
    id: 'store-complete',
    title: 'Store Setup Complete! 🎉',
    description: 'Congratulations! Your store is now live. Here\'s your store link - share it with customers!',
    targetSelector: '[data-walkthrough="store-link"]',
    route: '/dashboard',
    celebration: true
  },
  {
    id: 'create-invoice',
    title: 'Create Your First Invoice',
    description: "Let's try creating your first invoice. Click 'New Invoice' to get started.",
    targetSelector: '[data-walkthrough="new-invoice"]',
    route: '/dashboard',
    validation: () => checkFirstInvoice()
  },
  {
    id: 'enable-bookings',
    title: 'Enable Bookings (Optional)',
    description: 'Turn on bookings so clients can schedule appointments with you 24/7. Toggle the switch below.',
    targetSelector: '[data-walkthrough="booking-toggle"]',
    route: '/settings',
    tab: 'booking',
    validation: () => checkBookingsEnabled()
  },
  {
    id: 'completion',
    title: 'Welcome to Link2Pay! 🚀',
    description: '✅ You\'re all set! Your Link2Pay store is fully ready. Start growing your business!',
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

const checkWhatsAppNumber = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('whatsapp_number')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.whatsapp_number?.trim());
};

const checkStoreLocation = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('store_address')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.store_address?.trim());
};

const checkWhatsAppAndLocation = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('whatsapp_number, store_address')
    .eq('id', (window as any).currentUserId)
    .single();
  
  return !!(data?.whatsapp_number && data?.store_address);
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
    .select('payfast_merchant_id, payfast_merchant_key, snapscan_link, eft_details, capitec_paylink, show_payfast_auto, show_capitec')
    .eq('id', (window as any).currentUserId)
    .single();
  
  // Check if any payment method is properly configured
  const hasPayFast = data?.show_payfast_auto && data?.payfast_merchant_id && data?.payfast_merchant_key;
  const hasSnapScan = data?.snapscan_link?.trim();
  const hasEFT = data?.eft_details?.trim();
  const hasCapitec = data?.show_capitec && data?.capitec_paylink?.trim();
  
  return !!(hasPayFast || hasSnapScan || hasEFT || hasCapitec);
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
  const isWelcomeStep = currentWalkthroughStep === -1;

  // Set current user ID for validation functions
  useEffect(() => {
    if (user?.id) {
      (window as any).currentUserId = user.id;
    }
  }, [user?.id]);

  // Check step completion periodically
  useEffect(() => {
    if (!currentStep || !currentStep.validation || stepCompleted || isWelcomeStep) return;

    const checkCompletion = async () => {
      try {
        const completed = await currentStep.validation();
        console.log(`📋 Step "${currentStep.id}" validation result:`, completed);
        
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
      } catch (error) {
        console.error('Error checking step completion:', error);
      }
    };

    const interval = setInterval(checkCompletion, 2000);
    return () => clearInterval(interval);
  }, [currentStep, stepCompleted, isWelcomeStep]);

  // Navigate to correct route when step changes
  useEffect(() => {
    if (!currentStep || isWelcomeStep) return;

    const targetRoute = currentStep.route;
    const targetTab = currentStep.tab;
    const currentRoute = location.pathname;
    
    // Build full URL with hash if tab is specified
    const fullTargetUrl = targetTab ? `${targetRoute}#${targetTab}` : targetRoute;
    const currentFullUrl = targetTab ? `${currentRoute}${location.hash}` : currentRoute;
    
    console.log('Walkthrough navigation check:', {
      currentStep: currentStep.id,
      targetRoute,
      targetTab,
      currentRoute,
      fullTargetUrl,
      currentFullUrl,
      hash: location.hash
    });
    
    if (currentFullUrl !== fullTargetUrl) {
      console.log('🚀 Navigating to:', fullTargetUrl);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (targetTab) {
          navigate(`${targetRoute}#${targetTab}`);
        } else {
          navigate(targetRoute);
        }
      }, 100);
    }

    // Reset step completion when step changes
    setStepCompleted(false);
  }, [currentWalkthroughStep, currentStep, navigate, location.pathname, location.hash, isWelcomeStep]);

  const handleNext = () => {
    if (isWelcomeStep) {
      setCurrentWalkthroughStep(0); // Start actual walkthrough steps
    } else if (currentWalkthroughStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentWalkthroughStep(currentWalkthroughStep + 1);
    } else {
      completeWalkthrough();
    }
  };

  const handleSkip = () => {
    skipWalkthrough();
  };

  if (!walkthroughActive) {
    return null;
  }

  // Show welcome modal for Step -1
  if (isWelcomeStep) {
    return (
      <>
        <WalkthroughOverlay onSkip={handleSkip}>
          <WelcomeModal onStartSetup={handleNext} />
        </WalkthroughOverlay>
      </>
    );
  }

  if (!currentStep) {
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
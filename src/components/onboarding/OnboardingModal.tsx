import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/integrations/supabase/client';
import { triggerConfetti } from '@/components/ui/confetti';
import OnboardingWelcome from './OnboardingWelcome';
import OnboardingDashboard from './OnboardingDashboard';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { completeOnboarding } = useOnboarding();
  const [showWelcome, setShowWelcome] = useState(true);
  const [onboardingSteps, setOnboardingSteps] = useState([
    {
      id: 'customize_store',
      title: 'Set up your store',
      description: 'Complete your business profile with WhatsApp number',
      completed: false,
      route: '/settings#business',
      icon: 'palette'
    },
    {
      id: 'add_product',
      title: 'Add your first product',
      description: 'Create your first product listing to start selling',
      completed: false,
      route: '/products/add',
      icon: 'package'
    },
    {
      id: 'setup_bookings',
      title: 'Setup bookings',
      description: 'Configure appointment booking for services',
      completed: false,
      route: '/settings#booking',
      icon: 'calendar'
    },
    {
      id: 'setup_payments',
      title: 'Setup payments',
      description: 'Configure payment methods to accept payments',
      completed: false,
      route: '/settings#payment',
      icon: 'credit_card'
    },
    {
      id: 'send_invoice',
      title: 'Send your first invoice',
      description: 'Create and send your first invoice to a customer',
      completed: false,
      route: '/invoice-builder',
      icon: 'file_text'
    }
  ]);

  useEffect(() => {
    if (isOpen && user) {
      checkOnboardingProgress();
    }
  }, [isOpen, user]);

  const checkOnboardingProgress = async () => {
    if (!user) return;

    try {
      // Check products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check profile completeness
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, logo_url, store_handle, eft_details, payfast_link, snapscan_link, whatsapp_number')
        .eq('id', user.id)
        .maybeSingle();

      // Check invoices
      const { count: invoicesCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check availability settings for bookings
      const { count: bookingsCount } = await supabase
        .from('availability_settings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Check payment settings
      const hasPayments = profile?.eft_details || profile?.payfast_link || profile?.snapscan_link;

      // Update steps based on actual progress
      setOnboardingSteps(prev => prev.map(step => {
        switch (step.id) {
          case 'add_product':
            return { ...step, completed: (productsCount || 0) > 0 };
          case 'customize_store':
            return { 
              ...step, 
              completed: !!(profile?.business_name && profile?.whatsapp_number && profile?.store_handle)
            };
          case 'setup_bookings':
            return { ...step, completed: (bookingsCount || 0) > 0 };
          case 'setup_payments':
            return { ...step, completed: !!hasPayments };
          case 'send_invoice':
            return { ...step, completed: (invoicesCount || 0) > 0 };
          default:
            return step;
        }
      }));
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  const handleWelcomeComplete = async (selections: { sellType: string; businessType: string }) => {
    // Complete the welcome flow - selections can be used for future personalization
    setShowWelcome(false);
  };

  const handleStepClick = async (route: string, stepId: string) => {
    // Trigger confetti for step completion
    triggerConfetti();
    
    // Create default sections when setting up store
    if (stepId === 'customize_store' && user) {
      try {
        await supabase.functions.invoke('create-default-sections', {
          body: { user_id: user.id }
        });
      } catch (error) {
        console.error('Error creating default sections:', error);
      }
    }
    
    // Complete onboarding when any step is clicked
    await completeOnboarding();
    onClose();
    navigate(route);
  };

  if (!isOpen) return null;

  return (
    <>
      {showWelcome ? (
        <OnboardingWelcome onComplete={handleWelcomeComplete} />
      ) : (
        <OnboardingDashboard 
          onClose={onClose}
          steps={onboardingSteps}
          onStepClick={handleStepClick}
        />
      )}
    </>
  );
};

export default OnboardingModal;
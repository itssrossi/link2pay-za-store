
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import OnboardingStep from './OnboardingStep';
import SubscriptionSetup from './SubscriptionSetup';
import { 
  Package, 
  FileText, 
  Store, 
  Heart,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const OnboardingModal: React.FC = () => {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { user, signOut } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const steps = [
    {
      title: "Welcome to Link2Pay",
      subtitle: "The fastest way to grow your business",
      description: "Send invoices, accept payments, and run your store — all from WhatsApp.",
      icon: <Heart className="w-12 sm:w-16 h-12 sm:h-16 text-[#4C9F70]" />
    },
    {
      title: "Step 1: Add Your Products",
      description: "Click 'Products' in the dashboard to add your first item or service. Upload a photo, add a price, and save. You'll use this when sending invoices.",
      icon: <Package className="w-12 sm:w-16 h-12 sm:h-16 text-[#4C9F70]" />
    },
    {
      title: "Step 2: Send Your First Invoice",
      description: "Use the 'Invoices' tab or our Quick Command format: l2p:Name:Amount:ProductID:PhoneNumber. Share via WhatsApp instantly. Add SnapScan or PayFast links in Settings to accept payments.",
      icon: <FileText className="w-12 sm:w-16 h-12 sm:h-16 text-[#4C9F70]" />
    },
    {
      title: "Step 3: Share Your Store",
      description: "Your store link is ready! Go to 'Store' to copy your custom link and share with customers. You can customize your handle in Settings and show all your products beautifully.",
      icon: <Store className="w-12 sm:w-16 h-12 sm:h-16 text-[#4C9F70]" />,
      children: (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">
            🔗 Example: link2pay.com/yourname
          </p>
        </div>
      )
    },
    {
      title: "Step 4: Setup Your Billing",
      description: "To start your 7-day free trial, we need your billing information. You'll only be charged after your trial ends. You can cancel anytime during the trial period.",
      icon: <CreditCard className="w-12 sm:w-16 h-12 sm:h-16 text-[#4C9F70]" />,
      isBillingStep: true
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep === steps.length - 1) {
      // This is the billing step - can't skip, must cancel and delete account
      await handleCancelBilling();
    } else {
      // Regular skip for earlier steps
      await completeOnboarding();
      toast.success("Welcome to Link2Pay! You can always access help from the settings.");
    }
  };

  const handleCancelBilling = async () => {
    if (!user?.id) return;

    setIsDeleting(true);
    
    try {
      // Delete the user account completely
      const { error } = await supabase.rpc('delete_user_completely', {
        p_uid: user.id
      });

      if (error) {
        console.error('Account deletion failed:', error);
        toast.error('Failed to cancel. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Sign out the user
      await signOut();
      
      toast.success('Account cancelled successfully.');
      
      // Redirect to auth page
      window.location.href = '/auth';
      
    } catch (err) {
      console.error('Unexpected error during cancellation:', err);
      toast.error('Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding();
    toast.success("You're all set! Let's create your first product.", {
      action: {
        label: "Add Product",
        onClick: () => window.location.href = "/products/add"
      }
    });
  };

  const handleBillingComplete = () => {
    handleComplete();
  };

  const progressValue = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <Dialog open={showOnboarding} onOpenChange={() => {}}>
      <DialogContent className="max-w-xs sm:max-w-2xl p-0 overflow-hidden mx-4 sm:mx-auto">
        <div className="relative">
          {/* Header with progress and skip button */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#4C9F70] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">L2P</span>
                </div>
                <span className="font-bold text-sm sm:text-lg text-gray-900">Link2Pay</span>
              </div>
              <div className="flex-1 max-w-xs">
                <Progress value={progressValue} className="h-1 sm:h-2" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isDeleting}
              className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm p-1 sm:p-2"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {currentStep === steps.length - 1 ? 'Cancel' : 'Skip'}
            </Button>
          </div>

          {/* Step content */}
          <div className="bg-gradient-to-br from-green-50 to-white min-h-[350px] sm:min-h-[500px]">
            {currentStepData.isBillingStep ? (
              <div className="flex items-center justify-center min-h-[350px] sm:min-h-[500px] p-4">
                <SubscriptionSetup
                  trialEndsAt={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                  onComplete={handleBillingComplete}
                />
              </div>
            ) : (
              <OnboardingStep
                title={currentStepData.title}
                subtitle={currentStepData.subtitle}
                description={currentStepData.description}
                icon={currentStepData.icon}
              >
                {currentStepData.children}
              </OnboardingStep>
            )}
          </div>

          {/* Footer with navigation buttons */}
          <div className="flex items-center justify-between p-3 sm:p-6 border-t bg-white">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0 || isDeleting}
              className="flex items-center text-xs sm:text-sm"
              size="sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Back
            </Button>

            {!currentStepData.isBillingStep && (
              <Button
                onClick={handleNext}
                disabled={isDeleting}
                className="bg-[#4C9F70] hover:bg-[#3d8159] flex items-center text-xs sm:text-sm"
                size="sm"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Setup Billing
                    <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

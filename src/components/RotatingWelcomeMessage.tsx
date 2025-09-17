import { useState, useEffect } from 'react';

interface OnboardingStep {
  name: string;
  completed: boolean;
}

interface RotatingWelcomeMessageProps {
  fullName?: string;
  businessName?: string;
  onboardingCompleted?: boolean;
  onboardingSteps?: OnboardingStep[];
}

export const RotatingWelcomeMessage = ({
  fullName,
  businessName,
  onboardingCompleted = false,
  onboardingSteps = []
}: RotatingWelcomeMessageProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Generate messages based on onboarding status
  const getMessages = () => {
    const incompleteSteps = onboardingSteps.filter(step => !step.completed);
    const hasProducts = onboardingSteps.find(step => step.name === 'Add Products')?.completed;
    const hasPayments = onboardingSteps.find(step => step.name === 'Set Up Payments')?.completed;
    const hasCustomization = onboardingSteps.find(step => step.name === 'Customize Store')?.completed;

    if (!onboardingCompleted && incompleteSteps.length > 0) {
      const messages = [
        "Complete your store setup to start selling!",
        fullName ? `Hi ${fullName}! Let's finish setting up your store` : "Let's finish setting up your store",
        "Don't forget to complete your onboarding in the setup progress box",
      ];

      // Add specific encouragement based on missing steps
      if (!hasProducts) {
        messages.push(
          fullName ? `Hi ${fullName}! Let's add your first product` : "Add your first product to get started",
          businessName ? `Time to add products to ${businessName}!` : "Time to add some products!"
        );
      }

      if (!hasPayments) {
        messages.push("Set up payments to start accepting orders");
      }

      if (!hasCustomization) {
        messages.push(
          businessName ? `Make ${businessName} shine with custom branding!` : "Customize your store to make it shine!",
          "Time to personalize your store design"
        );
      }

      messages.push(
        "Send your first invoice and grow your business",
        businessName ? `${businessName} is almost ready for customers!` : "Your store is almost ready!"
      );

      return messages;
    }

    // Messages for completed onboarding
    return [
      "Welcome back! Here's your business overview",
      fullName ? `Hi ${fullName}! Great to see you again` : "Great to see you again!",
      businessName ? `Welcome back to ${businessName}'s dashboard` : "Welcome back to your dashboard",
      "Hello! Check out your latest business stats",
      "Ready to grow your business today?"
    ];
  };

  const messages = getMessages();

  useEffect(() => {
    if (isHovered || messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4500); // Rotate every 4.5 seconds

    return () => clearInterval(interval);
  }, [isHovered, messages.length]);

  const currentMessage = messages[currentMessageIndex] || messages[0];

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="text-muted-foreground mt-1 text-sm sm:text-base animate-fade-in">
        {currentMessage}
      </p>
      {messages.length > 1 && (
        <div className="flex gap-1 mt-2">
          {messages.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-1 rounded-full transition-all duration-300 ${
                index === currentMessageIndex 
                  ? 'bg-primary w-3' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
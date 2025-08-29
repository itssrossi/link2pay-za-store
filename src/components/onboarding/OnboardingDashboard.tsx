import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Sparkles } from 'lucide-react';
import OnboardingProgressCard from './OnboardingProgressCard';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
}

interface OnboardingDashboardProps {
  onClose: () => void;
  steps: OnboardingStep[];
  onStepClick: (route: string) => void;
}

const OnboardingDashboard: React.FC<OnboardingDashboardProps> = ({
  onClose,
  steps,
  onStepClick
}) => {
  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-2 sm:p-4 py-4 sm:py-8">
        <div className="w-full max-w-4xl max-h-[95vh] overflow-hidden">
          <Card className="border-0 shadow-2xl mx-2 sm:mx-0">
            <CardHeader className="relative pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="absolute right-2 sm:right-4 top-2 sm:top-4 w-8 h-8 sm:w-10 sm:h-10"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                  </div>
                </div>
                
                <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 leading-tight">
                  Get your store ready
                </CardTitle>
                
                <div className="max-w-md mx-auto mb-4 sm:mb-6">
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground mb-2">
                    <span>{completedCount} of {totalSteps} completed</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 sm:h-3" />
                </div>
                
                <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
                  {completedCount === 0 
                    ? "Let's get your store set up! Complete these steps to start selling."
                    : completedCount === totalSteps
                    ? "🎉 Congratulations! Your store is ready to start making sales."
                    : `You're making great progress! ${totalSteps - completedCount} steps left to complete your setup.`
                  }
                </p>
              </div>
            </CardHeader>

            <CardContent className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              <div className="grid gap-3 sm:gap-4 lg:gap-6 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
                {steps.map((step, index) => (
                  <OnboardingProgressCard
                    key={step.id}
                    step={step}
                    stepNumber={index + 1}
                    onClick={() => onStepClick(step.route)}
                  />
                ))}
              </div>

              {progress === 100 && (
                <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
                  <div className="p-4 sm:p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                      🚀 You're all set!
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                      Your store is now ready to start accepting orders and payments.
                    </p>
                    <Button onClick={onClose} size="lg" className="w-full sm:w-auto">
                      Start Selling
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OnboardingDashboard;
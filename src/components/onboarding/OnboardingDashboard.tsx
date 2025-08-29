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
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="relative pb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              
              <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
                Get your store ready
              </CardTitle>
              
              <div className="max-w-md mx-auto mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>{completedCount} of {totalSteps} completed</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {completedCount === 0 
                  ? "Let's get your store set up! Complete these steps to start selling."
                  : completedCount === totalSteps
                  ? "🎉 Congratulations! Your store is ready to start making sales."
                  : `You're making great progress! ${totalSteps - completedCount} steps left to complete your setup.`
                }
              </p>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="grid gap-4 sm:gap-6 max-h-[60vh] overflow-y-auto">
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
              <div className="mt-8 text-center">
                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    🚀 You're all set!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your store is now ready to start accepting orders and payments.
                  </p>
                  <Button onClick={onClose} size="lg">
                    Start Selling
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingDashboard;
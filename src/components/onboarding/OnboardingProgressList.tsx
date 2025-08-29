import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Package, Palette, Calendar, CreditCard, FileText, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
}

interface OnboardingProgressListProps {
  steps: OnboardingStep[];
  onHide?: () => void;
}

const OnboardingProgressList: React.FC<OnboardingProgressListProps> = ({ steps, onHide }) => {
  const navigate = useNavigate();
  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  const getIcon = (iconName: string, completed: boolean) => {
    const iconProps = { className: `w-3.5 h-3.5 sm:w-4 sm:h-4 ${completed ? 'text-primary' : 'text-muted-foreground'}` };
    
    switch (iconName) {
      case 'package':
        return <Package {...iconProps} />;
      case 'palette':
        return <Palette {...iconProps} />;
      case 'calendar':
        return <Calendar {...iconProps} />;
      case 'credit_card':
        return <CreditCard {...iconProps} />;
      case 'file_text':
        return <FileText {...iconProps} />;
      default:
        return <Circle {...iconProps} />;
    }
  };

  const handleStepClick = (route: string) => {
    navigate(route);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-2 sm:p-3 md:p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-xs sm:text-sm md:text-base">Setup Progress</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {completedCount}/{totalSteps}
            </span>
            {onHide && (
              <button
                onClick={onHide}
                className="p-1 hover:bg-muted/50 rounded-full transition-colors"
                aria-label="Hide checklist"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
        
        <Progress value={progress} className="h-1 sm:h-1.5 md:h-2 mb-2 sm:mb-3" />
        
        <div className="space-y-0.5 sm:space-y-1">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.route)}
              className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md hover:bg-muted/30 active:bg-muted/50 cursor-pointer transition-all duration-200 touch-manipulation"
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                ) : (
                  getIcon(step.icon, step.completed)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs sm:text-sm font-medium leading-tight ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {progress === 100 && (
          <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-primary/10 rounded-md text-center animate-fade-in">
            <p className="text-xs sm:text-sm text-primary font-medium">🎉 Setup Complete!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingProgressList;
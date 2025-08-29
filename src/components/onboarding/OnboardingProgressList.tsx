import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Package, Palette, Calendar, CreditCard, FileText } from 'lucide-react';
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
}

const OnboardingProgressList: React.FC<OnboardingProgressListProps> = ({ steps }) => {
  const navigate = useNavigate();
  const completedCount = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = (completedCount / totalSteps) * 100;

  const getIcon = (iconName: string, completed: boolean) => {
    const iconProps = { className: `w-4 h-4 ${completed ? 'text-primary' : 'text-muted-foreground'}` };
    
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Setup Progress</h3>
          <span className="text-xs text-muted-foreground">{completedCount}/{totalSteps}</span>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="space-y-2">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.route)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="w-4 h-4 text-primary" />
                ) : (
                  getIcon(step.icon, step.completed)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {progress === 100 && (
          <div className="mt-3 p-2 bg-primary/10 rounded-lg text-center">
            <p className="text-xs text-primary font-medium">🎉 Setup Complete!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingProgressList;
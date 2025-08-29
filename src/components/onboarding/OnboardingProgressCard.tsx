import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Circle, 
  Package, 
  Palette, 
  Calendar, 
  CreditCard, 
  FileText,
  ArrowRight 
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: string;
}

interface OnboardingProgressCardProps {
  step: OnboardingStep;
  stepNumber: number;
  onClick: () => void;
}

const iconMap = {
  package: Package,
  palette: Palette,
  calendar: Calendar,
  credit_card: CreditCard,
  file_text: FileText,
};

const OnboardingProgressCard: React.FC<OnboardingProgressCardProps> = ({
  step,
  stepNumber,
  onClick
}) => {
  const IconComponent = iconMap[step.icon as keyof typeof iconMap] || Package;

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        step.completed 
          ? 'border-primary/50 bg-gradient-to-r from-primary/5 to-transparent' 
          : 'border-border hover:border-primary/30'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${
              step.completed 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 mb-1 sm:mb-2">
              <h3 className="font-semibold text-base sm:text-lg text-foreground leading-tight">
                {step.title}
              </h3>
              {step.completed ? (
                <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="border-muted-foreground/30 text-xs shrink-0">
                  Step {stepNumber}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="flex-shrink-0 hidden sm:block">
            <Button 
              variant={step.completed ? "outline" : "default"}
              size="sm"
              className="flex items-center space-x-2"
            >
              <span>{step.completed ? 'Review' : 'Start'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingProgressCard;
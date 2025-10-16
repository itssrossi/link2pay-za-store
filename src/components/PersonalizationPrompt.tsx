import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PersonalizationPromptProps {
  icon: React.ReactNode;
  message: string;
  ctaText: string;
  ctaAction: () => void;
  onDismiss: () => void;
  variant?: 'info' | 'success' | 'accent';
}

export const PersonalizationPrompt = ({
  icon,
  message,
  ctaText,
  ctaAction,
  onDismiss,
  variant = 'info'
}: PersonalizationPromptProps) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
    accent: 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800'
  };

  const buttonVariants = {
    info: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    accent: 'bg-purple-600 hover:bg-purple-700 text-white'
  };

  return (
    <Card className={`${variantClasses[variant]} border-2 p-4 animate-in slide-in-from-top duration-500`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 text-2xl">
            {icon}
          </div>
          <p className="text-sm font-medium text-foreground">
            {message}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={ctaAction}
            className={buttonVariants[variant]}
          >
            {ctaText}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
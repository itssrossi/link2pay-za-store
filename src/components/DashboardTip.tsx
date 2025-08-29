import { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const DashboardTip = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the tip has been dismissed before
    const tipDismissed = localStorage.getItem('dashboard-tip-dismissed');
    if (!tipDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('dashboard-tip-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="bg-primary text-primary-foreground border-none shadow-lg max-w-xs">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Click the dashboard button to continue the checklist
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-auto p-1 text-primary-foreground hover:bg-primary-foreground/20 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTip;
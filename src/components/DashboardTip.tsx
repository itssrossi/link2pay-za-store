import { useState, useEffect } from 'react';
import { X, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardTip = () => {
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

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

  // Only show on desktop/tablet, not mobile
  if (!isVisible || isMobile) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 animate-fade-in">
      <Card className="bg-primary text-primary-foreground border-none shadow-lg mx-auto max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ArrowUp className="w-4 h-4" />
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
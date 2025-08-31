import { useState, useEffect } from 'react';
import { X, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const DashboardTip = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    
    // Use user-specific localStorage key
    const tipKey = `dashboard-tip-dismissed-${user.id}`;
    const tipDismissed = localStorage.getItem(tipKey);
    if (!tipDismissed) {
      setIsVisible(true);
    }
  }, [user?.id]);

  const handleDismiss = () => {
    if (!user?.id) return;
    
    setIsVisible(false);
    const tipKey = `dashboard-tip-dismissed-${user.id}`;
    localStorage.setItem(tipKey, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-fade-in">
      <Card className="bg-primary text-primary-foreground border-none shadow-lg mx-auto max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ArrowDown className="w-4 h-4" />
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
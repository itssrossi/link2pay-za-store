import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { triggerConfetti } from '@/components/ui/confetti';

interface CompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({ 
  isOpen, 
  onClose, 
  title = "Step Completed!",
  message = "Click the dashboard button to complete the rest of the steps"
}) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti first
      triggerConfetti();
      
      // Show popup after a short delay
      setTimeout(() => setShow(true), 500);
      
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);
      
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={handleClose} />
      
      {/* Popup */}
      <Card className={`relative z-10 bg-background border shadow-xl mx-4 max-w-md transition-all duration-300 ${
        show ? 'animate-scale-in opacity-100' : 'opacity-0 scale-95'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-auto p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const showCompletionPopup = () => {
  // This function can be called from anywhere to trigger the completion popup
  const event = new CustomEvent('showCompletionPopup');
  window.dispatchEvent(event);
};
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TipPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TipPopup: React.FC<TipPopupProps> = ({ isOpen, onClose }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen && !show) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
      <Card className={`max-w-md w-full mx-4 transform transition-all duration-300 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        <CardContent className="p-6 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="text-center space-y-4 mt-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl">💡</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Get Started with Your First Invoice
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Send your first invoice today and collect your first payment through Link2Pay before your trial ends
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const showTipPopup = () => {
  window.dispatchEvent(new Event('show-tip-popup'));
};
import React from 'react';
import { CheckCircle, Zap, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeModalProps {
  onStartSetup: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onStartSetup }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[10001]">
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-2xl p-8 max-w-md w-full shadow-lg animate-scale-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Welcome to Link2Pay! 🎉
          </h2>
          <p className="text-muted-foreground text-lg">
            Let's set up your store in just 5 simple steps
          </p>
        </div>

        {/* Setup Steps Preview */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">Upload your store logo</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">Add WhatsApp & store location</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">Create your first product</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />  
            <span className="text-foreground font-medium">Set up payment methods</span>
          </div>
          <div className="flex items-center space-x-3">
            <Zap className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-foreground font-medium">Your store goes live! 🚀</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="bg-primary/10 rounded-full p-1">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm mb-1">
                What you'll get:
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Professional online store</li>
                <li>• WhatsApp ordering system</li>
                <li>• Invoice & booking management</li>
                <li>• Payment processing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button 
          onClick={onStartSetup}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg py-3"
          size="lg"
        >
          Let's Get Started!
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-sm text-muted-foreground text-center mt-4">
          Takes about 3-5 minutes • You can skip anytime
        </p>
      </div>
    </div>
  );
};

export default WelcomeModal;
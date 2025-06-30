
import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useOnboardingFlow } from '@/contexts/OnboardingFlowContext';
import { Upload, Building2, Phone, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const OnboardingFlow: React.FC = () => {
  const {
    showOnboardingFlow,
    currentStep,
    onboardingData,
    setCurrentStep,
    updateOnboardingData,
    completeOnboardingFlow,
  } = useOnboardingFlow();

  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;
  const progressValue = (currentStep / totalSteps) * 100;

  const handleNext = async () => {
    if (currentStep === 1 && !onboardingData.businessName.trim()) {
      toast.error('Please enter your business name');
      return;
    }
    
    if (currentStep === 2 && !onboardingData.whatsappNumber.trim()) {
      toast.error('Please enter your WhatsApp number');
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsLoading(true);
      await completeOnboardingFlow();
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentMethodSelect = (method: 'snapscan' | 'payfast' | 'eft') => {
    updateOnboardingData({ paymentMethod: method, paymentDetails: '' });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <Building2 className="w-16 h-16 text-[#4C9F70] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What is your business name?</h2>
              <p className="text-gray-600">This will be used for your store and invoices</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-left block">Business Name</Label>
              <Input
                id="businessName"
                value={onboardingData.businessName}
                onChange={(e) => updateOnboardingData({ businessName: e.target.value })}
                placeholder="Enter your business name"
                className="text-center"
              />
            </div>
            {onboardingData.businessName && (
              <p className="text-sm text-gray-500">
                Your store will be: link2pay.com/{onboardingData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '')}
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <Phone className="w-16 h-16 text-[#4C9F70] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What WhatsApp number do you use with customers?</h2>
              <p className="text-gray-600">We'll use this for invoice automation</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber" className="text-left block">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                type="tel"
                value={onboardingData.whatsappNumber}
                onChange={(e) => updateOnboardingData({ whatsappNumber: e.target.value })}
                placeholder="27821234567"
                className="text-center"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <Upload className="w-16 h-16 text-[#4C9F70] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your logo</h2>
              <p className="text-gray-600">Optional - Add your logo to invoices and store</p>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
              </div>
              {onboardingData.logoUrl && (
                <div className="mt-4">
                  <img src={onboardingData.logoUrl} alt="Logo preview" className="w-20 h-20 object-contain mx-auto" />
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <CreditCard className="w-16 h-16 text-[#4C9F70] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to receive payments?</h2>
              <p className="text-gray-600">Choose your preferred payment method</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethodSelect('snapscan')}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  onboardingData.paymentMethod === 'snapscan'
                    ? 'border-[#4C9F70] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">SnapScan</div>
                <div className="text-sm text-gray-500">QR code payments</div>
              </button>
              
              <button
                onClick={() => handlePaymentMethodSelect('payfast')}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  onboardingData.paymentMethod === 'payfast'
                    ? 'border-[#4C9F70] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">PayFast</div>
                <div className="text-sm text-gray-500">Online card payments</div>
              </button>
              
              <button
                onClick={() => handlePaymentMethodSelect('eft')}
                className={`w-full p-4 rounded-lg border-2 transition-colors ${
                  onboardingData.paymentMethod === 'eft'
                    ? 'border-[#4C9F70] bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">EFT Bank Transfer</div>
                <div className="text-sm text-gray-500">Direct bank deposits</div>
              </button>
            </div>

            {onboardingData.paymentMethod && (
              <div className="mt-4 space-y-2">
                <Label className="text-left block">
                  {onboardingData.paymentMethod === 'snapscan' && 'SnapScan Link'}
                  {onboardingData.paymentMethod === 'payfast' && 'PayFast Link'}
                  {onboardingData.paymentMethod === 'eft' && 'Banking Details'}
                </Label>
                {onboardingData.paymentMethod === 'eft' ? (
                  <Textarea
                    value={onboardingData.paymentDetails}
                    onChange={(e) => updateOnboardingData({ paymentDetails: e.target.value })}
                    placeholder="Bank Name&#10;Account Holder&#10;Account Number&#10;Branch Code"
                    rows={4}
                  />
                ) : (
                  <Input
                    value={onboardingData.paymentDetails}
                    onChange={(e) => updateOnboardingData({ paymentDetails: e.target.value })}
                    placeholder={`Paste your ${onboardingData.paymentMethod} link here`}
                  />
                )}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-[#4C9F70] rounded-full flex items-center justify-center mx-auto mb-4">
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isLoading ? 'Setting up your store...' : 'Setup Complete!'}
              </h2>
              <p className="text-gray-600">
                {isLoading ? 'Please wait while we configure everything' : 'Your Link2Pay account is ready to use'}
              </p>
            </div>
            
            {!isLoading && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">What's next?</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ Create your first invoice</li>
                    <li>✓ Add products to your store</li>
                    <li>✓ Share your store link with customers</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={showOnboardingFlow} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-4 p-0 overflow-hidden">
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#4C9F70] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L2P</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Link2Pay</span>
            </div>
            <span className="text-sm text-gray-500">
              {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-2 bg-gray-50">
            <Progress value={progressValue} className="h-2" />
          </div>

          {/* Content */}
          <div className="p-6 min-h-[400px] bg-white">
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-white">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
              className="text-sm"
            >
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="bg-[#4C9F70] hover:bg-[#3d8159] text-sm"
            >
              {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;

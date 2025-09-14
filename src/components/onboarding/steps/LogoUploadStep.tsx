import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
import { Upload, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';

interface LogoUploadStepProps {
  onNext: () => void;
  state: OnboardingState;
  setState: React.Dispatch<React.SetStateAction<OnboardingState>>;
  isOptional: boolean;
}

const LogoUploadStep: React.FC<LogoUploadStepProps> = ({ onNext, state, setState, isOptional }) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(state.logoUrl || '');

  const handleLogoUpload = async (url: string) => {
    if (!user) return;

    setUploading(true);
    try {
      await supabase
        .from('profiles')
        .update({ logo_url: url })
        .eq('id', user.id);

      setLogoUrl(url);
      setState(prev => ({ ...prev, logoUrl: url }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    onNext();
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <div className="text-center space-y-6 sm:space-y-8 px-2 sm:px-0">
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Upload Your Logo
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Add your business logo to make your {state.choice === 'bookings' ? 'booking page' : 'store'} look professional.
        </p>
        {isOptional && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            This step is optional - you can skip it and add a logo later.
          </p>
        )}
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            Business Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ImageUpload
            value={logoUrl}
            onChange={handleLogoUpload}
            label="Upload Logo"
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
        {isOptional && (
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={uploading}
            size="lg"
            className="w-full sm:w-auto min-h-[44px]"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Skip for Now
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={uploading}
          size="lg"
          className="w-full sm:w-auto sm:min-w-32 min-h-[44px]"
        >
          {logoUrl ? 'Continue' : isOptional ? 'Continue' : 'Upload Logo'}
        </Button>
      </div>
    </div>
  );
};

export default LogoUploadStep;
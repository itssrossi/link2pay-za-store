import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from '@/components/ui/image-upload';
import { Upload, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { OnboardingState } from '../NewOnboardingContainer';
import { useOnboardingTracking } from '@/hooks/useOnboardingTracking';

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
  
  const { trackCompletion, trackSkip } = useOnboardingTracking({
    stepName: 'logo_upload',
    stepNumber: 1,
    onboardingType: state.choice || undefined
  });

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

  const handleNext = async () => {
    await trackCompletion({ has_logo: !!logoUrl });
    onNext();
  };

  const handleSkip = async () => {
    await trackSkip('User chose to skip logo upload');
    onNext();
  };

  return (
    <div className="text-center space-y-4 sm:space-y-6 px-1 sm:px-0">
      <div className="space-y-1.5 sm:space-y-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Upload Your Logo
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600">
          Add your business logo to make your {state.choice === 'bookings' ? 'booking page' : 'store'} look professional.
        </p>
        {isOptional && (
          <p className="text-xs text-gray-500 mt-1">
            This step is optional - you can skip it and add a logo later.
          </p>
        )}
      </div>

      <Card className="max-w-sm sm:max-w-md mx-auto">
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg md:text-xl">
            <Upload className="w-4 h-4" />
            Business Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <ImageUpload
            value={logoUrl}
            onChange={handleLogoUpload}
            label="Upload Logo"
            accept="image/*"
            maxSize={5 * 1024 * 1024} // 5MB
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center px-2 sm:px-0">
        {isOptional && (
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={uploading}
            size="sm"
            className="w-full sm:w-auto min-h-[40px] sm:min-h-[44px]"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Skip for Now
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={uploading}
          size="sm"
          className="w-full sm:w-auto sm:min-w-32 min-h-[40px] sm:min-h-[44px]"
        >
          {logoUrl ? 'Continue' : isOptional ? 'Continue' : 'Upload Logo'}
        </Button>
      </div>
    </div>
  );
};

export default LogoUploadStep;
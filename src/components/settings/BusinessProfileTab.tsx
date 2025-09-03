
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin, MessageCircle } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';
import { CompletionPopup } from '@/components/ui/completion-popup';


interface Profile {
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
  store_handle: string;
  store_address: string;
  snapscan_link: string;
  payfast_link: string;
  eft_details: string;
  store_layout: string;
  store_font: string;
  primary_color: string;
  accent_color: string;
  header_banner_url: string;
  hero_image_url: string;
  hero_headline: string;
  hero_subheading: string;
  hero_cta_text: string;
  hero_cta_link: string;
  background_color: string;
  theme_preset: string;
  store_visibility: boolean;
  default_currency: string;
  store_location: string;
  delivery_note: string;
  capitec_paylink: string;
  show_capitec: boolean;
  [key: string]: any;
}

interface BusinessProfileTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const BusinessProfileTab = ({ profile, setProfile, onSave, loading }: BusinessProfileTabProps) => {
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [wasStoreSetupComplete, setWasStoreSetupComplete] = useState(false);

  // Check if store setup is complete
  const isStoreSetupComplete = (profile: Profile) => {
    return !!(profile?.business_name && profile?.whatsapp_number && profile?.store_handle);
  };

  // Track completion status changes
  useEffect(() => {
    if (profile) {
      const currentlyComplete = isStoreSetupComplete(profile);
      setWasStoreSetupComplete(currentlyComplete);
    }
  }, []);

  const handleSave = async () => {
    const wasComplete = wasStoreSetupComplete;
    await onSave();
    
    // Check if this is the first time completing store setup
    const isNowComplete = isStoreSetupComplete(profile);
    if (!wasComplete && isNowComplete) {
      setShowCompletionPopup(true);
    }
    
    setWasStoreSetupComplete(isNowComplete);
  };
  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  const generateStoreHandle = async (businessName: string) => {
    if (!businessName.trim()) return;
    
    console.log('Generating store handle for:', businessName);

    try {
      const { data, error } = await supabase.functions.invoke('generate-unique-handle', {
        body: { businessName: businessName.trim() }
      });

      console.log('Store handle response:', { data, error });

      if (error) {
        console.error('Error generating handle:', error);
        toast.error('Failed to generate store handle');
      } else if (data?.uniqueHandle) {
        setProfile({ ...profile, store_handle: data.uniqueHandle });
        console.log('Store handle updated to:', data.uniqueHandle);
      }
    } catch (error) {
      console.error('Error calling generate-unique-handle:', error);
      toast.error('Failed to generate store handle');
    }
  };

  // Auto-generate handle when business name changes and no handle exists
  useEffect(() => {
    console.log('useEffect triggered:', { businessName: profile?.business_name, storeHandle: profile?.store_handle });
    if (profile?.business_name && !profile?.store_handle) {
      generateStoreHandle(profile.business_name);
    }
  }, [profile?.business_name]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={profile?.business_name || ''}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="Enter your business name"
              className="mt-1"
            />
          </div>

          <div>
            <ImageUpload
              value={profile?.logo_url || ''}
              onChange={(url) => handleChange('logo_url', url)}
              label="Business Logo"
              accept=".jpg,.jpeg,.png"
              maxSize={5}
              data-walkthrough="logo-upload"
            />
          </div>

          <div data-walkthrough="whatsapp-input">
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              value={profile?.whatsapp_number || ''}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="+27821234567"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="store_bio">Store Bio</Label>
            <Textarea
              id="store_bio"
              value={profile?.store_bio || ''}
              onChange={(e) => handleChange('store_bio', e.target.value)}
              placeholder="Tell customers about your business..."
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="store_handle">Store Handle</Label>
            <Input
              id="store_handle"
              value={profile?.store_handle || ''}
              onChange={(e) => handleChange('store_handle', e.target.value)}
              placeholder="your-store-name"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your store URL: link2pay.co.za/store/{profile?.store_handle || 'your-store-name'}
            </p>
          </div>

          <div>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={() => window.open('https://chat.whatsapp.com/KYXoVylp0K85kGxiqCSf5m?mode=ems_copy_t', '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MapPin className="w-5 h-5" />
            Store Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="store_address">Store Address</Label>
            <Textarea
              id="store_address"
              value={profile?.store_address || ''}
              onChange={(e) => handleChange('store_address', e.target.value)}
              placeholder="Enter your store address for local pickup/delivery..."
              rows={3}
              className="mt-1"
              data-walkthrough="store-location"
            />
            <p className="text-sm text-gray-500 mt-1">
              This address will appear on invoices when customers select "Local Pickup" or delivery options.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <DeleteAccountDialog />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <CompletionPopup
        isOpen={showCompletionPopup}
        onClose={() => setShowCompletionPopup(false)}
        title="Store Setup Complete!"
        message="Click the dashboard button to complete the rest of the steps"
      />
    </div>
  );
};

export default BusinessProfileTab;


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';


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
  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

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
            />
          </div>

          <div>
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
            />
            <p className="text-sm text-gray-500 mt-1">
              This address will appear on invoices when customers select "Local Pickup" or delivery options.
            </p>
          </div>
        </CardContent>
      </Card>


      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={onSave} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default BusinessProfileTab;

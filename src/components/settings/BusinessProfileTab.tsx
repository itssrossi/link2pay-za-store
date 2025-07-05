
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';

interface Profile {
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
  store_handle: string;
  store_address: string;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business Name</Label>
            <Input
              id="business_name"
              value={profile.business_name}
              onChange={(e) => handleChange('business_name', e.target.value)}
              placeholder="Enter your business name"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
            <Input
              id="whatsapp_number"
              value={profile.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              placeholder="+27821234567"
            />
          </div>

          <div>
            <Label htmlFor="store_bio">Store Bio</Label>
            <Textarea
              id="store_bio"
              value={profile.store_bio}
              onChange={(e) => handleChange('store_bio', e.target.value)}
              placeholder="Tell customers about your business..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="store_handle">Store Handle</Label>
            <Input
              id="store_handle"
              value={profile.store_handle}
              onChange={(e) => handleChange('store_handle', e.target.value)}
              placeholder="your-store-name"
            />
            <p className="text-sm text-gray-500 mt-1">
              This will be your store URL: link2pay.co.za/store/{profile.store_handle}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Store Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="store_address">Store Address</Label>
            <Textarea
              id="store_address"
              value={profile.store_address}
              onChange={(e) => handleChange('store_address', e.target.value)}
              placeholder="Enter your store address for local pickup/delivery..."
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              This address will appear on invoices when customers select "Local Pickup" or delivery options.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={onSave} 
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default BusinessProfileTab;

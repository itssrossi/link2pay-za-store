
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Eye } from 'lucide-react';
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

interface StorefrontCustomizationTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const StorefrontCustomizationTab = ({ profile, setProfile, onSave, loading }: StorefrontCustomizationTabProps) => {
  const handleChange = (field: string, value: string | boolean) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Hero Section
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <ImageUpload
              value={profile.hero_image_url}
              onChange={(url) => handleChange('hero_image_url', url)}
              label="Hero Background Image"
              accept=".jpg,.jpeg,.png"
              maxSize={5}
            />
          </div>

          <div>
            <Label htmlFor="hero_headline">Hero Headline</Label>
            <Input
              id="hero_headline"
              value={profile.hero_headline}
              onChange={(e) => handleChange('hero_headline', e.target.value)}
              placeholder="Welcome to our store"
            />
          </div>

          <div>
            <Label htmlFor="hero_subheading">Hero Subheading</Label>
            <Textarea
              id="hero_subheading"
              value={profile.hero_subheading}
              onChange={(e) => handleChange('hero_subheading', e.target.value)}
              placeholder="Discover amazing products..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hero_cta_text">Call-to-Action Text</Label>
              <Input
                id="hero_cta_text"
                value={profile.hero_cta_text}
                onChange={(e) => handleChange('hero_cta_text', e.target.value)}
                placeholder="Shop Now"
              />
            </div>

            <div>
              <Label htmlFor="hero_cta_link">Call-to-Action Link</Label>
              <Input
                id="hero_cta_link"
                value={profile.hero_cta_link}
                onChange={(e) => handleChange('hero_cta_link', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Store Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="store_visibility" className="text-base">Store Visibility</Label>
              <p className="text-sm text-gray-500">
                Make your store visible to the public
              </p>
            </div>
            <Switch
              id="store_visibility"
              checked={profile.store_visibility}
              onCheckedChange={(checked) => handleChange('store_visibility', checked)}
            />
          </div>

          <div>
            <Label htmlFor="default_currency">Default Currency</Label>
            <Select value={profile.default_currency} onValueChange={(value) => handleChange('default_currency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                <SelectItem value="USD">USD (US Dollar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="GBP">GBP (British Pound)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="delivery_note">Delivery Instructions</Label>
            <Textarea
              id="delivery_note"
              value={profile.delivery_note}
              onChange={(e) => handleChange('delivery_note', e.target.value)}
              placeholder="Special delivery instructions for your customers..."
              rows={3}
            />
            <p className="text-sm text-gray-500 mt-1">
              These instructions will appear on invoices and be visible to customers.
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

export default StorefrontCustomizationTab;

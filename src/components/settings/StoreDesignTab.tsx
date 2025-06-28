
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
  store_handle: string;
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
}

interface StoreDesignTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const StoreDesignTab = ({ profile, setProfile, onSave, loading }: StoreDesignTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Store Design</CardTitle>
        <CardDescription>
          Customize the look and feel of your public store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="store_layout">Store Layout</Label>
            <Select value={profile.store_layout} onValueChange={(value) => setProfile({ ...profile, store_layout: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="carousel">Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="store_font">Font Style</Label>
            <Select value={profile.store_font} onValueChange={(value) => setProfile({ ...profile, store_font: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Choose font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={profile.primary_color}
                onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={profile.primary_color}
                onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                placeholder="#4C9F70"
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                value={profile.accent_color}
                onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={profile.accent_color}
                onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                placeholder="#3d8159"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="header_banner_url">Header Banner URL (Optional)</Label>
          <Input
            id="header_banner_url"
            value={profile.header_banner_url}
            onChange={(e) => setProfile({ ...profile, header_banner_url: e.target.value })}
            placeholder="https://example.com/banner.jpg"
          />
          <p className="text-xs text-gray-500 mt-1">
            Recommended size: 1200x300px
          </p>
        </div>

        <Button 
          onClick={onSave}
          disabled={loading}
          className="bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Saving...' : 'Save Design Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default StoreDesignTab;

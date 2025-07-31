
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';
import SectionManager from './SectionManager';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface StoreDesignTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const StoreDesignTab = ({ profile, setProfile, onSave, loading }: StoreDesignTabProps) => {
  const { user } = useAuth();
  const [sections, setSections] = useState<any[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  const fetchSections = async () => {
    if (!user) return;
    
    try {
      setSectionsLoading(true);
      const { data, error } = await supabase
        .from('store_sections')
        .select('*')
        .eq('user_id', user.id)
        .order('section_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Store Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={profile.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={profile.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  placeholder="#4C9F70"
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
                  onChange={(e) => handleChange('accent_color', e.target.value)}
                  className="w-16 h-10 p-1 rounded"
                />
                <Input
                  value={profile.accent_color}
                  onChange={(e) => handleChange('accent_color', e.target.value)}
                  placeholder="#3d8159"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="background_color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="background_color"
                type="color"
                value={profile.background_color}
                onChange={(e) => handleChange('background_color', e.target.value)}
                className="w-16 h-10 p-1 rounded"
              />
              <Input
                value={profile.background_color}
                onChange={(e) => handleChange('background_color', e.target.value)}
                placeholder="#ffffff"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="store_layout">Store Layout</Label>
            <Select value={profile.store_layout} onValueChange={(value) => handleChange('store_layout', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="list">List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="store_font">Font Family</Label>
            <Select value={profile.store_font} onValueChange={(value) => handleChange('store_font', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">Inter</SelectItem>
                <SelectItem value="roboto">Roboto</SelectItem>
                <SelectItem value="poppins">Poppins</SelectItem>
                <SelectItem value="montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <ImageUpload
              value={profile.header_banner_url}
              onChange={(url) => handleChange('header_banner_url', url)}
              label="Header Banner"
              accept=".jpg,.jpeg,.png"
              maxSize={5}
            />
          </div>
        </CardContent>
      </Card>

      <SectionManager
        sections={sections}
        setSections={setSections}
        loading={sectionsLoading}
        onUpdate={fetchSections}
      />

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

export default StoreDesignTab;

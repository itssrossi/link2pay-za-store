
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Monitor, Save, RotateCcw, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import StorefrontPreview from './StorefrontPreview';
import SectionManager from './SectionManager';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExtendedProfile {
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

interface StorefrontCustomizationTabProps {
  profile: ExtendedProfile;
  setProfile: (profile: ExtendedProfile) => void;
  onSave: () => void;
  loading: boolean;
}

const themePresets = [
  { id: 'clean', name: 'Clean & Minimal', colors: { primary: '#4C9F70', accent: '#3d8159', bg: '#ffffff' } },
  { id: 'dark', name: 'Dark Mode', colors: { primary: '#60A5FA', accent: '#3B82F6', bg: '#1F2937' } },
  { id: 'bold', name: 'Bold Commerce', colors: { primary: '#DC2626', accent: '#B91C1C', bg: '#FEF2F2' } },
  { id: 'elegant', name: 'Elegant Boutique', colors: { primary: '#7C3AED', accent: '#6D28D9', bg: '#FAF5FF' } }
];

const fontOptions = [
  { value: 'inter', label: 'Inter' },
  { value: 'poppins', label: 'Poppins' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'playfair', label: 'Playfair Display' },
  { value: 'montserrat', label: 'Montserrat' }
];

const StorefrontCustomizationTab = ({ profile, setProfile, onSave, loading }: StorefrontCustomizationTabProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [sections, setSections] = useState<any[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [activeTab, setActiveTab] = useState('theme');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('store_sections')
        .select('*')
        .eq('user_id', user.id)
        .order('section_order');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoadingSections(false);
    }
  };

  const applyThemePreset = (preset: typeof themePresets[0]) => {
    setProfile({
      ...profile,
      theme_preset: preset.id,
      primary_color: preset.colors.primary,
      accent_color: preset.colors.accent,
      background_color: preset.colors.bg
    });
  };

  const resetToDefault = () => {
    const defaultTheme = themePresets[0];
    setProfile({
      ...profile,
      theme_preset: defaultTheme.id,
      primary_color: defaultTheme.colors.primary,
      accent_color: defaultTheme.colors.accent,
      background_color: defaultTheme.colors.bg,
      store_font: 'inter',
      store_layout: 'grid',
      hero_headline: '',
      hero_subheading: '',
      hero_cta_text: '',
      hero_cta_link: '',
      hero_image_url: ''
    });
    toast.success('Theme reset to default');
  };

  const handleSave = async () => {
    await onSave();
    
    // Update customization timestamp
    if (user) {
      await supabase
        .from('profiles')
        .update({ 
          last_customized_at: new Date().toISOString(),
          customization_version: (profile as any).customization_version ? (profile as any).customization_version + 1 : 2
        })
        .eq('id', user.id);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'theme':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Theme & Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">Theme Preset</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  {themePresets.map((preset) => (
                    <Button
                      key={preset.id}
                      variant={profile.theme_preset === preset.id ? "default" : "outline"}
                      onClick={() => applyThemePreset(preset)}
                      className="h-auto p-3 flex flex-col items-start text-xs sm:text-sm w-full"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <div className="flex gap-1 mt-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: preset.colors.primary }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <div 
                          className="w-3 h-3 rounded-full border" 
                          style={{ backgroundColor: preset.colors.bg }}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="primary_color" className="text-sm">Primary Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="primary_color"
                      type="color"
                      value={profile.primary_color}
                      onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                      className="w-12 h-8"
                    />
                    <Input
                      value={profile.primary_color}
                      onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="accent_color" className="text-sm">Accent Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="accent_color"
                      type="color"
                      value={profile.accent_color}
                      onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                      className="w-12 h-8"
                    />
                    <Input
                      value={profile.accent_color}
                      onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="background_color" className="text-sm">Background Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="background_color"
                    type="color"
                    value={profile.background_color}
                    onChange={(e) => setProfile({ ...profile, background_color: e.target.value })}
                    className="w-12 h-8"
                  />
                  <Input
                    value={profile.background_color}
                    onChange={(e) => setProfile({ ...profile, background_color: e.target.value })}
                    className="flex-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="store_font" className="text-sm">Font Family</Label>
                <Select value={profile.store_font} onValueChange={(value) => setProfile({ ...profile, store_font: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 'hero':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="hero_image_url" className="text-sm">Hero Image URL</Label>
                <Input
                  id="hero_image_url"
                  value={profile.hero_image_url || ''}
                  onChange={(e) => setProfile({ ...profile, hero_image_url: e.target.value })}
                  placeholder="https://example.com/hero-image.jpg"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="hero_headline" className="text-sm">Headline</Label>
                <Input
                  id="hero_headline"
                  value={profile.hero_headline || ''}
                  onChange={(e) => setProfile({ ...profile, hero_headline: e.target.value })}
                  placeholder="Welcome to our store"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="hero_subheading" className="text-sm">Subheading</Label>
                <Textarea
                  id="hero_subheading"
                  value={profile.hero_subheading || ''}
                  onChange={(e) => setProfile({ ...profile, hero_subheading: e.target.value })}
                  placeholder="Discover amazing products..."
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hero_cta_text" className="text-sm">CTA Button Text</Label>
                  <Input
                    id="hero_cta_text"
                    value={profile.hero_cta_text || ''}
                    onChange={(e) => setProfile({ ...profile, hero_cta_text: e.target.value })}
                    placeholder="Shop Now"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="hero_cta_link" className="text-sm">CTA Button Link</Label>
                  <Input
                    id="hero_cta_link"
                    value={profile.hero_cta_link || ''}
                    onChange={(e) => setProfile({ ...profile, hero_cta_link: e.target.value })}
                    placeholder="https://wa.me/..."
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'sections':
        return (
          <SectionManager
            sections={sections}
            setSections={setSections}
            loading={loadingSections}
            onUpdate={fetchSections}
          />
        );

      case 'settings':
        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Store Visibility</Label>
                  <p className="text-xs text-gray-500">Make your store public or private</p>
                </div>
                <Switch
                  checked={profile.store_visibility}
                  onCheckedChange={(checked) => setProfile({ ...profile, store_visibility: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="default_currency" className="text-sm">Default Currency</Label>
                  <Select value={profile.default_currency} onValueChange={(value) => setProfile({ ...profile, default_currency: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ZAR">ZAR (Rand)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="GBP">GBP (Pound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="store_layout" className="text-sm">Layout Style</Label>
                  <Select value={profile.store_layout} onValueChange={(value) => setProfile({ ...profile, store_layout: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="store_location" className="text-sm">Store Location</Label>
                <Input
                  id="store_location"
                  value={profile.store_location || ''}
                  onChange={(e) => setProfile({ ...profile, store_location: e.target.value })}
                  placeholder="City, Country"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="delivery_note" className="text-sm">Delivery Note</Label>
                <Textarea
                  id="delivery_note"
                  value={profile.delivery_note || ''}
                  onChange={(e) => setProfile({ ...profile, delivery_note: e.target.value })}
                  placeholder="Free delivery within 5km..."
                  rows={2}
                  className="mt-1 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 min-h-screen bg-gray-50">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle className="text-lg">Customize Your Storefront</CardTitle>
              <CardDescription className="text-sm mt-1">
                Design your online store with drag-and-drop simplicity. Changes are previewed instantly.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-[#4C9F70] hover:bg-[#3d8159] flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile Tab Navigation */}
      <div className="bg-white rounded-lg p-2">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { id: 'theme', label: 'Theme' },
            { id: 'hero', label: 'Hero' },
            { id: 'sections', label: 'Sections' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#4C9F70] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {renderTabContent()}
      </div>

      {/* Preview Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Live Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StorefrontPreview
            profile={profile}
            sections={sections}
            mode={previewMode}
          />
        </CardContent>
      </Card>

      {/* Store URL */}
      {profile.store_handle && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="h-4 w-4" />
              <span>Your store will be live at:</span>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="font-mono text-xs break-all">
                /store/{profile.store_handle}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorefrontCustomizationTab;

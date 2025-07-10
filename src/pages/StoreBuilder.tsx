
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';
import SectionManager from '@/components/settings/SectionManager';
import StoreDesignTab from '@/components/settings/StoreDesignTab';
import StorefrontCustomizationTab from '@/components/settings/StorefrontCustomizationTab';
import StorefrontPreview from '@/components/settings/StorefrontPreview';

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

const StoreBuilder = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    whatsapp_number: '',
    store_bio: '',
    logo_url: '',
    store_handle: '',
    store_address: '',
    snapscan_link: '',
    payfast_link: '',
    eft_details: '',
    store_layout: 'grid',
    store_font: 'inter',
    primary_color: '#4C9F70',
    accent_color: '#3d8159',
    header_banner_url: '',
    hero_image_url: '',
    hero_headline: '',
    hero_subheading: '',
    hero_cta_text: '',
    hero_cta_link: '',
    background_color: '#ffffff',
    theme_preset: 'clean',
    store_visibility: true,
    default_currency: 'ZAR',
    store_location: '',
    delivery_note: '',
    capitec_paylink: '',
    show_capitec: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSections();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          business_name: profileData.business_name || '',
          whatsapp_number: profileData.whatsapp_number || '',
          store_bio: profileData.store_bio || '',
          logo_url: profileData.logo_url || '',
          store_handle: profileData.store_handle || '',
          store_address: profileData.store_address || '',
          snapscan_link: profileData.snapscan_link || '',
          payfast_link: profileData.payfast_link || '',
          eft_details: profileData.eft_details || '',
          store_layout: profileData.store_layout || 'grid',
          store_font: profileData.store_font || 'inter',
          primary_color: profileData.primary_color || '#4C9F70',
          accent_color: profileData.accent_color || '#3d8159',
          header_banner_url: profileData.header_banner_url || '',
          hero_image_url: profileData.hero_image_url || '',
          hero_headline: profileData.hero_headline || '',
          hero_subheading: profileData.hero_subheading || '',
          hero_cta_text: profileData.hero_cta_text || '',
          hero_cta_link: profileData.hero_cta_link || '',
          background_color: profileData.background_color || '#ffffff',
          theme_preset: profileData.theme_preset || 'clean',
          store_visibility: profileData.store_visibility !== false,
          default_currency: profileData.default_currency || 'ZAR',
          store_location: profileData.store_location || '',
          delivery_note: profileData.delivery_note || '',
          capitec_paylink: profileData.capitec_paylink || '',
          show_capitec: profileData.show_capitec || false
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSections = async () => {
    if (!user) return;
    setSectionsLoading(true);

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
      toast.error('Failed to load store sections');
    } finally {
      setSectionsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Store updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update store');
    } finally {
      setLoading(false);
    }
  };

  const viewLiveStore = () => {
    if (profile.store_handle) {
      window.open(`/store/${profile.store_handle}`, '_blank');
    } else {
      toast.error('Please set a store handle first');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Store Builder</h1>
            <p className="text-gray-600 mt-2">
              Build and customize your online store with sections, design, and content.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={viewLiveStore}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Live Store
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Builder Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Store Configuration
                </CardTitle>
                <CardDescription>
                  Manage your store sections, design, and customization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="sections" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="design">Design</TabsTrigger>
                    <TabsTrigger value="customize">Customize</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sections" className="space-y-4">
                    <SectionManager
                      sections={sections}
                      setSections={setSections}
                      loading={sectionsLoading}
                      onUpdate={fetchSections}
                    />
                  </TabsContent>

                  <TabsContent value="design" className="space-y-4">
                    <StoreDesignTab
                      profile={profile}
                      setProfile={setProfile}
                      onSave={saveProfile}
                      loading={loading}
                    />
                  </TabsContent>

                  <TabsContent value="customize" className="space-y-4">
                    <StorefrontCustomizationTab
                      profile={profile}
                      setProfile={setProfile}
                      onSave={saveProfile}
                      loading={loading}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      Desktop
                    </Button>
                    <Button
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      Mobile
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Preview how your store will look to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StorefrontPreview
                  profile={profile}
                  sections={sections}
                  mode={previewMode}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StoreBuilder;

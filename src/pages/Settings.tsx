
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import BusinessProfileTab from '@/components/settings/BusinessProfileTab';
import StoreDesignTab from '@/components/settings/StoreDesignTab';
import PaymentSettingsTab from '@/components/settings/PaymentSettingsTab';
import WhatsAppAutomationTab from '@/components/settings/WhatsAppAutomationTab';
import StorefrontCustomizationTab from '@/components/settings/StorefrontCustomizationTab';
import { useIsMobile } from '@/hooks/use-mobile';

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

interface PlatformSettings {
  whatsapp_api_token: string;
  whatsapp_phone_id: string;
}

const Settings = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    whatsapp_number: '',
    store_bio: '',
    logo_url: '',
    store_handle: '',
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
    delivery_note: ''
  });

  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    whatsapp_api_token: '',
    whatsapp_phone_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
      fetchPlatformSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
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
          delivery_note: profileData.delivery_note || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('whatsapp_api_token, whatsapp_phone_id')
        .single();

      if (error) {
        console.error('Error fetching platform settings:', error);
        return;
      }

      if (data) {
        setPlatformSettings({
          whatsapp_api_token: data.whatsapp_api_token || '',
          whatsapp_phone_id: data.whatsapp_phone_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
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
      toast.success('Settings updated successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      if (error.message?.includes('unique constraint')) {
        toast.error('Store handle is already taken. Please choose a different one.');
      } else {
        toast.error('Failed to update settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const savePlatformSettings = async () => {
    setWhatsappLoading(true);

    try {
      // First get the existing platform settings ID
      const { data: existingSettings } = await supabase
        .from('platform_settings')
        .select('id')
        .single();

      if (existingSettings?.id) {
        const { error } = await supabase
          .from('platform_settings')
          .update({
            whatsapp_api_token: platformSettings.whatsapp_api_token,
            whatsapp_phone_id: platformSettings.whatsapp_phone_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
        toast.success('WhatsApp settings updated successfully!');
      }
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Failed to update WhatsApp settings');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const tabOptions = [
    { value: 'profile', label: isMobile ? 'Profile' : 'Business Profile' },
    { value: 'customize', label: isMobile ? 'Store' : 'Customize Store' },
    { value: 'design', label: 'Design' },
    { value: 'payments', label: 'Payments' },
    { value: 'whatsapp', label: 'WhatsApp' }
  ];

  if (isMobile) {
    return (
      <Layout>
        <div className="max-w-full mx-auto space-y-4 px-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Manage your store settings and business information.
            </p>
          </div>

          {/* Mobile Tab Selection */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {tabOptions.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.value
                      ? 'bg-[#4C9F70] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Tab Content */}
          <div className="space-y-4">
            {activeTab === 'profile' && (
              <BusinessProfileTab
                profile={profile}
                setProfile={setProfile}
                onSave={saveProfile}
                loading={loading}
              />
            )}

            {activeTab === 'customize' && (
              <StorefrontCustomizationTab
                profile={profile}
                setProfile={setProfile}
                onSave={saveProfile}
                loading={loading}
              />
            )}

            {activeTab === 'design' && (
              <StoreDesignTab
                profile={profile}
                setProfile={setProfile}
                onSave={saveProfile}
                loading={loading}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentSettingsTab
                profile={profile}
                setProfile={setProfile}
                onSave={saveProfile}
                loading={loading}
              />
            )}

            {activeTab === 'whatsapp' && (
              <WhatsAppAutomationTab
                platformSettings={platformSettings}
                setPlatformSettings={setPlatformSettings}
                onSave={savePlatformSettings}
                loading={whatsappLoading}
              />
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-4 px-2 sm:px-4">
        <div className="px-2 sm:px-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            Manage your store settings and business information.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5">
              Business Profile
            </TabsTrigger>
            <TabsTrigger value="customize" className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5">
              Customize Store
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5">
              Store Design
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5">
              Payment Settings
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-xs sm:text-sm px-2 sm:px-3 py-2 sm:py-1.5">
              WhatsApp Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <BusinessProfileTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="customize" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <StorefrontCustomizationTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="design" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <StoreDesignTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <PaymentSettingsTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4 sm:space-y-6 px-2 sm:px-0">
            <WhatsAppAutomationTab
              platformSettings={platformSettings}
              setPlatformSettings={setPlatformSettings}
              onSave={savePlatformSettings}
              loading={whatsappLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;

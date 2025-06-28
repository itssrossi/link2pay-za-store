
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
}

interface PlatformSettings {
  whatsapp_api_token: string;
  whatsapp_phone_id: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
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
    header_banner_url: ''
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
          header_banner_url: profileData.header_banner_url || ''
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your store settings and business information.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="design">Store Design</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp Automation</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <BusinessProfileTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <StoreDesignTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <PaymentSettingsTab
              profile={profile}
              setProfile={setProfile}
              onSave={saveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-6">
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

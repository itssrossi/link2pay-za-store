
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BusinessProfileTab from '@/components/settings/BusinessProfileTab';
import PaymentSettingsTab from '@/components/settings/PaymentSettingsTab';
import SubscriptionTab from '@/components/settings/SubscriptionTab';
import StoreDesignTab from '@/components/settings/StoreDesignTab';
import StorefrontCustomizationTab from '@/components/settings/StorefrontCustomizationTab';
import AvailabilitySettings from '@/components/booking/AvailabilitySettings';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'business';
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data || {
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
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile || !user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating profile:', error);
      }
    } catch (error) {
      console.error('Error in handleSaveProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render the tabs if profile is still loading
  if (loading) {
    return (
      <Layout>
        <div className="space-y-6 px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 -mt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 gap-2 sm:grid-cols-6 sm:gap-1 px-2 py-16 mb-20 ">
            <TabsTrigger value="business" className="text-xs sm:text-sm">Business</TabsTrigger>
            <TabsTrigger value="design" className="text-xs sm:text-sm">Design</TabsTrigger>
            <TabsTrigger value="storefront" className="text-xs sm:text-sm">Storefront</TabsTrigger>
            <TabsTrigger value="booking" className="text-xs sm:text-sm">Booking</TabsTrigger>
            <TabsTrigger value="subscription" className="text-xs sm:text-sm">Subscription</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <BusinessProfileTab
              profile={profile}
              setProfile={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="design">
            <StoreDesignTab
              profile={profile}
              setProfile={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="storefront">
            <StorefrontCustomizationTab
              profile={profile}
              setProfile={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="booking">
            <AvailabilitySettings />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettingsTab
              profile={profile}
              setProfile={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;

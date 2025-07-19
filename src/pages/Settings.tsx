import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BusinessProfileTab from '@/components/settings/BusinessProfileTab';
import PaymentSettingsTab from '@/components/settings/PaymentSettingsTab';
import WhatsAppSettingsTab from '@/components/settings/WhatsAppSettingsTab';
import DesignSettingsTab from '@/components/settings/DesignSettingsTab';
import StorefrontSettingsTab from '@/components/settings/StorefrontSettingsTab';
import SubscriptionTab from '@/components/settings/SubscriptionTab';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('business');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const handleSaveProfile = async (newProfileData: any) => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(newProfileData)
      .eq('id', profile.id);

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      setProfile(newProfileData);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="storefront">Storefront</TabsTrigger>
          </TabsList>

          <TabsContent value="business">
            <BusinessProfileTab
              profile={profile}
              onProfileChange={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionTab />
          </TabsContent>

          <TabsContent value="payment">
            <PaymentSettingsTab
              profile={profile}
              onProfileChange={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsAppSettingsTab
              profile={profile}
              onProfileChange={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="design">
            <DesignSettingsTab
              profile={profile}
              onProfileChange={setProfile}
              onSave={handleSaveProfile}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="storefront">
            <StorefrontSettingsTab
              profile={profile}
              onProfileChange={setProfile}
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

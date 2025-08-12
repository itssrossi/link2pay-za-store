
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
import { toast } from 'sonner';

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
    if (!profile || !user) {
      console.log('Cannot save: missing profile or user', { profile: !!profile, user: !!user });
      return;
    }
    
    console.log('Saving profile:', profile);
    setLoading(true);
    
    try {
      // If there's a duplicate store handle issue, generate a new unique one
      let finalProfile = { ...profile };
      
      if (profile.store_handle) {
        // Check if the store handle is already taken by another user
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('store_handle', profile.store_handle)
          .neq('id', user.id)
          .maybeSingle();
        
        if (existingProfile) {
          // Generate a unique handle
          try {
            const { data: handleData, error: handleError } = await supabase.functions.invoke('generate-unique-handle', {
              body: { businessName: profile.business_name || profile.store_handle }
            });
            
            if (!handleError && handleData?.uniqueHandle) {
              finalProfile.store_handle = handleData.uniqueHandle;
              setProfile(finalProfile); // Update the form with the new handle
              toast.info(`Store handle was updated to "${handleData.uniqueHandle}" to ensure uniqueness`);
            }
          } catch (handleGenError) {
            console.error('Error generating unique handle:', handleGenError);
            // Continue with original handle and let database handle it
          }
        }
      }

      const payload = {
        id: user.id,
        ...finalProfile,
        updated_at: new Date().toISOString(),
      };

      console.log('Save payload:', payload);

      const { error } = await supabase
        .from('profiles')
        .upsert(payload);

      if (error) {
        console.error('Error updating profile:', error);
        
        // Handle specific error cases
        if (error.code === '23505' && error.message.includes('store_handle')) {
          toast.error('Store handle is already taken. Please choose a different one.');
        } else {
          toast.error('Failed to save changes. Please try again.');
        }
        
        // Don't reset the profile state so user input is preserved
      } else {
        console.log('Profile saved successfully');
        toast.success('Profile saved successfully');
        
        // Refresh the profile to ensure we have the latest data
        await fetchProfile();
      }
    } catch (error) {
      console.error('Error in handleSaveProfile:', error);
      toast.error('Unexpected error while saving.');
      // Don't reset the profile state so user input is preserved
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
      <div className="space-y-6 px-4 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6">
            <TabsList className="grid w-full grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-6 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="business" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Business
              </TabsTrigger>
              <TabsTrigger value="design" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Design
              </TabsTrigger>
              <TabsTrigger value="storefront" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Storefront
              </TabsTrigger>
              <TabsTrigger value="booking" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Booking
              </TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Subscription
              </TabsTrigger>
              <TabsTrigger value="payment" className="text-xs sm:text-sm py-2 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                Payment
              </TabsTrigger>
            </TabsList>
          </div>

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

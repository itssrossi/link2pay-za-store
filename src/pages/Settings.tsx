
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Profile {
  business_name: string;
  whatsapp_number: string;
  store_bio: string;
  logo_url: string;
  store_handle: string;
  snapscan_link: string;
  payfast_link: string;
  eft_details: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    whatsapp_number: '',
    store_bio: '',
    logo_url: '',
    store_handle: '',
    snapscan_link: '',
    payfast_link: '',
    eft_details: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
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
          eft_details: profileData.eft_details || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
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
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Business Profile</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>
                  Update your business details and store settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="business_name">Business Name</Label>
                    <Input
                      id="business_name"
                      value={profile.business_name}
                      onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                      placeholder="Your Business Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="store_handle">Store Handle</Label>
                    <Input
                      id="store_handle"
                      value={profile.store_handle}
                      onChange={(e) => setProfile({ ...profile, store_handle: e.target.value })}
                      placeholder="your-store-name"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your store will be available at: /shop/{profile.store_handle || 'your-store-name'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                  <Input
                    id="whatsapp_number"
                    value={profile.whatsapp_number}
                    onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                    placeholder="27821234567"
                  />
                </div>

                <div>
                  <Label htmlFor="store_bio">Store Bio</Label>
                  <Textarea
                    id="store_bio"
                    value={profile.store_bio}
                    onChange={(e) => setProfile({ ...profile, store_bio: e.target.value })}
                    placeholder="Tell customers about your business..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={profile.logo_url}
                    onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>

                <Button 
                  onClick={saveProfile}
                  disabled={loading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Configure how customers can pay you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Digital Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="snapscan_link">SnapScan Payment Link</Label>
                      <Input
                        id="snapscan_link"
                        value={profile.snapscan_link}
                        onChange={(e) => setProfile({ ...profile, snapscan_link: e.target.value })}
                        placeholder="https://pos.snapscan.io/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfast_link">PayFast Payment Link</Label>
                      <Input
                        id="payfast_link"
                        value={profile.payfast_link}
                        onChange={(e) => setProfile({ ...profile, payfast_link: e.target.value })}
                        placeholder="https://www.payfast.co.za/..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">EFT Banking Details</h3>
                  <div>
                    <Label htmlFor="eft_details">Banking Information</Label>
                    <Textarea
                      id="eft_details"
                      value={profile.eft_details}
                      onChange={(e) => setProfile({ ...profile, eft_details: e.target.value })}
                      placeholder="Bank: First National Bank&#10;Account Holder: Your Name&#10;Account Number: 1234567890&#10;Branch Code: 250655"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your complete banking details for EFT payments
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={saveProfile}
                  disabled={loading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Saving...' : 'Save Payment Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;


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
}

interface PaymentMethods {
  snapscan_link: string;
  payfast_link: string;
  eft_bank_name: string;
  eft_account_holder: string;
  eft_account_number: string;
  eft_branch_code: string;
}

interface ApiSettings {
  snapscan_api_key: string;
  payfast_merchant_id: string;
  payfast_secret: string;
  courierguy_token: string;
  whatsapp_token: string;
  webhook_url: string;
}

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    business_name: '',
    whatsapp_number: '',
    store_bio: '',
    logo_url: ''
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({
    snapscan_link: '',
    payfast_link: '',
    eft_bank_name: '',
    eft_account_holder: '',
    eft_account_number: '',
    eft_branch_code: ''
  });
  const [apiSettings, setApiSettings] = useState<ApiSettings>({
    snapscan_api_key: '',
    payfast_merchant_id: '',
    payfast_secret: '',
    courierguy_token: '',
    whatsapp_token: '',
    webhook_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch payment methods
      const { data: paymentData } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (paymentData) {
        setPaymentMethods(paymentData);
      }

      // Fetch API settings
      const { data: apiData } = await supabase
        .from('api_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (apiData) {
        setApiSettings(apiData);
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
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const savePaymentMethods = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('payment_methods')
        .upsert({
          user_id: user.id,
          ...paymentMethods,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Payment methods updated successfully!');
    } catch (error) {
      console.error('Error saving payment methods:', error);
      toast.error('Failed to update payment methods');
    } finally {
      setLoading(false);
    }
  };

  const saveApiSettings = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('api_settings')
        .upsert({
          user_id: user.id,
          ...apiSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('API settings updated successfully!');
    } catch (error) {
      console.error('Error saving API settings:', error);
      toast.error('Failed to update API settings');
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
            Manage your store settings, payment methods, and API integrations.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile & Store</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="api">API Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Update your business information and store settings
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
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      value={profile.whatsapp_number}
                      onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                      placeholder="27821234567"
                    />
                  </div>
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
                        value={paymentMethods.snapscan_link}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, snapscan_link: e.target.value })}
                        placeholder="https://pos.snapscan.io/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfast_link">PayFast Payment Link</Label>
                      <Input
                        id="payfast_link"
                        value={paymentMethods.payfast_link}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, payfast_link: e.target.value })}
                        placeholder="https://www.payfast.co.za/..."
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">EFT Banking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eft_bank_name">Bank Name</Label>
                      <Input
                        id="eft_bank_name"
                        value={paymentMethods.eft_bank_name}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, eft_bank_name: e.target.value })}
                        placeholder="First National Bank"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eft_account_holder">Account Holder</Label>
                      <Input
                        id="eft_account_holder"
                        value={paymentMethods.eft_account_holder}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, eft_account_holder: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eft_account_number">Account Number</Label>
                      <Input
                        id="eft_account_number"
                        value={paymentMethods.eft_account_number}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, eft_account_number: e.target.value })}
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eft_branch_code">Branch Code</Label>
                      <Input
                        id="eft_branch_code"
                        value={paymentMethods.eft_branch_code}
                        onChange={(e) => setPaymentMethods({ ...paymentMethods, eft_branch_code: e.target.value })}
                        placeholder="250655"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={savePaymentMethods}
                  disabled={loading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Saving...' : 'Save Payment Methods'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>
                  Configure third-party integrations and API keys
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Payment APIs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="snapscan_api_key">SnapScan API Key</Label>
                      <Input
                        id="snapscan_api_key"
                        type="password"
                        value={apiSettings.snapscan_api_key}
                        onChange={(e) => setApiSettings({ ...apiSettings, snapscan_api_key: e.target.value })}
                        placeholder="Enter your SnapScan API key"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfast_merchant_id">PayFast Merchant ID</Label>
                      <Input
                        id="payfast_merchant_id"
                        value={apiSettings.payfast_merchant_id}
                        onChange={(e) => setApiSettings({ ...apiSettings, payfast_merchant_id: e.target.value })}
                        placeholder="10000100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payfast_secret">PayFast Secret</Label>
                      <Input
                        id="payfast_secret"
                        type="password"
                        value={apiSettings.payfast_secret}
                        onChange={(e) => setApiSettings({ ...apiSettings, payfast_secret: e.target.value })}
                        placeholder="Enter your PayFast secret"
                      />
                    </div>
                    <div>
                      <Label htmlFor="courierguy_token">CourierGuy API Token</Label>
                      <Input
                        id="courierguy_token"
                        type="password"
                        value={apiSettings.courierguy_token}
                        onChange={(e) => setApiSettings({ ...apiSettings, courierguy_token: e.target.value })}
                        placeholder="Enter your CourierGuy token"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Advanced Settings</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="whatsapp_token">WhatsApp API Token (Optional)</Label>
                      <Input
                        id="whatsapp_token"
                        type="password"
                        value={apiSettings.whatsapp_token}
                        onChange={(e) => setApiSettings({ ...apiSettings, whatsapp_token: e.target.value })}
                        placeholder="For future automation features"
                      />
                    </div>
                    <div>
                      <Label htmlFor="webhook_url">Webhook URL</Label>
                      <Input
                        id="webhook_url"
                        value={apiSettings.webhook_url}
                        onChange={(e) => setApiSettings({ ...apiSettings, webhook_url: e.target.value })}
                        placeholder="https://yoursite.com/webhook"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={saveApiSettings}
                  disabled={loading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Saving...' : 'Save API Settings'}
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

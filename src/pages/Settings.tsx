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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Copy, ExternalLink } from 'lucide-react';

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
      const { error } = await supabase
        .from('platform_settings')
        .update({
          whatsapp_api_token: platformSettings.whatsapp_api_token,
          whatsapp_phone_id: platformSettings.whatsapp_phone_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.from('platform_settings').select('id').single()).data?.id);

      if (error) throw error;
      toast.success('WhatsApp settings updated successfully!');
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Failed to update WhatsApp settings');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const copyStoreLink = () => {
    if (!profile.store_handle) {
      toast.error('Please set a store handle first');
      return;
    }
    const storeUrl = `${window.location.origin}/store/${profile.store_handle}`;
    navigator.clipboard.writeText(storeUrl);
    toast.success('Store link copied to clipboard!');
  };

  const openStorePreview = () => {
    if (!profile.store_handle) {
      toast.error('Please set a store handle first');
      return;
    }
    const storeUrl = `${window.location.origin}/store/${profile.store_handle}`;
    window.open(storeUrl, '_blank');
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
                      onChange={(e) => setProfile({ ...profile, store_handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      placeholder="your-store-name"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your store will be available at: /store/{profile.store_handle || 'your-store-name'}
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

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={saveProfile}
                    disabled={loading}
                    className="bg-[#4C9F70] hover:bg-[#3d8159]"
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
                  
                  <Button 
                    onClick={copyStoreLink}
                    variant="outline"
                    disabled={!profile.store_handle}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Store Link
                  </Button>
                  
                  <Button 
                    onClick={openStorePreview}
                    variant="outline"
                    disabled={!profile.store_handle}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview Store
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Store Design</CardTitle>
                <CardDescription>
                  Customize the look and feel of your public store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="store_layout">Store Layout</Label>
                    <Select value={profile.store_layout} onValueChange={(value) => setProfile({ ...profile, store_layout: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose layout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="list">List</SelectItem>
                        <SelectItem value="carousel">Carousel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="store_font">Font Style</Label>
                    <Select value={profile.store_font} onValueChange={(value) => setProfile({ ...profile, store_font: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inter">Inter</SelectItem>
                        <SelectItem value="poppins">Poppins</SelectItem>
                        <SelectItem value="roboto">Roboto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary_color"
                        type="color"
                        value={profile.primary_color}
                        onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={profile.primary_color}
                        onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })}
                        placeholder="#4C9F70"
                        className="flex-1"
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
                        onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                        className="w-16 h-10"
                      />
                      <Input
                        value={profile.accent_color}
                        onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })}
                        placeholder="#3d8159"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="header_banner_url">Header Banner URL (Optional)</Label>
                  <Input
                    id="header_banner_url"
                    value={profile.header_banner_url}
                    onChange={(e) => setProfile({ ...profile, header_banner_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 1200x300px
                  </p>
                </div>

                <Button 
                  onClick={saveProfile}
                  disabled={loading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {loading ? 'Saving...' : 'Save Design Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Paste your SnapScan or PayFast link here to enable fast payments on invoices.
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
                      <p className="text-xs text-gray-500 mt-1">
                        Paste your SnapScan link to enable "Pay Now via SnapScan" buttons
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="payfast_link">PayFast Payment Link</Label>
                      <Input
                        id="payfast_link"
                        value={profile.payfast_link}
                        onChange={(e) => setProfile({ ...profile, payfast_link: e.target.value })}
                        placeholder="https://www.payfast.co.za/..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Paste your PayFast link to enable "Pay Now via PayFast" buttons
                      </p>
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

          <TabsContent value="whatsapp" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Automation (Platform Admin)</CardTitle>
                <CardDescription>
                  Configure the platform's WhatsApp Business API credentials for automated invoice messaging.
                  These settings are used for all WhatsApp automation across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="whatsapp_api_token">360dialog API Token</Label>
                    <Input
                      id="whatsapp_api_token"
                      type="password"
                      value={platformSettings.whatsapp_api_token}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, whatsapp_api_token: e.target.value })}
                      placeholder="Enter your 360dialog API token"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your secure API token from 360dialog WhatsApp Business API
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp_phone_id">WhatsApp Business Phone Number ID</Label>
                    <Input
                      id="whatsapp_phone_id"
                      value={platformSettings.whatsapp_phone_id}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, whatsapp_phone_id: e.target.value })}
                      placeholder="Enter your WhatsApp Business Phone Number ID"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The Phone Number ID from your WhatsApp Business API setup
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How WhatsApp Automation Works:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Users can send invoices via WhatsApp using the enhanced l2p: command</li>
                    <li>• Format: l2p:ClientName:Amount:ProductID:+27Phone</li>
                    <li>• Messages are sent automatically when invoices are created</li>
                    <li>• Manual WhatsApp option available in invoice creation form</li>
                  </ul>
                </div>

                <Button 
                  onClick={savePlatformSettings}
                  disabled={whatsappLoading}
                  className="bg-[#4C9F70] hover:bg-[#3d8159]"
                >
                  {whatsappLoading ? 'Saving...' : 'Save WhatsApp Settings'}
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

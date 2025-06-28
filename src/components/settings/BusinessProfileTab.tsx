
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, ExternalLink } from 'lucide-react';
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
  store_layout: string;
  store_font: string;
  primary_color: string;
  accent_color: string;
  header_banner_url: string;
}

interface BusinessProfileTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const BusinessProfileTab = ({ profile, setProfile, onSave, loading }: BusinessProfileTabProps) => {
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
            onClick={onSave}
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
  );
};

export default BusinessProfileTab;

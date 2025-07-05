
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';

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

interface PaymentSettingsTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const PaymentSettingsTab = ({ profile, setProfile, onSave, loading }: PaymentSettingsTabProps) => {
  const handleChange = (field: string, value: string | boolean) => {
    setProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Methods
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="snapscan_link">SnapScan Link</Label>
            <Input
              id="snapscan_link"
              type="url"
              value={profile.snapscan_link}
              onChange={(e) => handleChange('snapscan_link', e.target.value)}
              placeholder="https://pos.snapscan.io/merchant/..."
            />
          </div>

          <div>
            <Label htmlFor="payfast_link">PayFast Link (Manual)</Label>
            <Input
              id="payfast_link"
              type="url"
              value={profile.payfast_link}
              onChange={(e) => handleChange('payfast_link', e.target.value)}
              placeholder="https://www.payfast.co.za/eng/process/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Note: For automated PayFast payments, configure your credentials in the PayFast Integration tab.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="capitec_paylink" className="text-base">Capitec Pay Me Link</Label>
                <p className="text-sm text-gray-500">
                  Enable Capitec Pay Me payments on your invoices
                </p>
              </div>
              <Switch
                id="show_capitec"
                checked={profile.show_capitec}
                onCheckedChange={(checked) => handleChange('show_capitec', checked)}
              />
            </div>
            
            {profile.show_capitec && (
              <div>
                <Label htmlFor="capitec_paylink">Capitec Pay Me Link</Label>
                <Input
                  id="capitec_paylink"
                  type="url"
                  value={profile.capitec_paylink}
                  onChange={(e) => handleChange('capitec_paylink', e.target.value)}
                  placeholder="https://paylink.capitecbank.co.za/..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Your Capitec Pay Me link that customers will use to pay you directly.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="eft_details">EFT Banking Details</Label>
            <Textarea
              id="eft_details"
              value={profile.eft_details}
              onChange={(e) => handleChange('eft_details', e.target.value)}
              placeholder="Bank: Standard Bank&#10;Account Name: Your Business Name&#10;Account Number: 123456789&#10;Branch Code: 051001"
              rows={5}
            />
            <p className="text-sm text-gray-500 mt-1">
              These details will appear on your invoices for manual EFT payments.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={onSave} 
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default PaymentSettingsTab;

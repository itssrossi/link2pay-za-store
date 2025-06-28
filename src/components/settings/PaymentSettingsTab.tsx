
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

interface PaymentSettingsTabProps {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  onSave: () => void;
  loading: boolean;
}

const PaymentSettingsTab = ({ profile, setProfile, onSave, loading }: PaymentSettingsTabProps) => {
  return (
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
          onClick={onSave}
          disabled={loading}
          className="bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Saving...' : 'Save Payment Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PaymentSettingsTab;

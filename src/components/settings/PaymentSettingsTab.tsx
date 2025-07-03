
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, TestTube, Info } from 'lucide-react';
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
  const testPaymentLink = (type: 'snapscan' | 'payfast') => {
    const link = type === 'snapscan' ? profile.snapscan_link : profile.payfast_link;
    if (!link) {
      toast.error(`No ${type === 'snapscan' ? 'SnapScan' : 'PayFast'} link configured`);
      return;
    }
    
    window.open(link, '_blank');
    toast.success(`Opened ${type === 'snapscan' ? 'SnapScan' : 'PayFast'} link in new tab`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>
          Configure your payment options to enable quick payments on invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Digital Payments</h3>
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-3">
              <Label htmlFor="snapscan_link">SnapScan Payment Link</Label>
              <Input
                id="snapscan_link"
                value={profile.snapscan_link}
                onChange={(e) => setProfile({ ...profile, snapscan_link: e.target.value })}
                placeholder="https://pos.snapscan.io/qr/..."
              />
              <p className="text-xs text-gray-500">
                Paste your SnapScan link here to enable "Pay Now with SnapScan" buttons on your invoices.
              </p>
              {profile.snapscan_link && (
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline"
                  onClick={() => testPaymentLink('snapscan')}
                  className="w-fit"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test SnapScan Link
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-orange-900">
                      PayFast Integration Available
                    </p>
                    <p className="text-sm text-orange-700">
                      Instead of manually pasting PayFast links, you can now configure your PayFast credentials 
                      once in the <strong>PayFast Integration</strong> tab. The platform will automatically generate 
                      secure payment links for each invoice.
                    </p>
                  </div>
                </div>
              </div>
              
              <Label htmlFor="payfast_link">Manual PayFast Payment Link (Legacy)</Label>
              <Input
                id="payfast_link"
                value={profile.payfast_link}
                onChange={(e) => setProfile({ ...profile, payfast_link: e.target.value })}
                placeholder="https://www.payfast.co.za/eng/process?..."
              />
              <p className="text-xs text-gray-500">
                This field is for manual PayFast links. Consider using the automated PayFast Integration instead.
              </p>
              {profile.payfast_link && (
                <Button 
                  type="button"
                  size="sm" 
                  variant="outline"
                  onClick={() => testPaymentLink('payfast')}
                  className="w-fit"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  Test PayFast Link
                </Button>
              )}
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

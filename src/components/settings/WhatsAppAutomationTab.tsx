
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PlatformSettings {
  whatsapp_api_token: string;
  whatsapp_phone_id: string;
  gupshup_api_key: string;
  gupshup_source_phone: string;
}

interface WhatsAppAutomationTabProps {
  platformSettings: PlatformSettings;
  setPlatformSettings: (settings: PlatformSettings) => void;
  onSave: () => void;
  loading: boolean;
}

const WhatsAppAutomationTab = ({ platformSettings, setPlatformSettings, onSave, loading }: WhatsAppAutomationTabProps) => {
  return (
    <div className="space-y-6">
      {/* Gupshup.io Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Gupshup WhatsApp Business API (Current)</CardTitle>
          <CardDescription>
            Configure the platform's Gupshup WhatsApp Business API credentials for automated invoice messaging.
            This is the primary method for WhatsApp automation across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="gupshup_api_key">Gupshup API Key</Label>
              <Input
                id="gupshup_api_key"
                type="password"
                value={platformSettings.gupshup_api_key}
                onChange={(e) => setPlatformSettings({ ...platformSettings, gupshup_api_key: e.target.value })}
                placeholder="Enter your Gupshup API key"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your secure API key from Gupshup dashboard
              </p>
            </div>
            
            <div>
              <Label htmlFor="gupshup_source_phone">Source Phone Number</Label>
              <Input
                id="gupshup_source_phone"
                value={platformSettings.gupshup_source_phone}
                onChange={(e) => setPlatformSettings({ ...platformSettings, gupshup_source_phone: e.target.value })}
                placeholder="e.g., 15557961325"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Gupshup WhatsApp Business source phone number
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Gupshup Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Automatic invoice messaging via l2p: command</li>
              <li>• Manual WhatsApp option in invoice creation form</li>
              <li>• Template-based messaging with invoice details</li>
              <li>• Reliable delivery with professional WhatsApp Business API</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Legacy 360dialog Integration */}
      <Card>
        <CardHeader>
          <CardTitle>360dialog WhatsApp API (Legacy)</CardTitle>
          <CardDescription>
            Alternative WhatsApp Business API provider. Configure only if not using Gupshup.
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
        </CardContent>
      </Card>

      <Button 
        onClick={onSave}
        disabled={loading}
        className="bg-[#4C9F70] hover:bg-[#3d8159] w-full"
      >
        {loading ? 'Saving...' : 'Save WhatsApp Settings'}
      </Button>
    </div>
  );
};

export default WhatsAppAutomationTab;

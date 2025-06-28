
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PlatformSettings {
  whatsapp_api_token: string;
  whatsapp_phone_id: string;
}

interface WhatsAppAutomationTabProps {
  platformSettings: PlatformSettings;
  setPlatformSettings: (settings: PlatformSettings) => void;
  onSave: () => void;
  loading: boolean;
}

const WhatsAppAutomationTab = ({ platformSettings, setPlatformSettings, onSave, loading }: WhatsAppAutomationTabProps) => {
  return (
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
          onClick={onSave}
          disabled={loading}
          className="bg-[#4C9F70] hover:bg-[#3d8159]"
        >
          {loading ? 'Saving...' : 'Save WhatsApp Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WhatsAppAutomationTab;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface PlatformSettings {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_number: string;
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
      {/* Twilio WhatsApp Business API Integration */}
      <Card>
        <CardHeader>
          <CardTitle>Twilio WhatsApp Business API</CardTitle>
          <CardDescription>
            Configure Twilio WhatsApp Business API credentials for automated invoice messaging.
            This is the primary method for WhatsApp automation across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="twilio_account_sid">Twilio Account SID</Label>
              <Input
                id="twilio_account_sid"
                type="password"
                value={platformSettings.twilio_account_sid}
                onChange={(e) => setPlatformSettings({ ...platformSettings, twilio_account_sid: e.target.value })}
                placeholder="Enter your Twilio Account SID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Twilio Account SID from the Twilio Console
              </p>
            </div>
            
            <div>
              <Label htmlFor="twilio_auth_token">Twilio Auth Token</Label>
              <Input
                id="twilio_auth_token"
                type="password"
                value={platformSettings.twilio_auth_token}
                onChange={(e) => setPlatformSettings({ ...platformSettings, twilio_auth_token: e.target.value })}
                placeholder="Enter your Twilio Auth Token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your secure Auth Token from Twilio Console
              </p>
            </div>
            
            <div>
              <Label htmlFor="twilio_whatsapp_number">WhatsApp Sender Number</Label>
              <Input
                id="twilio_whatsapp_number"
                value={platformSettings.twilio_whatsapp_number}
                onChange={(e) => setPlatformSettings({ ...platformSettings, twilio_whatsapp_number: e.target.value })}
                placeholder="e.g., whatsapp:+27750143309"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your approved Twilio WhatsApp sender number
              </p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Twilio WhatsApp Features:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Automatic invoice messaging via l2p: command</li>
              <li>• Payment confirmation messages when invoices are marked paid</li>
              <li>• Template-based messaging with invoice details</li>
              <li>• Reliable delivery with Twilio's WhatsApp Business API</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">How WhatsApp Automation Works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Users can send invoices via WhatsApp using the enhanced l2p: command</li>
              <li>• Format: l2p:ClientName:Amount:ProductID:+27Phone</li>
              <li>• Messages are sent automatically when invoices are created</li>
              <li>• Payment confirmations sent when invoices are marked as paid</li>
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

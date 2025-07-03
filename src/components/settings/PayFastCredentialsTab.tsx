
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, TestTube, Shield, Info, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PayFastService, type PayFastCredentials } from '@/utils/payfastService';

interface PayFastCredentialsTabProps {
  credentials: Partial<PayFastCredentials>;
  setCredentials: (credentials: Partial<PayFastCredentials>) => void;
  onSave: () => void;
  loading: boolean;
}

const PayFastCredentialsTab = ({ 
  credentials, 
  setCredentials, 
  onSave, 
  loading 
}: PayFastCredentialsTabProps) => {
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestPayment = async () => {
    console.log('PayFast: Testing payment with credentials:', { 
      merchant_id: credentials.merchant_id, 
      mode: credentials.mode 
    });
    
    setTestError(null);
    const validation = PayFastService.validateCredentials(credentials);
    
    if (!validation.isValid) {
      console.error('PayFast: Validation failed:', validation.errors);
      setTestError(validation.errors.join(', '));
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setTestLoading(true);
    try {
      const testLink = PayFastService.generateTestLink(credentials as PayFastCredentials);
      console.log('PayFast: Generated test link:', testLink);
      
      // Test the link by making a HEAD request to check if it's accessible
      try {
        const response = await fetch(testLink, { method: 'HEAD', mode: 'no-cors' });
        console.log('PayFast: Test link response status:', response.status);
      } catch (error) {
        console.log('PayFast: Test link CORS blocked (expected), opening link');
      }
      
      window.open(testLink, '_blank');
      toast.success('Test payment link opened in new tab');
      setTestError(null);
    } catch (error) {
      console.error('PayFast: Error generating test link:', error);
      const errorMessage = 'Failed to generate test payment link';
      setTestError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  const updateCredentials = (field: keyof PayFastCredentials, value: string) => {
    setCredentials({ ...credentials, [field]: value });
    // Clear error when user starts typing
    if (testError) {
      setTestError(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          PayFast Integration
        </CardTitle>
        <CardDescription>
          Configure your PayFast credentials to automatically generate payment links for invoices.
          Your credentials are stored securely and used only for generating payment URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                One-Time Setup
              </p>
              <p className="text-sm text-blue-700">
                Enter your PayFast merchant credentials once. The platform will automatically 
                generate secure payment links for all your invoices, directing payments to your PayFast account.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {testError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-900">
                  Configuration Error
                </p>
                <p className="text-sm text-red-700">
                  {testError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">PayFast Merchant Credentials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant_id">Merchant ID *</Label>
              <Input
                id="merchant_id"
                value={credentials.merchant_id || ''}
                onChange={(e) => updateCredentials('merchant_id', e.target.value)}
                placeholder="10000100"
              />
              <p className="text-xs text-gray-500">
                Found in your PayFast dashboard under Integration (must be numeric)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="merchant_key">Merchant Key *</Label>
              <Input
                id="merchant_key"
                value={credentials.merchant_key || ''}
                onChange={(e) => updateCredentials('merchant_key', e.target.value)}
                placeholder="abc123def456"
                type="password"
              />
              <p className="text-xs text-gray-500">
                Keep this secure - it's used to generate payment signatures
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase (Optional)</Label>
            <Input
              id="passphrase"
              value={credentials.passphrase || ''}
              onChange={(e) => updateCredentials('passphrase', e.target.value)}
              placeholder="Enter your PayFast passphrase if configured"
              type="password"
            />
            <p className="text-xs text-gray-500">
              Only required if you've set a passphrase in your PayFast account
            </p>
          </div>
        </div>

        <Separator />

        {/* Mode Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Payment Mode</h3>
          <RadioGroup
            value={credentials.mode || 'sandbox'}
            onValueChange={(value) => updateCredentials('mode', value)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="sandbox" id="sandbox" />
              <div className="space-y-1">
                <Label htmlFor="sandbox" className="text-sm font-medium">
                  Sandbox (Testing)
                </Label>
                <p className="text-xs text-gray-500">
                  Use for testing - no real payments processed
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 border rounded-lg p-4">
              <RadioGroupItem value="live" id="live" />
              <div className="space-y-1">
                <Label htmlFor="live" className="text-sm font-medium">
                  Live (Production)
                </Label>
                <p className="text-xs text-gray-500">
                  Real payments will be processed
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <Separator />

        {/* Debug Info */}
        {credentials.merchant_id && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Merchant ID: {credentials.merchant_id}</p>
              <p>Mode: {credentials.mode || 'sandbox'}</p>
              <p>Has Passphrase: {credentials.passphrase ? 'Yes' : 'No'}</p>
              <p>Notify URL: {window.location.origin.replace('lovableproject.com', 'supabase.co')}/functions/v1/payfast-notify</p>
            </div>
          </div>
        )}

        {/* Test & Save Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleTestPayment}
            disabled={testLoading || !credentials.merchant_id || !credentials.merchant_key}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testLoading ? 'Generating...' : 'Test Payment Link'}
          </Button>
          
          <Button 
            onClick={onSave}
            disabled={loading}
            className="bg-[#ff6f00] hover:bg-[#e65100] w-full sm:w-auto"
          >
            {loading ? 'Saving...' : 'Save PayFast Settings'}
          </Button>
        </div>

        {/* Help Links */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Need Help?</h4>
          <div className="space-y-2">
            <a
              href="https://developers.payfast.co.za/documentation/#integration-information"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              PayFast Integration Guide
            </a>
            <br />
            <a
              href="https://www.payfast.co.za/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              PayFast Dashboard
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayFastCredentialsTab;

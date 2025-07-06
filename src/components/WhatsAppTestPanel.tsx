
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ZokoService } from '@/utils/zokoService';

const WhatsAppTestPanel = () => {
  const [testPhone, setTestPhone] = useState('');
  const [testName, setTestName] = useState('');
  const [testAmount, setTestAmount] = useState('100.00');
  const [testInvoiceId, setTestInvoiceId] = useState('test-' + Date.now());
  const [testing, setTesting] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleTest = async () => {
    if (!testPhone || !testName) {
      toast.error('Phone number and name are required for testing');
      return;
    }

    setTesting(true);
    setLastResult(null);

    try {
      console.log('=== WhatsApp Test Started ===');
      const result = await ZokoService.sendInvoiceMessage(
        testPhone,
        testName,
        `R${testAmount}`,
        testInvoiceId
      );

      setLastResult(result);
      
      if (result.success) {
        toast.success('Test WhatsApp message sent successfully! 🎉');
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test error:', error);
      setLastResult({ success: false, error: error.message });
      toast.error(`Test error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>WhatsApp Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="testPhone">Test Phone Number</Label>
            <Input
              id="testPhone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="+27821234567"
            />
          </div>
          
          <div>
            <Label htmlFor="testName">Test Client Name</Label>
            <Input
              id="testName"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Test Client"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="testAmount">Test Amount</Label>
            <Input
              id="testAmount"
              value={testAmount}
              onChange={(e) => setTestAmount(e.target.value)}
              placeholder="100.00"
            />
          </div>
          
          <div>
            <Label htmlFor="testInvoiceId">Test Invoice ID</Label>
            <Input
              id="testInvoiceId"
              value={testInvoiceId}
              onChange={(e) => setTestInvoiceId(e.target.value)}
              placeholder="test-invoice-id"
            />
          </div>
        </div>

        <Button 
          onClick={handleTest} 
          disabled={testing}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {testing ? 'Sending Test Message...' : 'Send Test WhatsApp Message'}
        </Button>

        {lastResult && (
          <div className="mt-4">
            <Label>Last Test Result:</Label>
            <Textarea
              value={JSON.stringify(lastResult, null, 2)}
              readOnly
              className="mt-2 font-mono text-sm"
              rows={8}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppTestPanel;


import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Truck } from 'lucide-react';

interface DeliveryFormProps {
  productTitle: string;
  invoiceLink?: string;
  whatsappNumber: string;
  onSubmit?: (deliveryMethod: string, deliveryAddress: string) => void;
}

const DeliveryForm = ({ productTitle, invoiceLink, whatsappNumber, onSubmit }: DeliveryFormProps) => {
  const [deliveryMethod, setDeliveryMethod] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  const deliveryOptions = [
    { value: 'pickup', label: 'Local Pickup' },
    { value: 'courier', label: 'Courier Guy' },
    { value: 'pargo', label: 'Pargo' },
    { value: 'door-to-door', label: 'Door-to-Door Delivery' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = () => {
    if (!deliveryMethod || !customerName) return;

    const message = `Hi, I'd like to order ${productTitle}.

Customer Details:
Name: ${customerName}
${customerEmail ? `Email: ${customerEmail}` : ''}
${customerPhone ? `Phone: ${customerPhone}` : ''}

Delivery: ${deliveryOptions.find(opt => opt.value === deliveryMethod)?.label || deliveryMethod}
${deliveryAddress ? `Address: ${deliveryAddress}` : ''}

${invoiceLink ? `Here's my invoice: ${invoiceLink}` : ''}`;

    const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    if (onSubmit) {
      onSubmit(deliveryMethod, deliveryAddress);
    }
  };

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Order Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
              Full Name *
            </Label>
            <Input
              id="customerName"
              placeholder="Enter your full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <Input
              id="customerEmail"
              type="email"
              placeholder="Enter your email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
              Phone Number
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="Enter your phone number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2">
            Select Delivery Method *
          </Label>
          <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Choose delivery method" />
            </SelectTrigger>
            <SelectContent>
              {deliveryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deliveryAddress" className="text-sm font-medium text-gray-700 mb-2">
            Delivery Address / Notes
          </Label>
          <Textarea
            id="deliveryAddress"
            placeholder="Enter your delivery address or special instructions..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!deliveryMethod || !customerName}
          className="w-full bg-[#4C9F70] hover:bg-[#3d8159] text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Send Order via WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
};

export default DeliveryForm;

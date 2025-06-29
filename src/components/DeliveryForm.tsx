
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  const deliveryOptions = [
    { value: 'pickup', label: 'Local Pickup' },
    { value: 'courier', label: 'Courier Guy' },
    { value: 'pargo', label: 'Pargo' },
    { value: 'door-to-door', label: 'Door-to-Door Delivery' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = () => {
    if (!deliveryMethod) return;

    const message = `Hi, I'd like to order ${productTitle}.
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
          Delivery Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Delivery Method *
          </label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Address / Notes
          </label>
          <Textarea
            placeholder="Enter your delivery address or special instructions..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!deliveryMethod}
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

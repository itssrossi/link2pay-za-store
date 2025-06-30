
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface InvoiceStatusDropdownProps {
  invoiceId: string;
  currentStatus: string;
  clientName: string;
  invoiceNumber: string;
  clientPhone?: string;
  onStatusChange?: (newStatus: string) => void;
}

const InvoiceStatusDropdown = ({ 
  invoiceId, 
  currentStatus, 
  clientName, 
  invoiceNumber, 
  clientPhone,
  onStatusChange 
}: InvoiceStatusDropdownProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsUpdating(true);
    
    try {
      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      // Send WhatsApp confirmation if status changed to "paid"
      if (currentStatus !== 'paid' && newStatus === 'paid' && clientPhone) {
        await sendPaymentConfirmation(clientName, invoiceNumber, clientPhone);
      }

      toast.success(`Invoice status updated to ${newStatus}`);
      onStatusChange?.(newStatus);

    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    } finally {
      setIsUpdating(false);
    }
  };

  const sendPaymentConfirmation = async (clientName: string, invoiceNumber: string, phone: string) => {
    try {
      const response = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: phone,
          clientName: clientName,
          amount: 'PAID',
          invoiceId: invoiceNumber,
          messageType: 'payment_confirmation'
        }
      });

      if (response.error) {
        console.error('WhatsApp confirmation error:', response.error);
        toast.error('Status updated but WhatsApp confirmation failed');
      } else {
        toast.success('Payment confirmation sent via WhatsApp!');
      }
    } catch (error) {
      console.error('Error sending WhatsApp confirmation:', error);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="paid">Paid</SelectItem>
        <SelectItem value="cancelled">Cancelled</SelectItem>
        <SelectItem value="overdue">Overdue</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default InvoiceStatusDropdown;

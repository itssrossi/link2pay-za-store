
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
      console.log('Updating invoice status:', {
        invoiceId,
        currentStatus,
        newStatus,
        clientPhone,
        clientName,
        invoiceNumber
      });

      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;

      // Send WhatsApp confirmation if status changed to "paid"
      if (currentStatus !== 'paid' && newStatus === 'paid' && clientPhone) {
        console.log('Invoice marked as paid, sending WhatsApp confirmation...');
        
        try {
          await sendPaymentConfirmation(clientName, invoiceNumber, clientPhone);
        } catch (whatsappError) {
          console.error('WhatsApp confirmation failed:', whatsappError);
          // Don't fail the status update if WhatsApp fails
          toast.error('Invoice updated but WhatsApp confirmation failed');
        }
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
    console.log('Calling WhatsApp edge function for payment confirmation:', {
      phone,
      clientName,
      invoiceNumber,
      messageType: 'payment_confirmation'
    });

    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        phone: phone,
        clientName: clientName,
        amount: 'PAID',
        invoiceId: invoiceNumber,
        messageType: 'payment_confirmation'
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`WhatsApp function error: ${error.message}`);
    }

    if (!data?.success) {
      console.error('WhatsApp send failed:', data?.error);
      throw new Error(`WhatsApp send failed: ${data?.error || 'Unknown error'}`);
    }

    console.log('WhatsApp payment confirmation sent successfully:', data);
    toast.success('Payment confirmation sent via WhatsApp! 🎉');
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

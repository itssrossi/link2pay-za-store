
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
import { ZokoService } from '@/utils/zokoService';

interface InvoiceStatusDropdownProps {
  invoiceId: string;
  currentStatus: string;
  clientName: string;
  invoiceNumber: string;
  clientPhone?: string;
  totalAmount?: number;
  whatsappPaidSent?: boolean;
  onStatusChange?: (newStatus: string) => void;
}

const InvoiceStatusDropdown = ({ 
  invoiceId, 
  currentStatus, 
  clientName, 
  invoiceNumber, 
  clientPhone,
  totalAmount,
  whatsappPaidSent = false,
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
        invoiceNumber,
        totalAmount,
        whatsappPaidSent
      });

      // Prepare update data
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // If changing to paid and WhatsApp confirmation hasn't been sent yet
      const shouldSendPaymentConfirmation = 
        currentStatus !== 'paid' && 
        newStatus === 'paid' && 
        clientPhone && 
        !whatsappPaidSent;

      if (shouldSendPaymentConfirmation) {
        updateData.whatsapp_paid_sent = true;
      }

      // Update invoice status
      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) throw error;

      // Send WhatsApp confirmation if status changed to "paid" and not sent before
      if (shouldSendPaymentConfirmation) {
        console.log('Invoice marked as paid, sending WhatsApp confirmation...');
        
        try {
          const result = await ZokoService.sendPaymentConfirmation(
            clientPhone,
            clientName,
            invoiceNumber,
            totalAmount ? `R${totalAmount.toFixed(2)}` : undefined
          );

          if (result.success) {
            toast.success('Payment confirmation sent via WhatsApp! 🎉');
          } else {
            console.error('WhatsApp confirmation failed:', result.error);
            toast.error('Invoice updated but WhatsApp confirmation failed');
            
            // Revert the whatsapp_paid_sent flag if sending failed
            await supabase
              .from('invoices')
              .update({ whatsapp_paid_sent: false })
              .eq('id', invoiceId);
          }
        } catch (whatsappError) {
          console.error('WhatsApp confirmation failed:', whatsappError);
          toast.error('Invoice updated but WhatsApp confirmation failed');
          
          // Revert the whatsapp_paid_sent flag if sending failed
          await supabase
            .from('invoices')
            .update({ whatsapp_paid_sent: false })
            .eq('id', invoiceId);
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

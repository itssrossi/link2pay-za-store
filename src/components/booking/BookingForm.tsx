import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BookingConfirmationModal } from './BookingConfirmationModal';
import { createWhatsAppLink, formatPhoneForWhatsApp } from '@/utils/phoneFormatter';
interface BookingFormProps {
  userId: string;
  selectedDate: Date;
  selectedTime: string;
  onBookingComplete: () => void;
  onCancel: () => void;
}

interface BookingData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
}

const BookingForm = ({ userId, selectedDate, selectedTime, onBookingComplete, onCancel }: BookingFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<BookingData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [confirmationStoreLocation, setConfirmationStoreLocation] = useState<string | undefined>(undefined);

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.customerEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create the booking (no select to avoid SELECT RLS)
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          notes: formData.notes,
          status: 'confirmed'
        });

      if (bookingError) {
        console.error('Error creating booking:', bookingError);
        toast({
          title: "Error",
          description: bookingError?.message ?? "Failed to create booking. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update the time slot to mark it as booked via Edge Function (bypasses RLS)
      const { error: markError } = await supabase.functions.invoke('mark-time-slot', {
        body: {
          userId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeSlot: selectedTime,
        },
      });

      if (markError) {
        console.error('Error marking time slot:', markError);
        toast({
          title: 'Warning',
          description: 'Booking created but time slot may still appear available.',
          variant: 'destructive',
        });
      }

      // Get business profile for WhatsApp message and modal
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, whatsapp_number, store_address, store_location')
        .eq('id', userId)
        .maybeSingle();

      setBusinessProfile(profile);
      setConfirmationStoreLocation(profile?.store_address || profile?.store_location);
      
      // Attempt to open WhatsApp immediately (fallback on modal close if blocked)
      if (profile?.whatsapp_number) {
        const bookingDate = format(selectedDate, 'dd MMMM yyyy');
        const phoneDisplay = formData.customerPhone ? `+${formatPhoneForWhatsApp(formData.customerPhone)}` : '';
        const message = `📅 New Booking Received!\n\nName: ${formData.customerName}\nDate: ${bookingDate}\nTime: ${selectedTime}\nPhone: ${phoneDisplay}\nEmail: ${formData.customerEmail}${formData.notes ? `\nNotes: ${formData.notes}` : ''}\n\nPlease send through the invoice.`;
        const whatsappLink = createWhatsAppLink(profile.whatsapp_number, message);
        const win = window.open(whatsappLink, '_blank');
        if (!win) {
          // Popup blocked – ignore here; fallback will redirect on modal close
        } else {
          setWhatsappSent(true);
        }
      }

      // Show confirmation modal
      setShowConfirmationModal(true);

      toast({
        title: "Success",
        description: "Booking confirmed successfully!",
      });

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');

  const handleCloseModal = () => {
    setShowConfirmationModal(false);
    
    // Send WhatsApp message after modal is closed (if it wasn't already opened)
    if (!whatsappSent && businessProfile?.whatsapp_number) {
      const bookingDate = format(selectedDate, 'dd MMMM yyyy');
      const phoneDisplay = formData.customerPhone ? `+${formatPhoneForWhatsApp(formData.customerPhone)}` : '';
      const message = `📅 New Booking Received!\n\nName: ${formData.customerName}\nDate: ${bookingDate}\nTime: ${selectedTime}\nPhone: ${phoneDisplay}\nEmail: ${formData.customerEmail}${formData.notes ? `\nNotes: ${formData.notes}` : ''}\n\nPlease send through the invoice.`;
      const whatsappLink = createWhatsAppLink(businessProfile.whatsapp_number, message);
      const win = window.open(whatsappLink, '_blank');
      if (!win) {
        // Popup blocked – perform a full-page redirect as fallback
        window.location.href = whatsappLink;
        setWhatsappSent(true);
      } else {
        setWhatsappSent(true);
      }
    }
    
    onBookingComplete();
  };

  return (
    <>
      <BookingConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseModal}
        bookingData={{
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          notes: formData.notes
        }}
        storeLocation={confirmationStoreLocation}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Book Your Appointment</CardTitle>
          <p className="text-sm text-muted-foreground">
            {formattedDate} at {selectedTime}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requests or information..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default BookingForm;
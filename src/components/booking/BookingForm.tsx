import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

const BookingForm: React.FC<BookingFormProps> = ({
  userId,
  selectedDate,
  selectedTime,
  onBookingComplete,
  onCancel
}) => {
  const [formData, setFormData] = useState<BookingData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof BookingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.customerName.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!formData.customerEmail.trim()) {
      toast.error('Please enter your email address');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create the booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_phone: formData.customerPhone || null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          booking_time: selectedTime,
          notes: formData.notes || null,
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create or update the time slot
      const { error: slotError } = await supabase
        .from('booking_time_slots')
        .upsert({
          user_id: userId,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time_slot: selectedTime,
          is_booked: true,
          booking_id: booking.id
        });

      if (slotError) throw slotError;

      // Send notifications
      await sendNotifications(booking);

      // Let the WhatsApp opening handle the success message
      onBookingComplete();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async (booking: any) => {
    try {
      // Get business profile to get WhatsApp number and business name
      const { data: profile } = await supabase
        .from('profiles')
        .select('whatsapp_number, business_name')
        .eq('id', userId)
        .single();

      console.log('Profile data:', profile); // Debug log

      if (profile?.whatsapp_number) {
        // Format phone number for WhatsApp (remove non-digits and ensure it starts with country code)
        let phoneNumber = profile.whatsapp_number.replace(/\D/g, '');
        
        // Add South African country code if not present
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '27' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('27')) {
          phoneNumber = '27' + phoneNumber;
        }

        // Generate WhatsApp message from customer's perspective
        const message = `Hi my name is ${booking.customer_name} I'd like to book for ${format(selectedDate, 'EEEE, MMMM do, yyyy')} at ${booking.booking_time}. My email is ${booking.customer_email}${booking.customer_phone ? ` and my phone number is ${booking.customer_phone}` : ''}${booking.notes ? `. Additional notes: ${booking.notes}` : ''}.`;

        // Open WhatsApp with the message - use window.location.href for better mobile compatibility
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        console.log('Opening WhatsApp URL:', whatsappUrl); // Debug log
        
        // Small delay to ensure booking is saved, then redirect to WhatsApp
        setTimeout(() => {
          try {
            window.location.href = whatsappUrl;
            toast.success('Booking confirmed! Opening WhatsApp to contact the business...');
          } catch (error) {
            console.error('Error opening WhatsApp:', error);
            toast.error(`Booking confirmed! Please manually contact: ${phoneNumber}`);
          }
        }, 1000);
      } else {
        console.log('No WhatsApp number found for store owner'); // Debug log
        toast.error('Store owner has not configured WhatsApp number');
      }

      // Send edge function notifications (keeping existing functionality)
      const { error: whatsappError } = await supabase.functions.invoke('send-booking-notification', {
        body: {
          userId,
          bookingData: {
            customerName: booking.customer_name,
            customerEmail: booking.customer_email,
            customerPhone: booking.customer_phone,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            notes: booking.notes
          }
        }
      });

      if (whatsappError) {
        console.error('WhatsApp notification error:', whatsappError);
      }

      // Send email confirmation to customer
      const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          customerEmail: booking.customer_email,
          bookingData: {
            customerName: booking.customer_name,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            businessName: profile?.business_name || 'Your Business'
          }
        }
      });

      if (emailError) {
        console.error('Email confirmation error:', emailError);
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Book Appointment</CardTitle>
        <p className="text-sm text-muted-foreground">
          {format(selectedDate, 'EEEE, MMMM do')} at {selectedTime}
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
            <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
            <Input
              id="customerPhone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
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
  );
};

export default BookingForm;
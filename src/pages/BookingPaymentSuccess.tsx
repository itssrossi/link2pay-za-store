import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createWhatsAppLink, formatPhoneForWhatsApp } from '@/utils/phoneFormatter';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  booking_date: string;
  booking_time: string;
  status: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  notes?: string;
  user_id: string;
}

interface BusinessProfile {
  business_name: string;
  whatsapp_number?: string;
  store_address?: string;
  store_location?: string;
}

export default function BookingPaymentSuccess() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [whatsappSent, setWhatsappSent] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingStatus();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingStatus = async () => {
    try {
      // Fetch booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch business profile
      const { data: businessData, error: businessError } = await supabase
        .from('profiles')
        .select('business_name, whatsapp_number, store_address, store_location')
        .eq('id', bookingData.user_id)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

    } catch (error) {
      console.error('Error fetching booking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsAppMessage = () => {
    if (!booking || !business?.whatsapp_number) return;

    const bookingDate = format(new Date(booking.booking_date), 'dd MMMM yyyy');
    const phoneDisplay = booking.customer_phone ? `+${formatPhoneForWhatsApp(booking.customer_phone)}` : '';
    const message = `🎉 Payment Confirmed!\n\nBooking Details:\nName: ${booking.customer_name}\nDate: ${bookingDate}\nTime: ${booking.booking_time}\nPhone: ${phoneDisplay}\nEmail: ${booking.customer_email}${booking.notes ? `\nNotes: ${booking.notes}` : ''}\n\nThank you for your payment!`;
    
    const whatsappLink = createWhatsAppLink(business.whatsapp_number, message);
    const win = window.open(whatsappLink, '_blank');
    
    if (!win) {
      window.location.href = whatsappLink;
    }
    setWhatsappSent(true);
  };

  const getStatusBadge = () => {
    if (!booking) return null;
    
    switch (booking.payment_status) {
      case 'paid':
        return <Badge className="bg-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Payment Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Payment Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Payment Failed</Badge>;
      default:
        return <Badge variant="outline">{booking.payment_status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Checking payment status...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!bookingId || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Booking Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We couldn't find the booking you're looking for.
            </p>
            <Button asChild className="w-full">
              <Link to="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formattedDate = format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {booking.payment_status === 'paid' ? (
              <CheckCircle className="h-12 w-12 text-green-600" />
            ) : booking.payment_status === 'pending' ? (
              <Clock className="h-12 w-12 text-yellow-600" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600" />
            )}
          </div>
          <CardTitle>
            {booking.payment_status === 'paid' ? 'Payment Successful!' :
             booking.payment_status === 'pending' ? 'Payment Processing' :
             'Payment Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {getStatusBadge()}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Booking:</span>
              <span>{booking.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time:</span>
              <span>{booking.booking_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount:</span>
              <span>R{booking.amount_due.toFixed(2)}</span>
            </div>
            {business && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Business:</span>
                <span>{business.business_name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {booking.payment_status === 'paid' && business?.whatsapp_number && (
              <Button 
                onClick={sendWhatsAppMessage}
                className="w-full flex items-center gap-2"
                disabled={whatsappSent}
              >
                <MessageCircle className="h-4 w-4" />
                {whatsappSent ? 'WhatsApp Opened' : 'Contact Business'}
              </Button>
            )}
            
            {booking.payment_status === 'failed' && (
              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Try Payment Again
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return Home</Link>
            </Button>
          </div>

          {booking.payment_status === 'paid' && (
            <div className="text-center text-sm text-muted-foreground">
              Your booking has been confirmed. The business will contact you shortly.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
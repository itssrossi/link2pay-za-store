import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BookingDetails {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string;
  amount_due: number;
  user_id: string;
}

interface BusinessProfile {
  business_name: string;
}

export default function BookingPaymentCancelled() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      // Fetch booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('id, customer_name, booking_date, booking_time, amount_due, user_id')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch business profile
      const { data: businessData, error: businessError } = await supabase
        .from('profiles')
        .select('business_name')
        .eq('id', bookingData.user_id)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    if (!booking) return;
    
    setRetryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('payfast-booking-payment', {
        body: {
          bookingId: booking.id,
          amount: booking.amount_due,
          customerName: booking.customer_name,
          customerEmail: '', // We don't have email in this minimal fetch
        },
      });

      if (error) throw error;

      if (data.payment_url) {
        window.location.href = data.payment_url;
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
    } finally {
      setRetryLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
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
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle>Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your payment was cancelled. Your booking is still pending payment.
          </p>

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
            <Button 
              onClick={retryPayment}
              disabled={retryLoading}
              className="w-full flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {retryLoading ? 'Processing...' : 'Try Payment Again'}
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Return Home</Link>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Note: Your time slot is temporarily reserved while payment is pending.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
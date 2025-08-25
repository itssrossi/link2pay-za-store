import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface BookingPaymentProps {
  bookingId: string;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

interface BookingDetails {
  id: string;
  customer_name: string;
  customer_email: string;
  booking_date: string;
  booking_time: string;
  payment_status: string;
  amount_due: number;
  amount_paid: number;
  payfast_payment_id?: string;
  product_ids?: string[];
  user_id: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
}

interface MerchantProfile {
  business_name: string;
  payfast_merchant_id?: string;
  payfast_merchant_key?: string;
}

export function BookingPayment({ bookingId, onPaymentComplete, onCancel }: BookingPaymentProps) {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      // Fetch booking details
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;
      setBooking(bookingData);

      // Fetch merchant profile
      const { data: merchantData, error: merchantError } = await supabase
        .from('profiles')
        .select('business_name, payfast_merchant_id, payfast_merchant_key')
        .eq('id', bookingData.user_id)
        .single();

      if (merchantError) throw merchantError;
      setMerchant(merchantData);

      // Fetch products if product_ids exist
      if (bookingData.product_ids && bookingData.product_ids.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, title, price')
          .in('id', bookingData.product_ids);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !merchant) return;

    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('payfast-booking-payment', {
        body: {
          bookingId: booking.id,
          amount: booking.amount_due,
          customerName: booking.customer_name,
          customerEmail: booking.customer_email,
        },
      });

      if (error) throw error;

      if (data.payment_url) {
        // Redirect to PayFast payment page
        window.location.href = data.payment_url;
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'paid':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Paid</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
      case 'not_required':
        return <Badge variant="outline">No Payment Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading booking details...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!booking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Booking not found</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const formattedDate = format(new Date(booking.booking_date), 'EEEE, MMMM d, yyyy');
  const balanceRemaining = booking.amount_due - booking.amount_paid;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Booking Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Customer:</span>
              <p>{booking.customer_name}</p>
            </div>
            <div>
              <span className="font-medium">Date & Time:</span>
              <p>{formattedDate}</p>
              <p>{booking.booking_time}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-medium">Payment Status:</span>
            {getPaymentStatusBadge(booking.payment_status)}
          </div>
        </div>

        {/* Products/Services */}
        {products.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Services:</h4>
            <div className="space-y-1">
              {products.map((product) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>{product.title}</span>
                  <span>R{product.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">R{booking.amount_due.toFixed(2)}</span>
          </div>
          {booking.amount_paid > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Amount Paid:</span>
              <span>R{booking.amount_paid.toFixed(2)}</span>
            </div>
          )}
          {balanceRemaining > 0 && (
            <div className="flex justify-between font-medium">
              <span>Balance Due:</span>
              <span>R{balanceRemaining.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Payment Actions */}
        <div className="flex gap-3">
          {booking.payment_status === 'pending' && balanceRemaining > 0 && (
            <Button 
              onClick={handlePayment}
              disabled={paymentLoading}
              className="flex-1"
            >
              {paymentLoading ? 'Processing...' : `Pay Now - R${balanceRemaining.toFixed(2)}`}
            </Button>
          )}
          
          {booking.payment_status === 'failed' && (
            <Button 
              onClick={handlePayment}
              disabled={paymentLoading}
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {paymentLoading ? 'Processing...' : 'Retry Payment'}
            </Button>
          )}

          {booking.payment_status === 'paid' && (
            <Button 
              onClick={onPaymentComplete}
              className="flex-1"
            >
              Continue to WhatsApp
            </Button>
          )}

          <Button 
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
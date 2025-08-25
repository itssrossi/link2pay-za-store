import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingPaymentRequest {
  bookingId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId, amount, customerName, customerEmail } = await req.json() as BookingPaymentRequest;

    console.log('Processing booking payment request:', { bookingId, amount, customerName, customerEmail });

    // Fetch booking details to get user_id
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, payment_status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch merchant PayFast settings
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
      .eq('id', booking.user_id)
      .single();

    if (profileError || !profile?.payfast_merchant_id || !profile?.payfast_merchant_key) {
      console.error('PayFast settings not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Payment settings not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique payment ID
    const paymentId = `booking_${bookingId}_${Date.now()}`;

    // PayFast payment data
    const paymentData = {
      merchant_id: profile.payfast_merchant_id,
      merchant_key: profile.payfast_merchant_key,
      return_url: `https://mpzqlidtvlbijloeusuj.lovable.app/booking-payment-success?booking_id=${bookingId}`,
      cancel_url: `https://mpzqlidtvlbijloeusuj.lovable.app/booking-payment-cancelled?booking_id=${bookingId}`,
      notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payfast-booking-itn`,
      name_first: customerName.split(' ')[0] || customerName,
      name_last: customerName.split(' ').slice(1).join(' ') || '',
      email_address: customerEmail,
      m_payment_id: paymentId,
      amount: amount.toFixed(2),
      item_name: `Booking Payment - ${customerName}`,
      item_description: `Payment for booking on ${new Date().toLocaleDateString()}`,
      custom_str1: booking.user_id,
      custom_str2: bookingId,
      custom_str3: 'booking_payment',
    };

    // Generate signature for PayFast using same method as ITN handler
    const generateSignature = (data: Record<string, any>, passphrase?: string) => {
      // Create parameter string using same logic as ITN handler
      let paramString = '';
      const sortedKeys = Object.keys(data).sort();
      
      for (const key of sortedKeys) {
        if (data[key] !== '' && data[key] !== null && data[key] !== undefined) {
          paramString += `${key}=${encodeURIComponent(data[key])}&`;
        }
      }
      
      // Remove last ampersand
      paramString = paramString.slice(0, -1);
      
      // Add passphrase if provided
      if (passphrase) {
        paramString += `&passphrase=${encodeURIComponent(passphrase)}`;
      }
      
      console.log('Parameter string for signature:', paramString);
      
      // Generate MD5 hash using Deno's MD5 like ITN handler
      const md5 = new Md5();
      md5.update(paramString);
      const signature = md5.toString();
      
      console.log('Generated signature:', signature);
      return signature;
    };

    const signature = generateSignature(paymentData, profile.payfast_passphrase || undefined);
    const paymentDataWithSignature = { ...paymentData, signature };

    // Update booking with payment ID
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payfast_payment_id: paymentId,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
    }

    // Create booking transaction record
    const { error: transactionError } = await supabase
      .from('booking_transactions')
      .insert({
        booking_id: bookingId,
        user_id: booking.user_id,
        transaction_type: 'full',
        amount: amount,
        status: 'pending',
        payfast_payment_id: paymentId,
        payfast_data: paymentDataWithSignature,
      });

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
    }

    // Generate PayFast payment URL
    const formParams = new URLSearchParams();
    Object.entries(paymentDataWithSignature).forEach(([key, value]) => {
      formParams.append(key, String(value));
    });

    const paymentUrl = `https://www.payfast.co.za/eng/process?${formParams.toString()}`;

    console.log('Generated PayFast payment URL for booking:', bookingId);

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: paymentUrl,
        payment_id: paymentId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing booking payment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
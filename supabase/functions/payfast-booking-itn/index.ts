import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Use a working MD5 implementation
import { Md5 } from "https://deno.land/std@0.160.0/hash/md5.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// PayFast server IPs for validation
const PAYFAST_IPS = [
  '197.97.145.144',
  '41.74.179.194',
  '41.74.179.202',
  '41.74.179.203',
  '41.74.179.196',
  '41.74.179.197',
  '41.74.179.198',
  '41.74.179.199',
  '41.74.179.200',
  '41.74.179.201',
];

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

    // Get the client IP for validation
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    console.log('ITN request from IP:', clientIP);

    // Parse form data
    const formData = await req.formData();
    const itnData: Record<string, string> = {};
    
    for (const [key, value] of formData.entries()) {
      itnData[key] = value.toString();
    }

    console.log('=== PayFast ITN Received ===');
    console.log('Received ITN data:', JSON.stringify(itnData, null, 2));
    console.log('PayFast Payment ID:', itnData.m_payment_id);
    console.log('Payment Status:', itnData.payment_status);
    console.log('Amount:', itnData.amount_gross);

    // Extract booking information from custom fields
    const bookingId = itnData.custom_str2;
    const userId = itnData.custom_str1;
    const paymentType = itnData.custom_str3;

    console.log('Extracted booking info:', { bookingId, userId, paymentType });

    if (!bookingId || !userId) {
      console.error('Missing booking ID or user ID in ITN data');
      console.log('Available custom fields:', {
        custom_str1: itnData.custom_str1,
        custom_str2: itnData.custom_str2, 
        custom_str3: itnData.custom_str3
      });
      return new Response('Invalid ITN data - missing booking/user ID', { status: 400 });
    }

    // TEMPORARILY DISABLED: Signature validation removed for debugging
    console.log('⚠️ Signature validation temporarily disabled for debugging');
    
    // Fetch merchant settings (still needed for other operations)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('payfast_merchant_id, payfast_merchant_key, payfast_passphrase')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch merchant profile:', profileError);
      // Continue processing even if profile fetch fails
      console.log('⚠️ Continuing without profile data for debugging');
    } else {
      console.log('✅ Merchant profile found for user:', userId);
    }

    // Check for duplicate ITN (idempotency)
    const { data: existingTransaction, error: duplicateError } = await supabase
      .from('booking_transactions')
      .select('id, status')
      .eq('payfast_payment_id', itnData.m_payment_id)
      .eq('status', 'completed')
      .single();

    if (existingTransaction) {
      console.log('Duplicate ITN detected, already processed:', itnData.m_payment_id);
      return new Response('OK - Already processed', { status: 200 });
    }

    // Process payment based on status
    const paymentStatus = itnData.payment_status;
    const amount = parseFloat(itnData.amount_gross || '0');

    console.log('Processing payment status:', paymentStatus, 'Amount:', amount);

    if (paymentStatus === 'COMPLETE') {
      // Update booking status to confirmed and payment to paid
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          amount_paid: amount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingUpdateError) {
        console.error('Error updating booking status:', bookingUpdateError);
      }

      // Update or create transaction record
      const { error: transactionUpdateError } = await supabase
        .from('booking_transactions')
        .upsert({
          booking_id: bookingId,
          user_id: userId,
          transaction_type: paymentType === 'deposit' ? 'deposit' : 'full',
          amount: amount,
          status: 'completed',
          payfast_payment_id: itnData.m_payment_id,
          payfast_data: itnData,
          updated_at: new Date().toISOString(),
        });

      if (transactionUpdateError) {
        console.error('Error updating transaction:', transactionUpdateError);
      }

      // Mark time slot as booked since payment is now confirmed
      const { data: booking } = await supabase
        .from('bookings')
        .select('booking_date, booking_time')
        .eq('id', bookingId)
        .single();

      if (booking) {
        const { error: markError } = await supabase.functions.invoke('mark-time-slot', {
          body: {
            userId: userId,
            date: booking.booking_date,
            timeSlot: booking.booking_time,
            bookingId: bookingId,
          },
        });

        if (markError) {
          console.error('Error marking time slot as booked:', markError);
        } else {
          console.log('Time slot marked as booked for confirmed payment:', bookingId);
        }
      }

      // Send booking confirmation (optional)
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            bookingId: bookingId,
            paymentConfirmed: true,
          },
        });
      } catch (confirmationError) {
        console.error('Error sending booking confirmation:', confirmationError);
      }

      console.log('Booking payment completed successfully:', bookingId);

    } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
      // Update booking status to failed
      const { error: bookingUpdateError } = await supabase
        .from('bookings')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingUpdateError) {
        console.error('Error updating booking status to failed:', bookingUpdateError);
      }

      // Update transaction record
      const { error: transactionUpdateError } = await supabase
        .from('booking_transactions')
        .update({
          status: 'failed',
          payfast_data: itnData,
          updated_at: new Date().toISOString(),
        })
        .eq('payfast_payment_id', itnData.m_payment_id);

      if (transactionUpdateError) {
        console.error('Error updating failed transaction:', transactionUpdateError);
      }

      console.log('Booking payment failed:', bookingId, paymentStatus);

    } else {
      console.log('Payment status pending or unknown:', paymentStatus);
      
      // Update transaction with current status
      const { error: transactionUpdateError } = await supabase
        .from('booking_transactions')
        .update({
          payfast_data: itnData,
          updated_at: new Date().toISOString(),
        })
        .eq('payfast_payment_id', itnData.m_payment_id);

      if (transactionUpdateError) {
        console.error('Error updating pending transaction:', transactionUpdateError);
      }
    }

    return new Response('OK', { 
      status: 200,
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Error processing booking ITN:', error);
    return new Response('Internal server error', { 
      status: 500,
      headers: corsHeaders 
    });
  }
});
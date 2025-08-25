import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { bookingId } = await req.json();

    console.log('=== Booking Payment Fallback Confirmation ===');
    console.log('Booking ID:', bookingId);

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(JSON.stringify({ error: 'Booking not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Current booking status:', booking.status);
    console.log('Current payment status:', booking.payment_status);

    // Check if already confirmed to prevent duplicate processing
    if (booking.payment_status === 'paid' && booking.status === 'confirmed') {
      console.log('✅ Booking already confirmed, no action needed');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Booking already confirmed',
        booking 
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update booking status to confirmed and payment to paid
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_status: 'paid',
        amount_paid: booking.amount_due,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update booking' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('✅ Booking updated successfully');

    // Mark the time slot as booked
    try {
      const markSlotResponse = await supabase.functions.invoke('mark-time-slot', {
        body: {
          userId: booking.user_id,
          date: booking.booking_date,
          timeSlot: booking.booking_time,
          bookingId: bookingId
        }
      });

      if (markSlotResponse.error) {
        console.error('Failed to mark time slot:', markSlotResponse.error);
        // Continue processing even if time slot marking fails
      } else {
        console.log('✅ Time slot marked as booked');
      }
    } catch (slotError) {
      console.error('Error marking time slot:', slotError);
      // Continue processing even if time slot marking fails
    }

    // Send booking confirmation notification
    try {
      const confirmationResponse = await supabase.functions.invoke('send-booking-confirmation', {
        body: {
          bookingId: bookingId,
          paymentConfirmed: true
        }
      });

      if (confirmationResponse.error) {
        console.error('Failed to send booking confirmation:', confirmationResponse.error);
        // Continue processing even if notification fails
      } else {
        console.log('✅ Booking confirmation sent');
      }
    } catch (notificationError) {
      console.error('Error sending booking confirmation:', notificationError);
      // Continue processing even if notification fails
    }

    console.log('=== Fallback confirmation completed successfully ===');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Booking confirmed successfully',
      booking: updatedBooking
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in confirm-booking-payment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
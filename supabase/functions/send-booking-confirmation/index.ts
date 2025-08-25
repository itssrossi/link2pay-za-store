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

    const { bookingId, paymentConfirmed = false } = await req.json();

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, profiles!bookings_user_id_fkey(business_name, whatsapp_number)')
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!booking.profiles?.whatsapp_number) {
      return new Response(JSON.stringify({ success: true, message: 'No WhatsApp configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const message = `🎉 New Booking Confirmation\n\n📅 ${new Date(booking.booking_date).toLocaleDateString()}\n⏰ ${booking.booking_time}\n👤 ${booking.customer_name}\n${paymentConfirmed ? '✅ Payment confirmed' : '⏳ Payment pending'}`;

    await supabase.functions.invoke('send-whatsapp', {
      body: { to: booking.profiles.whatsapp_number, message }
    });

    return new Response(JSON.stringify({ success: true }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
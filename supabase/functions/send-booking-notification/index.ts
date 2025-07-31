import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingNotificationRequest {
  userId: string;
  bookingData: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    bookingDate: string;
    bookingTime: string;
    notes?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { userId, bookingData }: BookingNotificationRequest = await req.json();

    // Get user's profile and WhatsApp settings
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('business_name, whatsapp_number')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile.whatsapp_number) {
      console.log('No WhatsApp number configured for user');
      return new Response(
        JSON.stringify({ success: true, message: 'No WhatsApp number configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the booking notification message
    const message = `🗓️ *New Booking Alert!*

*Customer:* ${bookingData.customerName}
*Email:* ${bookingData.customerEmail}
${bookingData.customerPhone ? `*Phone:* ${bookingData.customerPhone}` : ''}
*Date:* ${new Date(bookingData.bookingDate).toLocaleDateString()}
*Time:* ${bookingData.bookingTime}
${bookingData.notes ? `*Notes:* ${bookingData.notes}` : ''}

A new appointment has been booked for your business!`;

    // Send WhatsApp message using existing send-whatsapp function
    const { error: whatsappError } = await supabaseClient.functions.invoke('send-whatsapp', {
      body: {
        phoneNumber: profile.whatsapp_number,
        message: message
      }
    });

    if (whatsappError) {
      console.error('WhatsApp sending error:', whatsappError);
      return new Response(
        JSON.stringify({ error: 'Failed to send WhatsApp notification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Booking notification sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-booking-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
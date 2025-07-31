import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  customerEmail: string;
  bookingData: {
    customerName: string;
    bookingDate: string;
    bookingTime: string;
    businessName: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerEmail, bookingData }: BookingConfirmationRequest = await req.json();

    const formattedDate = new Date(bookingData.bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const emailResponse = await resend.emails.send({
      from: "Booking Confirmation <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `Booking Confirmation - ${formattedDate} at ${bookingData.bookingTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4C9F70; margin-bottom: 20px;">Booking Confirmed! ✅</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #333;">Appointment Details</h2>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${bookingData.bookingTime}</p>
            <p><strong>Business:</strong> ${bookingData.businessName}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #333;">Hi ${bookingData.customerName},</h3>
            <p>Your appointment has been successfully booked! We look forward to seeing you.</p>
            <p>If you need to cancel or reschedule, please contact us as soon as possible.</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
            <p>Thank you for choosing ${bookingData.businessName}!</p>
          </div>
        </div>
      `,
    });

    console.log("Booking confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MarkRequest = {
  userId: string;
  date: string; // yyyy-MM-dd
  timeSlot: string; // HH:mm
  bookingId?: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as MarkRequest;
    if (!body?.userId || !body?.date || !body?.timeSlot) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if the slot exists
    const { data: existing, error: selectError } = await supabase
      .from("booking_time_slots")
      .select("id")
      .eq("user_id", body.userId)
      .eq("date", body.date)
      .eq("time_slot", body.timeSlot)
      .maybeSingle();

    if (selectError) {
      console.error("mark-time-slot: select error", selectError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing slot" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let opError: any = null;

    if (existing?.id) {
      const { error } = await supabase
        .from("booking_time_slots")
        .update({ is_booked: true, booking_id: body.bookingId ?? null })
        .eq("id", existing.id);
      opError = error;
    } else {
      const { error } = await supabase
        .from("booking_time_slots")
        .insert({
          user_id: body.userId,
          date: body.date,
          time_slot: body.timeSlot,
          is_booked: true,
          booking_id: body.bookingId ?? null,
        });
      opError = error;
    }

    if (opError) {
      console.error("mark-time-slot: upsert error", opError);
      return new Response(
        JSON.stringify({ error: "Failed to mark time slot" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("mark-time-slot: exception", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

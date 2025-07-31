import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    console.log(`Simulating trial end for user: ${userId}`);

    // Calculate yesterday's date
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    console.log(`Setting trial end to: ${yesterday.toISOString()}`);

    // Update the profiles table trial_ends_at field
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .update({ trial_ends_at: yesterday.toISOString() })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('Error updating profiles:', profileError);
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Also update subscriptions table if there's a record
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from('subscriptions')
      .update({ trial_end_date: yesterday.toISOString() })
      .eq('user_id', userId)
      .select();

    // Don't throw error if no subscription record exists, it's optional
    if (subscriptionError) {
      console.log('Note: No subscription record found or error updating:', subscriptionError.message);
    }

    console.log('Trial end simulation completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Trial end date updated successfully',
        trial_ends_at: yesterday.toISOString(),
        updated_profile: !!profileData?.length,
        updated_subscription: !!subscriptionData?.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in simulate-trial-end:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
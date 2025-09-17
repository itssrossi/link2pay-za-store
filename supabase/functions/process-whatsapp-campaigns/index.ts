import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppCampaign {
  id: string;
  name: string;
  template_sid: string;
  delay_days: number;
}

interface WhatsAppSubscriber {
  id: string;
  user_id: string;
  campaign_id: string;
  scheduled_at: string;
  campaign: WhatsAppCampaign;
  user: {
    full_name: string;
    whatsapp_number: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting WhatsApp campaign processing...');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all due WhatsApp campaign messages
    const { data: dueSubscribers, error: fetchError } = await supabase
      .from('whatsapp_campaign_subscribers')
      .select(`
        id,
        user_id,
        campaign_id,
        scheduled_at,
        whatsapp_campaigns:campaign_id (
          id,
          name,
          template_sid,
          delay_days
        ),
        profiles:user_id (
          full_name,
          whatsapp_number
        )
      `)
      .eq('status', 'enrolled')
      .is('sent_at', null)
      .lte('scheduled_at', new Date().toISOString())
      .limit(50); // Process in batches

    if (fetchError) {
      console.error('Error fetching due subscribers:', fetchError);
      throw fetchError;
    }

    if (!dueSubscribers || dueSubscribers.length === 0) {
      console.log('No WhatsApp messages due to be sent');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No messages due',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${dueSubscribers.length} WhatsApp messages to send`);

    let successCount = 0;
    let errorCount = 0;

    // Process each due message
    for (const subscriber of dueSubscribers as any[]) {
      try {
        const profile = subscriber.profiles;
        const campaign = subscriber.whatsapp_campaigns;

        if (!profile?.whatsapp_number || !profile?.full_name) {
          console.log(`Skipping subscriber ${subscriber.id}: missing WhatsApp number or name`);
          await logCampaignResult(supabase, subscriber.id, 'failed', {
            error: 'Missing WhatsApp number or full name'
          });
          errorCount++;
          continue;
        }

        // Send WhatsApp message using existing send-whatsapp function
        const { error: sendError } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            phone: profile.whatsapp_number,
            clientName: profile.full_name,
            messageType: 'campaign',
            templateSid: campaign.template_sid,
            campaignName: campaign.name
          }
        });

        if (sendError) {
          console.error(`Failed to send WhatsApp to ${profile.whatsapp_number}:`, sendError);
          await logCampaignResult(supabase, subscriber.id, 'failed', {
            error: sendError.message,
            template_sid: campaign.template_sid
          });
          errorCount++;
        } else {
          console.log(`Successfully sent WhatsApp campaign "${campaign.name}" to ${profile.whatsapp_number}`);
          
          // Mark as sent
          await supabase
            .from('whatsapp_campaign_subscribers')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', subscriber.id);

          await logCampaignResult(supabase, subscriber.id, 'sent', {
            template_sid: campaign.template_sid,
            phone: profile.whatsapp_number
          });
          
          successCount++;
        }

        // Small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.id}:`, error);
        await logCampaignResult(supabase, subscriber.id, 'failed', {
          error: error.message
        });
        errorCount++;
      }
    }

    console.log(`WhatsApp campaign processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({
      success: true,
      processed: successCount + errorCount,
      successful: successCount,
      failed: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in process-whatsapp-campaigns function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

async function logCampaignResult(
  supabase: any,
  subscriberId: string,
  status: string,
  details: any
) {
  try {
    await supabase
      .from('whatsapp_campaign_logs')
      .insert({
        subscriber_id: subscriberId,
        status,
        details
      });
  } catch (error) {
    console.error('Error logging campaign result:', error);
  }
}

serve(handler);
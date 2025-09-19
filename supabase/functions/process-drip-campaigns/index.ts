import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "npm:resend@4.0.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Campaign {
  id: string;
  name: string;
  subject: string;
  template_content: string;
  delay_days: number;
}

interface Subscriber {
  id: string;
  user_id: string;
  campaign_id: string;
  scheduled_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting drip campaign processing...');

    // Get all subscribers with emails due to be sent (scheduled_at <= now and status = 'enrolled')
    const { data: dueSubscribers, error: subscribersError } = await supabase
      .from('email_campaign_subscribers')
      .select(`
        *,
        email_campaigns:campaign_id (
          id,
          name,
          subject,
          template_content,
          delay_days
        )
      `)
      .eq('status', 'enrolled')
      .lte('scheduled_at', new Date().toISOString());

    if (subscribersError) {
      console.error('Error fetching due subscribers:', subscribersError);
      throw subscribersError;
    }

    if (!dueSubscribers || dueSubscribers.length === 0) {
      console.log('No emails due to be sent');
      return new Response(JSON.stringify({ processed: 0, message: 'No emails due' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${dueSubscribers.length} emails to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each due email
    for (const subscriber of dueSubscribers) {
      try {
        // Get user profile data - use maybeSingle() to handle missing profiles gracefully
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, business_name, email')
          .eq('id', subscriber.user_id)
          .maybeSingle();

        if (profileError) {
          console.error(`Error fetching profile for user ${subscriber.user_id}:`, profileError);
          await logCampaignEvent(subscriber.id, 'failed', { error: 'Database error fetching profile' });
          errorCount++;
          continue;
        }

        if (!userProfile) {
          console.log(`Profile not found for user ${subscriber.user_id}, skipping campaign`);
          await logCampaignEvent(subscriber.id, 'skipped', { error: 'Profile not found' });
          errorCount++;
          continue;
        }

        // Skip if user doesn't have an email
        if (!userProfile.email) {
          console.log(`User ${subscriber.user_id} has no email, skipping`);
          await logCampaignEvent(subscriber.id, 'failed', { error: 'No email address' });
          errorCount++;
          continue;
        }

        const campaign = subscriber.email_campaigns as Campaign;
        
        // Personalize email content
        const personalizedContent = personalizeTemplate(
          campaign.template_content,
          userProfile
        );

        // Send email using Resend
        const emailResult = await resend.emails.send({
          from: 'Link2Pay Support <support@link2pay.co.za>',
          to: [userProfile.email],
          subject: campaign.subject,
          html: convertToHTML(personalizedContent),
          text: personalizedContent,
        });

        if (emailResult.error) {
          console.error(`Failed to send email to ${userProfile.email}:`, emailResult.error);
          await updateSubscriberStatus(subscriber.id, 'failed');
          await logCampaignEvent(subscriber.id, 'failed', { error: emailResult.error });
          errorCount++;
        } else {
          console.log(`Successfully sent ${campaign.name} to ${userProfile.email}`);
          await updateSubscriberStatus(subscriber.id, 'sent');
          await logCampaignEvent(subscriber.id, 'sent', { email_id: emailResult.data?.id });
          processedCount++;
        }

      } catch (error) {
        console.error(`Error processing subscriber ${subscriber.id}:`, error);
        await updateSubscriberStatus(subscriber.id, 'failed');
        await logCampaignEvent(subscriber.id, 'failed', { error: error.message });
        errorCount++;
      }
    }

    console.log(`Processed ${processedCount} emails successfully, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      processed: processedCount, 
      errors: errorCount,
      total: dueSubscribers.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in drip campaign processing:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

// Helper function to personalize email template
function personalizeTemplate(template: string, profile: UserProfile): string {
  // Use better fallbacks for missing data
  const displayName = profile.full_name || profile.business_name || 'there';
  const businessName = profile.business_name || profile.full_name || 'your business';
  
  return template
    .replace(/\{\{name\}\}/g, displayName)
    .replace(/\{\{business_name\}\}/g, businessName);
}

// Helper function to convert text to HTML
function convertToHTML(text: string): string {
  return text
    .replace(/\n/g, '<br>')
    .replace(/👉 (https?:\/\/[^\s]+)/g, '<p style="margin: 20px 0;"><a href="$1" style="background: #4C9F70; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Get Started Now →</a></p>')
    .replace(/^(.*?:)$/gm, '<h3 style="color: #333; margin: 20px 0 10px 0;">$1</h3>')
    .replace(/^([1-9]️⃣.*?)$/gm, '<p style="margin: 8px 0; padding-left: 10px;">$1</p>');
}

// Helper function to update subscriber status
async function updateSubscriberStatus(subscriberId: string, status: string) {
  const updateData: any = { status, updated_at: new Date().toISOString() };
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('email_campaign_subscribers')
    .update(updateData)
    .eq('id', subscriberId);

  if (error) {
    console.error(`Error updating subscriber status:`, error);
  }
}

// Helper function to log campaign events
async function logCampaignEvent(subscriberId: string, status: string, details: any = {}) {
  const { error } = await supabase
    .from('email_campaign_logs')
    .insert({
      subscriber_id: subscriberId,
      status,
      details,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error(`Error logging campaign event:`, error);
  }
}

serve(handler);
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "npm:resend@2.0.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserActivity {
  userId: string;
  email: string;
  lastInvoiceAt: Date | null;
  lastDashboardVisit: Date | null;
  tag: "active" | "at_risk" | "dormant";
}

const getEmailContent = (tag: "active" | "at_risk" | "dormant") => {
  const templates = {
    active: {
      subject: "You're crushing it! 🔥",
      html: `
        <h1>🔥 You're in the top 10% of sellers this week! Keep it up 💪</h1>
        <p>Your hard work is paying off. Keep sending those invoices!</p>
        <p>Best regards,<br>The Link2Pay Team</p>
      `
    },
    at_risk: {
      subject: "Your customers might be waiting...",
      html: `
        <h1>Hey 👋 noticed you haven't sent an invoice lately</h1>
        <p>Your customers might be waiting! Send one today and keep the momentum going.</p>
        <p><a href="https://app.link2pay.co.za/invoice/quick-start" style="background: #4C9F70; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Send Invoice Now</a></p>
        <p>Best regards,<br>The Link2Pay Team</p>
      `
    },
    dormant: {
      subject: "We miss you at Link2Pay 😢",
      html: `
        <h1>We miss you 😢 Ready to make another sale?</h1>
        <p>Your store is ready and waiting for you.</p>
        <p><a href="https://app.link2pay.co.za" style="background: #4C9F70; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Log In Now</a></p>
        <p>Best regards,<br>The Link2Pay Team</p>
      `
    }
  };
  
  return templates[tag];
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily retention monitoring...");
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all users who have completed onboarding
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email, last_dashboard_visit, full_name")
      .eq("onboarding_completed", true);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    console.log(`Processing ${users?.length || 0} users...`);

    const stats = {
      processed: 0,
      errors: 0,
      active: 0,
      at_risk: 0,
      dormant: 0
    };

    for (const user of users || []) {
      try {
        // Get last invoice date
        const { data: lastInvoice } = await supabase
          .from("invoices")
          .select("created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const lastInvoiceAt = lastInvoice?.created_at ? new Date(lastInvoice.created_at) : null;
        const lastDashboardVisit = user.last_dashboard_visit ? new Date(user.last_dashboard_visit) : null;

        // Determine tag
        let tag: "active" | "at_risk" | "dormant";
        
        if (lastInvoiceAt && lastInvoiceAt >= sevenDaysAgo) {
          tag = "active";
          stats.active++;
        } else if (lastDashboardVisit && lastDashboardVisit >= sevenDaysAgo) {
          tag = "at_risk";
          stats.at_risk++;
        } else {
          tag = "dormant";
          stats.dormant++;
        }

        console.log(`User ${user.email}: ${tag}`);

        // Upsert user activity
        const { error: activityError } = await supabase
          .from("user_activity")
          .upsert({
            user_id: user.id,
            tag,
            last_invoice_at: lastInvoiceAt?.toISOString(),
            last_dashboard_visit: lastDashboardVisit?.toISOString(),
            tag_updated_at: now.toISOString(),
            updated_at: now.toISOString()
          }, { onConflict: "user_id" });

        if (activityError) {
          console.error(`Error updating activity for ${user.email}:`, activityError);
          throw activityError;
        }

        // Send email
        if (user.email) {
          const emailContent = getEmailContent(tag);
          
          const { error: emailError } = await resend.emails.send({
            from: "Link2Pay <onboarding@resend.dev>",
            to: [user.email],
            subject: emailContent.subject,
            html: emailContent.html
          });

          if (emailError) {
            console.error(`Error sending email to ${user.email}:`, emailError);
            throw emailError;
          }

          // Log notification
          await supabase.from("user_notifications").insert({
            user_id: user.id,
            message_type: tag,
            message_content: emailContent.html,
            sent_at: now.toISOString()
          });

          console.log(`Sent ${tag} email to ${user.email}`);
        }

        stats.processed++;
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        stats.errors++;
      }
    }

    console.log("Retention monitoring complete:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        stats
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error: any) {
    console.error("Error in retention monitoring:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

serve(handler);

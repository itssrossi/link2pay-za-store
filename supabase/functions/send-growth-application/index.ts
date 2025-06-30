

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrowthApplicationRequest {
  businessName: string;
  ownerName: string;
  businessCategory: string;
  businessOffer: string;
  monthlyRevenue: number;
  growthGoals: string;
  businessLocation: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const applicationData: GrowthApplicationRequest = await req.json();

    // Format currency
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    // Create formatted email content
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #4C9F70; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #4C9F70; }
        .field-value { margin-top: 5px; }
        .revenue-highlight { background-color: #f0f8f4; padding: 10px; border-left: 4px solid #4C9F70; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 New Link2Pay Growth Application</h1>
    </div>
    <div class="content">
        <p>A new business has applied for growth services through Link2Pay. Here are the details:</p>
        
        <div class="field">
            <div class="field-label">🏢 Business Name:</div>
            <div class="field-value">${applicationData.businessName}</div>
        </div>
        
        <div class="field">
            <div class="field-label">👤 Owner Name:</div>
            <div class="field-value">${applicationData.ownerName}</div>
        </div>
        
        <div class="field">
            <div class="field-label">📊 Business Category:</div>
            <div class="field-value">${applicationData.businessCategory.charAt(0).toUpperCase() + applicationData.businessCategory.slice(1)}</div>
        </div>
        
        <div class="field">
            <div class="field-label">📍 Business Location:</div>
            <div class="field-value">${applicationData.businessLocation}</div>
        </div>
        
        <div class="field revenue-highlight">
            <div class="field-label">💰 Current Monthly Revenue:</div>
            <div class="field-value"><strong>${formatCurrency(applicationData.monthlyRevenue)}</strong></div>
        </div>
        
        <div class="field">
            <div class="field-label">🛍️ What does your business offer?</div>
            <div class="field-value">${applicationData.businessOffer}</div>
        </div>
        
        <div class="field">
            <div class="field-label">🎯 Growth Goals:</div>
            <div class="field-value">${applicationData.growthGoals}</div>
        </div>
        
        <hr style="margin: 30px 0; border: 1px solid #eee;">
        
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Review the application within 48 hours</li>
            <li>Contact the business owner to discuss growth opportunities</li>
            <li>Assess fit for marketing services and growth programs</li>
        </ul>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This application was submitted through the Link2Pay dashboard growth feature.
        </p>
    </div>
</body>
</html>
    `;

    console.log('Growth Application Received:', {
      businessName: applicationData.businessName,
      ownerName: applicationData.ownerName,
      businessCategory: applicationData.businessCategory,
      businessLocation: applicationData.businessLocation,
      monthlyRevenue: formatCurrency(applicationData.monthlyRevenue),
      businessOffer: applicationData.businessOffer.substring(0, 100) + '...',
      growthGoals: applicationData.growthGoals.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Link2Pay Growth <onboarding@resend.dev>",
      to: ["johnrosspersonal@gmail.com"],
      subject: "New Link2Pay Growth Application",
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Growth application submitted successfully',
        emailId: emailResponse.data?.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing growth application:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);


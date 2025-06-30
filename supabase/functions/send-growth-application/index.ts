
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
  email: string;
  phoneNumber: string;
  businessCategory: string;
  businessOffer: string;
  monthlyRevenue: number;
  growthGoals: string;
  businessLocation: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log(`🚀 Edge Function Called: ${req.method} ${req.url}`);
  console.log('📋 Request Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📥 Reading request body...');
    const requestText = await req.text();
    console.log('📝 Raw request body:', requestText);
    
    let applicationData: GrowthApplicationRequest;
    try {
      applicationData = JSON.parse(requestText);
      console.log('✅ Successfully parsed JSON:', applicationData);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required fields
    const requiredFields = ['businessName', 'ownerName', 'email', 'phoneNumber', 'businessCategory', 'businessOffer', 'monthlyRevenue', 'growthGoals', 'businessLocation'];
    const missingFields = requiredFields.filter(field => !applicationData[field as keyof GrowthApplicationRequest]);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Checking Resend API key...');
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email service configuration error'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    console.log('✅ Resend API key found');

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
        .contact-info { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 New Link2Pay Growth Application</h1>
    </div>
    <div class="content">
        <p>A new business has applied for growth services through Link2Pay. Here are the details:</p>
        
        <div class="contact-info">
            <h3 style="margin-top: 0; color: #4C9F70;">📞 Contact Information</h3>
            <div class="field">
                <div class="field-label">👤 Owner Name:</div>
                <div class="field-value">${applicationData.ownerName}</div>
            </div>
            <div class="field">
                <div class="field-label">📧 Email:</div>
                <div class="field-value"><a href="mailto:${applicationData.email}">${applicationData.email}</a></div>
            </div>
            <div class="field">
                <div class="field-label">📱 Phone:</div>
                <div class="field-value"><a href="tel:${applicationData.phoneNumber}">${applicationData.phoneNumber}</a></div>
            </div>
        </div>
        
        <div class="field">
            <div class="field-label">🏢 Business Name:</div>
            <div class="field-value">${applicationData.businessName}</div>
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
            <li>Contact the business owner via email: <a href="mailto:${applicationData.email}">${applicationData.email}</a></li>
            <li>Or call them at: <a href="tel:${applicationData.phoneNumber}">${applicationData.phoneNumber}</a></li>
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
      email: applicationData.email,
      phoneNumber: applicationData.phoneNumber,
      businessCategory: applicationData.businessCategory,
      businessLocation: applicationData.businessLocation,
      monthlyRevenue: formatCurrency(applicationData.monthlyRevenue),
      businessOffer: applicationData.businessOffer.substring(0, 100) + '...',
      growthGoals: applicationData.growthGoals.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    console.log('📧 Sending email via Resend...');
    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Link2Pay Growth <onboarding@resend.dev>",
      to: ["johnrosspersonal@gmail.com"],
      subject: `New Link2Pay Growth Application - ${applicationData.businessName}`,
      html: emailContent,
    });

    console.log("✅ Email sent successfully:", emailResponse);

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
    console.error('💥 Error processing growth application:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
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

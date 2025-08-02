// Cloudflare Pages Function for handling form submissions
// This function has access to environment variables/secrets at runtime

export interface Env {
  VITE_PUBLIC_ZAPIER_WEBHOOK_URL: string;
}

interface FormSubmissionRequest {
  formData: Record<string, unknown>;
  variantName: string;
  visitorData: Record<string, unknown>;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const body: FormSubmissionRequest = await request.json();
    const { formData, variantName, visitorData } = body;

    // Get the webhook URL from environment variables
    const webhookUrl = env.VITE_PUBLIC_ZAPIER_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('VITE_PUBLIC_ZAPIER_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook URL not configured' }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }

    // Prepare submission data
    const submissionData = {
      // Form data
      ...formData,
      
      // Variant identification
      variant: variantName,
      ab_test_variant: variantName,
      
      // Visitor tracking data
      visitor_data: visitorData,
      
      // Submission metadata
      submission_timestamp: new Date().toISOString(),
      form_version: '2.0'
    };

    // Forward the request to Zapier webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': request.headers.get('User-Agent') || 'Astropal-Cloudflare-Function'
      },
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status: ${response.status}`);
    }

    console.log('Form submitted successfully:', {
      variant: variantName,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Form submitted successfully' }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );

  } catch (error) {
    console.error('Form submission failed:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Form submission failed', 
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
}; 
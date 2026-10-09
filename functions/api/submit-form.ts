// Cloudflare Pages Function for handling form submissions
// This function has access to environment variables/secrets at runtime

import { generateUID } from '../../src/utils/uidGenerator';

export interface Env {
  LEAD_RECEIVER_URL: string;
  LEAD_RECEIVER_TOKEN: string;
}

interface FormSubmissionRequest {
  formData: Record<string, unknown>;
  variantName: string;
  visitorData: Record<string, unknown>;
  page_url?: unknown;
  submission_id?: unknown;
}

function normalizeFields(data: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const fields: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === 'page_url' || key === 'submission_id') continue;
    if (Object.keys(fields).length >= 50 || value === undefined) break;
    if (value !== null && typeof value === 'object') {
      fields[key] = JSON.stringify(value).slice(0, 2000);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      fields[key] = value;
    }
  }

  return fields;
}

async function postToLeadReceiver(
  env: Env,
  request: Request,
  form: string,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!env.LEAD_RECEIVER_URL || !env.LEAD_RECEIVER_TOKEN) {
    console.warn('lead receiver not configured');
    return false;
  }

  const pageUrl = typeof data.page_url === 'string' && data.page_url.startsWith('https://')
    ? data.page_url
    : `https://${new URL(request.url).host}/`;
  const submissionId = typeof data.submission_id === 'string' && /^[0-9a-f-]{36}$/i.test(data.submission_id)
    ? data.submission_id
    : crypto.randomUUID();
  try {
    const response = await fetch(env.LEAD_RECEIVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.LEAD_RECEIVER_TOKEN}`,
        'Idempotency-Key': submissionId
      },
      body: JSON.stringify({
        brand: 'astropal',
        form,
        fields: normalizeFields(data),
        page_url: pageUrl,
        submitted_at: new Date().toISOString(),
        submission_id: submissionId
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.error('lead receiver error', response.status);
    }
    return response.ok;
  } catch {
    console.error('lead receiver error', 'unknown');
    return false;
  }
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
    
    // Log successful submissions only
    console.log('Processing form submission:', {
      action: formData.action || 'registration',
      variantName,
      timestamp: new Date().toISOString()
    });

    // Determine form name based on action
    let form: string;
    const action = formData.action as string;

    if (action === 'unsubscribe') {
      form = 'unsubscribe';
    } else if (action === 'feedback') {
      form = 'feedback';
    } else {
      form = 'signup';
    }

    // Generate UID based on birth location (only for registration)
    let uid: string;
    if (action === 'unsubscribe' || action === 'feedback') {
      // Use provided UID or generate a simple one
      uid = (formData.uid as string) || `${action.toUpperCase()}${Date.now().toString().slice(-6)}`;
    } else {
      uid = generateUID(formData.birthLocation as string || '');
    }

    // Prepare submission data based on action type
    let submissionData: Record<string, unknown>;
    
    if (action === 'feedback') {
      // Enhanced feedback data structure
      submissionData = {
        // Basic form data
        email: formData.email,
        uid: uid,
        action: action,
        
        // Feedback-specific data
        likes_tags: formData.likes_json ? JSON.parse(formData.likes_json as string) : [],
        dislikes_tags: formData.dislikes_json ? JSON.parse(formData.dislikes_json as string) : [],
        like_other_comment: formData.likeOtherComment || '',
        dislike_other_comment: formData.dislikeOtherComment || '',
        
        // Metadata
        likes_count: formData.likes_json ? JSON.parse(formData.likes_json as string).length : 0,
        dislikes_count: formData.dislikes_json ? JSON.parse(formData.dislikes_json as string).length : 0,
        
        // Variant identification
        variant: variantName,
        ab_test_variant: variantName,
        
        // Submission metadata
        submission_timestamp: new Date().toISOString(),
        form_version: '2.1',
        
        // Visitor data (minimal for service pages)
        session_id: visitorData.session_id || null,
        user_agent: visitorData.user_agent || null,
        timezone: visitorData.timezone || null
      };
    } else if (action === 'unsubscribe') {
      // Enhanced unsubscribe data structure
      submissionData = {
        // Basic form data
        email: formData.email,
        uid: uid,
        action: action,
        
        // Unsubscribe-specific data
        reasons_tags: formData.reasons_json ? JSON.parse(formData.reasons_json as string) : [],
        other_comment: formData.otherComment || '',
        
        // UTM tracking data
        utm_source: formData.utm_source || visitorData.utm_source || null,
        utm_medium: formData.utm_medium || visitorData.utm_medium || null,
        utm_campaign: formData.utm_campaign || visitorData.utm_campaign || null,
        
        // Metadata
        reasons_count: formData.reasons_json ? JSON.parse(formData.reasons_json as string).length : 0,
        has_comment: !!(formData.otherComment),
        
        // Variant identification
        variant: variantName,
        ab_test_variant: variantName,
        
        // Submission metadata
        submission_timestamp: new Date().toISOString(),
        form_version: '2.1',
        
        // Visitor data (minimal for service pages)
        session_id: visitorData.session_id || null,
        user_agent: visitorData.user_agent || null,
        timezone: visitorData.timezone || null
      };
    } else {
      // Default registration data structure
      submissionData = {
        // Form data
        ...formData,
        
        // Variant identification
        variant: variantName,
        ab_test_variant: variantName,
        
        // A/B Testing data
        tagline_variant: visitorData.tagline_variant || null,
        
        // UTM and tracking parameters at top level - always included
        utm_source: visitorData.utm_source || null,
        utm_medium: visitorData.utm_medium || null,
        utm_campaign: visitorData.utm_campaign || null,
        utm_term: visitorData.utm_term || null,
        utm_content: visitorData.utm_content || null,
        
        // Click tracking parameters at top level
        fbclid: visitorData.fbclid || null,
        ttclid: visitorData.ttclid || null,
        gclid: visitorData.gclid || null,
        
        // Page and session data at top level
        page_url: visitorData.page_url,
        page_title: visitorData.page_title,
        referrer: visitorData.referrer,
        user_agent: visitorData.user_agent,
        language: visitorData.language,
        screen_resolution: visitorData.screen_resolution,
        viewport_size: visitorData.viewport_size,
        session_id: visitorData.session_id,
        timezone: visitorData.timezone,
        
        // Generated UID
        uid: uid,
        
        // Complete visitor data object (for backup/analysis)
        visitor_data: visitorData,
        
        // Submission metadata
        submission_timestamp: new Date().toISOString(),
        form_version: '2.0'
      };
    }

    await postToLeadReceiver(env, request, form, {
      ...submissionData,
      page_url: body.page_url || visitorData.page_url,
      submission_id: body.submission_id
    });

    console.log('Form submitted successfully:', {
      variant: variantName,
      uid: uid,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Form submitted successfully', uid: uid }),
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

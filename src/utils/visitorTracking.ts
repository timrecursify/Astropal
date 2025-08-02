// Utility functions for capturing visitor data and UTM parameters

interface VisitorData {
  // UTM Parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Facebook/TikTok specific parameters
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
  
  // Page and session data
  page_url: string;
  page_title: string;
  referrer: string;
  user_agent: string;
  language: string;
  screen_resolution: string;
  viewport_size: string;
  
  // Timing data
  timestamp: string;
  timezone: string;
  session_id: string;
  
  // Location (will be populated by IP geolocation)
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
}

// Generate a session ID if one doesn't exist
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('astropal_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('astropal_session_id', sessionId);
  }
  return sessionId;
}

// Parse URL parameters
function getUrlParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  // Get all UTM parameters
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  utmParams.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      params[param] = value;
    }
  });
  
  // Get click IDs from various platforms
  const clickIds = ['fbclid', 'ttclid', 'gclid'];
  clickIds.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      params[param] = value;
    }
  });
  
  // Store UTM parameters in sessionStorage to persist across page views
  Object.keys(params).forEach(key => {
    sessionStorage.setItem(`astropal_${key}`, params[key]);
  });
  
  return params;
}

// Get stored UTM parameters from session
function getStoredUtmParams(): Record<string, string> {
  const params: Record<string, string> = {};
  const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'ttclid', 'gclid'];
  
  utmParams.forEach(param => {
    const value = sessionStorage.getItem(`astropal_${param}`);
    if (value) {
      params[param] = value;
    }
  });
  
  return params;
}

// Capture all visitor data
export function captureVisitorData(): VisitorData {
  // Get current URL parameters
  const currentParams = getUrlParams();
  
  // Get stored UTM parameters (in case user navigated between pages)
  const storedParams = getStoredUtmParams();
  
  // Merge current and stored parameters (current takes precedence)
  const allParams = { ...storedParams, ...currentParams };
  
  const visitorData: VisitorData = {
    // UTM and tracking parameters
    ...allParams,
    
    // Page data
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer || 'direct',
    user_agent: navigator.userAgent,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport_size: `${window.innerWidth}x${window.innerHeight}`,
    
    // Timing data
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    session_id: getSessionId()
  };
  
  return visitorData;
}

// Enhanced form submission with visitor tracking
export async function submitFormWithTracking(
  formData: Record<string, unknown>,
  variantName: string,
  visitorData?: VisitorData
): Promise<void> {
  const visitor = visitorData || captureVisitorData();
  
  const submissionData = {
    formData,
    variantName,
    visitorData: visitor
  };
  
  // Use Cloudflare Pages function that has access to secrets
  const functionUrl = '/api/submit-form';
  
  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': navigator.userAgent
      },
      body: JSON.stringify(submissionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Function responded with status: ${response.status}. ${errorData.message || ''}`);
    }
    
    console.log('Form submitted successfully with tracking data:', {
      variant: variantName,
      utm_source: visitor.utm_source,
      utm_medium: visitor.utm_medium,
      utm_campaign: visitor.utm_campaign,
      session_id: visitor.session_id
    });
    
  } catch (error) {
    console.error('Form submission failed:', error);
    throw error;
  }
} 
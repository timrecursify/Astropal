'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { computeHMAC } from './crypto';
import { logger } from './logger';
import { SignUpData, PreferencesData } from './validation';

// Production-ready API configuration
const getApiBaseUrl = () => {
  // Production URL - Use api.astropal.io as specified
  if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
    return 'https://api.astropal.io';
  }
  
  // Development URL
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Fallback for development
  return 'http://localhost:8787';
};

const API_BASE = getApiBaseUrl();
const HMAC_SECRET = process.env.NEXT_PUBLIC_HMAC || '';

// Log API configuration for debugging
logger.log('info', 'API configuration initialized', {
  apiBase: API_BASE,
  environment: process.env.NODE_ENV,
  hasHmacSecret: !!HMAC_SECRET,
  component: 'api-client'
});

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const body = options.body as string;
  
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  // Add any custom headers from options
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (body && HMAC_SECRET) {
    const signature = await computeHMAC(HMAC_SECRET, body);
    headers.set('X-APIsig', signature);
  }

  logger.log('debug', 'API request initiated', {
    endpoint,
    url,
    method: options.method || 'GET',
    hasBody: !!body,
    component: 'api-client'
  });

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`);
    logger.error('API request failed', { 
      endpoint, 
      url,
      status: response.status,
      statusText: response.statusText,
      error: error.message,
      component: 'api-client'
    });
    throw error;
  }

  const result = await response.json();
  
  logger.log('debug', 'API request successful', {
    endpoint,
    status: response.status,
    component: 'api-client'
  });

  return result;
}

// API Functions
export const registerUser = async (data: SignUpData) => {
  logger.log('info', 'User registration attempt', { 
    email: data.email,
    focuses: data.focuses,
    locale: data.locale,
    component: 'api-client'
  });
  
  // Map focus areas to perspective (basic mapping logic)
  const inferPerspectiveFromFocuses = (focuses: string[]): string => {
    if (focuses.includes('evidence-based')) return 'evidence';
    if (focuses.includes('career')) return 'success';
    if (focuses.includes('social')) return 'knowledge';
    return 'calm'; // Default for wellness, relationships, spiritual
  };
  
  try {
    const result = await apiRequest<{ success: boolean; user?: any; traceId?: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        birthDate: data.dob,
        birthLocation: data.birthLocation,
        birthTime: '12:00', // Default birth time
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: data.locale || 'en-US',
        perspective: inferPerspectiveFromFocuses(data.focuses),
        focusAreas: data.focuses || [],
        referralCode: data.referral
      }),
    });
    
    logger.log('info', 'User registration successful', { 
      userId: result.user?.id,
      traceId: result.traceId,
      perspective: inferPerspectiveFromFocuses(data.focuses),
      component: 'api-client'
    });
    
    return result;
  } catch (error) {
    logger.error('Registration API error', { 
      email: data.email,
      error: (error as Error).message,
      component: 'api-client'
    });
    throw error;
  }
};

export const verifyToken = async (token: string) => {
  const result = await apiRequest<{ success: boolean; user?: any }>(`/validate-token?token=${token}`);
  logger.log('info', 'Token verification', { 
    success: result.success,
    userId: result.user?.id,
    component: 'api-client'
  });
  return result;
};

export const updatePreferences = async (data: PreferencesData, token: string) => {
  return apiRequest<{ success: boolean }>('/preferences', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
};

export const getReferralInfo = async (code: string) => {
  return apiRequest<{ success: boolean }>(`/referral/${code}`);
};

export const getPricing = async () => {
  return apiRequest<{ tiers: any[] }>('/pricing');
};

export const getShareCard = async (id: string) => {
  return apiRequest<any>(`/share/${id}`);
};

// React Query Hooks with enhanced error handling
export const useRegister = () => {
  return useMutation({
    mutationFn: registerUser,
    onError: (error) => {
      logger.error('Registration mutation error', {
        error: (error as Error).message,
        component: 'api-hooks'
      });
    },
    onSuccess: (data) => {
      logger.log('info', 'Registration mutation success', {
        success: data.success,
        userId: data.user?.id,
        component: 'api-hooks'
      });
    }
  });
};

export const useVerify = (token: string) => {
  return useQuery({
    queryKey: ['verify', token],
    queryFn: () => verifyToken(token),
    enabled: !!token,
  });
};

export const usePricing = () => {
  return useQuery({
    queryKey: ['pricing'],
    queryFn: getPricing,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useReferral = (code: string) => {
  return useQuery({
    queryKey: ['referral', code],
    queryFn: () => getReferralInfo(code),
    enabled: !!code,
  });
};
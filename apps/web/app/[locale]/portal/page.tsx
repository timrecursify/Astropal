'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { StarField } from '@/components/cosmic';
import { useLogger } from '@/lib/logger';
import { User, Settings, CreditCard, Mail, CheckCircle, XCircle, Clock, Star } from 'lucide-react';

interface User {
  id: string;
  email: string;
  tier: 'trial' | 'free' | 'basic' | 'pro';
  perspective: 'calm' | 'knowledge' | 'success' | 'evidence';
  focusAreas: string[];
  trialEnd?: string;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd?: string;
  preferences: {
    locale: string;
    focusAreas: string[];
  };
}

interface PortalState {
  loading: boolean;
  user: User | null;
  error: string | null;
  actionInProgress: string | null;
}

function PortalPageContent() {
  const { logUserAction, logError, logInfo } = useLogger('CustomerPortal');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<PortalState>({
    loading: true,
    user: null,
    error: null,
    actionInProgress: null
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Access token required'
      }));
      return;
    }

    validateTokenAndLoadUser(token);
  }, [token]);

  // Get API base URL from environment variables
  const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return process.env.NEXT_PUBLIC_API_BASE_URL;
    }
    
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENVIRONMENT === 'production') {
      const domain = process.env.NEXT_PUBLIC_DOMAIN || 'astropal.io';
      return `https://api.${domain}`;
    }
    
    return 'http://localhost:8787';
  };

  const API_BASE = getApiBaseUrl();
  const EMAIL_SUPPORT = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@astropal.io';

  const validateTokenAndLoadUser = async (token: string) => {
    try {
      logInfo('Validating user token', { token: token.slice(0, 8) });
      
      const response = await fetch(`${API_BASE}/validate-token?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          loading: false,
          user: data.user
        }));
        
        logUserAction('portal_accessed', { 
          userId: data.user.id,
          tier: data.user.tier
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Invalid or expired access link'
        }));
        
        logError(new Error('Token validation failed'), { 
          error: data.error,
          token: token.slice(0, 8)
        });
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to verify access. Please try again.'
      }));
      
      logError(error as Error, { action: 'token_validation' });
    }
  };

  const updatePerspective = async (newPerspective: string) => {
    if (!state.user || !token) return;
    
    setState(prev => ({ ...prev, actionInProgress: 'perspective' }));
    
    try {
      logUserAction('perspective_change_attempt', { 
        oldPerspective: state.user.perspective,
        newPerspective,
        userId: state.user.id
      });
      
      const response = await fetch(`${API_BASE}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          perspective: newPerspective
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, perspective: newPerspective as any } : null,
          actionInProgress: null
        }));
        
        logUserAction('perspective_changed', { 
          newPerspective,
          userId: state.user.id
        });
        
        alert('Perspective updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update perspective');
      }
    } catch (error) {
      logError(error as Error, { 
        action: 'perspective_update',
        newPerspective
      });
      
      setState(prev => ({ ...prev, actionInProgress: null }));
      alert('Failed to update perspective. Please try again.');
    }
  };

  const manageBilling = async (action: 'upgrade' | 'cancel') => {
    if (!state.user || !token) return;
    
    setState(prev => ({ ...prev, actionInProgress: action }));
    
    try {
      logUserAction(`billing_${action}_attempt`, { 
        currentTier: state.user.tier,
        userId: state.user.id
      });
      
      const response = await fetch(`${API_BASE}/billing/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (action === 'upgrade' && data.checkoutUrl) {
          logUserAction('billing_redirect_to_stripe', { 
            checkoutUrl: data.checkoutUrl,
            userId: state.user.id
          });
          
          window.location.href = data.checkoutUrl;
        } else {
          setState(prev => ({
            ...prev,
            user: prev.user ? { ...prev.user, subscriptionStatus: 'canceled' } : null,
            actionInProgress: null
          }));
          
          logUserAction(`billing_${action}_success`, { 
            userId: state.user.id
          });
          
          alert(`Subscription ${action === 'cancel' ? 'canceled' : 'updated'} successfully!`);
        }
      } else {
        throw new Error(data.error || `Failed to ${action} subscription`);
      }
    } catch (error) {
      logError(error as Error, { 
        action: `billing_${action}`,
        currentTier: state.user?.tier
      });
      
      setState(prev => ({ ...prev, actionInProgress: null }));
      alert(`Failed to ${action} subscription. Please try again.`);
    }
  };

  if (state.loading) {
    return (
      <div className="fixed inset-0 bg-black text-white">
        <StarField />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading your cosmic portal...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="fixed inset-0 bg-black text-white">
        <StarField />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Error</h2>
            <p className="text-gray-300 mb-4">{state.error}</p>
            <button 
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="fixed inset-0 bg-black text-white">
        <StarField />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-300">No user data found</p>
          </div>
        </div>
      </div>
    );
  }

  const perspectiveColors = {
    calm: 'purple',
    knowledge: 'pink', 
    success: 'yellow',
    evidence: 'blue'
  };

  const tierInfo = {
    trial: { name: 'Trial', icon: Clock, color: 'gray' },
    free: { name: 'Free', icon: Mail, color: 'gray' },
    basic: { name: 'Basic', icon: CheckCircle, color: 'blue' },
    pro: { name: 'Pro', icon: Star, color: 'purple' }
  };

  return (
    <main className="fixed inset-0 bg-black text-white overflow-hidden">
      <StarField />
      
      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold tracking-wide">ASTROPAL</div>
            <div className="text-sm text-gray-400">Account Management</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 h-[calc(100vh-100px)] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Welcome Section */}
          <div className="text-center">
            <h1 className="text-3xl font-light mb-4">Welcome to Your Cosmic Portal</h1>
            <p className="text-gray-300 text-lg">{state.user.email}</p>
          </div>

          {/* Account Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Current Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <CreditCard className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Current Plan</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tier</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {tierInfo[state.user.tier].name}
                  </span>
                </div>
                
                {state.user.tier === 'trial' && state.user.trialEnd && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Trial Ends</span>
                    <span className="text-yellow-400">{new Date(state.user.trialEnd).toLocaleDateString()}</span>
                  </div>
                )}
                
                {state.user.subscriptionStatus && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status</span>
                    <span className={`capitalize ${
                      state.user.subscriptionStatus === 'active' ? 'text-green-400' :
                      state.user.subscriptionStatus === 'canceled' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {state.user.subscriptionStatus}
                    </span>
                  </div>
                )}
                
                {/* Billing Actions */}
                <div className="pt-4 space-y-2">
                  {(state.user.tier === 'trial' || state.user.tier === 'free') && (
                    <button
                      onClick={() => manageBilling('upgrade')}
                      disabled={state.actionInProgress === 'upgrade'}
                      className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {state.actionInProgress === 'upgrade' ? 'Processing...' : 'Upgrade to Basic'}
                    </button>
                  )}
                  
                  {(state.user.tier === 'basic' || state.user.tier === 'pro') && state.user.subscriptionStatus === 'active' && (
                    <button
                      onClick={() => manageBilling('cancel')}
                      disabled={state.actionInProgress === 'cancel'}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {state.actionInProgress === 'cancel' ? 'Processing...' : 'Cancel Subscription'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Newsletter Preferences */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Settings className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Newsletter Style</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Perspective</span>
                                     <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30 capitalize">
                     {state.user?.perspective}
                   </span>
                </div>
                
                                 <div className="flex items-center justify-between">
                   <span className="text-gray-300">Focus Areas</span>
                   <span className="text-sm text-gray-400">{state.user?.focusAreas.join(', ')}</span>
                 </div>
                
                {/* Perspective Switching */}
                <div className="pt-4">
                  <p className="text-sm text-gray-400 mb-3">Switch your newsletter style:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['calm', 'knowledge', 'success', 'evidence'] as const).map((perspective) => (
                      <button
                        key={perspective}
                        onClick={() => updatePerspective(perspective)}
                        disabled={state.actionInProgress === 'perspective' || state.user?.perspective === perspective}
                        className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                          state.user?.perspective === perspective 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'
                        } disabled:opacity-50`}
                      >
                        {perspective.charAt(0).toUpperCase() + perspective.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Footer Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center pt-8 border-t border-gray-800/50"
          >
            <p className="text-gray-400 text-sm mb-4">
              Need help? Contact us or return to the main site.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white rounded-lg transition-colors"
              >
                Return Home
              </button>
              <a 
                                 href={`mailto:${EMAIL_SUPPORT}`}
                className="text-purple-400 hover:text-purple-300 underline"
                              >
                 {EMAIL_SUPPORT}
                </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your account...</p>
        </div>
      </div>
    }>
      <PortalPageContent />
    </Suspense>
  );
} 
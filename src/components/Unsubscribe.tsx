import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const Unsubscribe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');
    
    if (uidParam) {
      setUid(uidParam);
    }

    // Capture UTM parameters
    const utmData: Record<string, string> = {};
    for (const [key, value] of urlParams.entries()) {
      if (key.startsWith('utm_') || key === 'uid') {
        utmData[key] = value;
      }
    }
    setUtmParams(utmData);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation - only check email if no UID provided
    if (!uid && !email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!uid && email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Submit unsubscribe request with UID or email
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: { 
            email: uid ? 'unsubscribe-by-uid' : email, 
            uid: uid,
            action: 'unsubscribe',
            ...utmParams
          },
          variantName: 'unsubscribe',
          visitorData: {
            timestamp: new Date().toISOString(),
            action: 'unsubscribe',
            has_uid: !!uid,
            ...utmParams
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process unsubscribe request');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to process your request. Please try again or contact support@astropal.io');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <img 
            src="/Astropal_Logo.png" 
            alt="Astropal Logo" 
            className="w-8 h-8"
          />
          <span className="font-mono text-base">ASTROPAL</span>
        </div>
        <a 
          href="/" 
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="text-sm">Back to Home</span>
        </a>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          {isSubmitted ? (
            // Success State - Confirmation Window
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-light">Unsubscribed Successfully</h1>
              <div className="space-y-4 text-gray-400">
                <p>You have been successfully removed from our mailing list.</p>
                <p>It may take up to 24 hours for the change to take effect.</p>
                <p>We're sorry to see you go, but we understand that cosmic guidance isn't for everyone.</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-3">
                <h3 className="text-lg font-medium text-white">What happens next?</h3>
                <ul className="text-sm text-gray-400 space-y-2 text-left">
                  <li>• You will not receive any more newsletters from us</li>
                  <li>• Your data remains secure and we will not share it</li>
                  <li>• You can re-subscribe anytime by visiting our website</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                Questions? Contact <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
              </p>
            </div>
          ) : (
            // Unsubscribe Form
            <>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-light mb-4">Unsubscribe from Cosmic Updates</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                  {uid 
                    ? "We're sorry to see you go. Click the button below to unsubscribe from all future communications."
                    : "We're sorry to see you go. Enter your email address below to unsubscribe from all future communications."
                  }
                </p>
                {uid && (
                  <div className="mt-4 text-sm text-gray-500">
                    Unsubscribing account: {uid}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {!uid && (
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      <Mail className="w-4 h-4 mr-2" />
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-lg"
                      placeholder="your.email@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-medium text-white">Before you go...</h3>
                  <div className="text-sm text-gray-400 space-y-2">
                    <p>• You can always adjust your email preferences instead of unsubscribing completely</p>
                    <p>• You'll miss out on personalized cosmic insights tailored just for you</p>
                    <p>• Re-subscribing later will require filling out the full form again</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'PROCESSING...' : 'UNSUBSCRIBE'}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    This action will remove you from all future communications.
                  </p>
                </div>
              </form>

              <div className="mt-12 text-center">
                <p className="text-sm text-gray-400 mb-4">
                  Need help instead? We're here for you.
                </p>
                <a 
                  href="mailto:support@astropal.io" 
                  className="text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Contact Support →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unsubscribe;
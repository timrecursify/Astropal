import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import TrackingFreeLayout from './TrackingFreeLayout';

interface UnsubscribeData {
  email: string;
  uid?: string;
  reasons: string[];
  otherComment: string;
}

const Unsubscribe: React.FC = () => {
  const [formData, setFormData] = useState<UnsubscribeData>({
    email: '',
    reasons: [],
    otherComment: ''
  });
  const [uid, setUid] = useState<string | null>(null);
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const reasonTags = [
    'Too Frequent',
    'Not Relevant',
    'Poor Content Quality',
    'Technical Issues',
    'Privacy Concerns',
    'Found Better Alternative',
    'Temporary Break',
    'No Longer Interested',
    'Receiving Duplicates',
    'Other'
  ];

  // Extract URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');
    
    if (uidParam) {
      setUid(uidParam);
      setFormData(prev => ({ ...prev, uid: uidParam }));
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
    if (!uid && !formData.email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (formData.reasons.length === 0) {
      setError('Please select at least one reason for unsubscribing');
      setIsLoading(false);
      return;
    }

    if (!uid && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        setIsLoading(false);
        return;
      }
    }

    try {
      // Submit unsubscribe request with reasons
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: { 
            email: uid ? 'unsubscribe-by-uid' : formData.email, 
            uid: uid,
            action: 'unsubscribe',
            reasons_json: JSON.stringify(formData.reasons),
            otherComment: formData.otherComment,
            ...utmParams
          },
          variantName: 'unsubscribe',
          visitorData: {
            timestamp: new Date().toISOString(),
            action: 'unsubscribe',
            has_uid: !!uid,
            reasons_count: formData.reasons.length,
            has_comment: !!formData.otherComment,
            ...utmParams
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process unsubscribe request');
      }

      setIsSubmitted(true);
    } catch (error) {
      setError('Failed to process your request. Please try again or contact support@astropal.io');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReason = (reason: string) => {
    setFormData(prev => {
      const currentReasons = prev.reasons;
      const newReasons = currentReasons.includes(reason)
        ? currentReasons.filter(r => r !== reason)
        : [...currentReasons, reason];
      
      return { ...prev, reasons: newReasons };
    });
  };

  return (
    <TrackingFreeLayout title="Unsubscribe - Astropal">
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
                      ? "We're sorry to see you go. Please tell us why you're unsubscribing so we can improve."
                      : "We're sorry to see you go. Enter your email and tell us why you're unsubscribing."
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
                        EMAIL ADDRESS *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-lg"
                        placeholder="your.email@example.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* Reason Selection */}
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-4">
                      WHY ARE YOU UNSUBSCRIBING? * ({formData.reasons.length} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {reasonTags.map(reason => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => toggleReason(reason)}
                          className={`p-3 text-sm border rounded-lg transition-all duration-200 ${
                            formData.reasons.includes(reason)
                              ? 'bg-red-600 text-white border-red-500'
                              : 'bg-transparent text-gray-300 border-gray-800 hover:border-gray-600 hover:bg-gray-900'
                          }`}
                          disabled={isLoading}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    
                    {/* Other comment */}
                    {formData.reasons.includes('Other') && (
                      <div className="mt-4">
                        <textarea
                          value={formData.otherComment}
                          onChange={(e) => setFormData(prev => ({ ...prev, otherComment: e.target.value }))}
                          rows={3}
                          className="w-full bg-transparent border border-gray-800 rounded-lg p-3 text-white focus:border-white focus:outline-none resize-none"
                          placeholder="Please tell us more about your reason..."
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>

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
    </TrackingFreeLayout>
  );
};

export default Unsubscribe;
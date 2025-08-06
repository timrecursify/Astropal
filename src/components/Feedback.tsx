import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, ArrowLeft } from 'lucide-react';

interface FeedbackData {
  email: string;
  rating: number;
  category: string;
  message: string;
  uid?: string;
}

const Feedback: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackData>({
    email: '',
    rating: 0,
    category: '',
    message: ''
  });
  const [uid, setUid] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Content Quality',
    'Technical Issues',
    'Feature Request',
    'General Feedback',
    'Billing Question',
    'Other'
  ];

  // Extract UID from URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');
    
    if (uidParam) {
      setUid(uidParam);
      setFormData(prev => ({ ...prev, uid: uidParam }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!uid && !formData.email) {
      setError('Please provide your email address');
      setIsLoading(false);
      return;
    }

    if (!formData.message) {
      setError('Please enter your feedback message');
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
      // Submit feedback with UID or email
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: { 
            ...formData, 
            email: uid ? 'feedback-by-uid' : formData.email,
            uid: uid,
            action: 'feedback'
          },
          variantName: 'feedback',
          visitorData: {
            timestamp: new Date().toISOString(),
            action: 'feedback',
            has_uid: !!uid,
            rating: formData.rating,
            category: formData.category
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to submit your feedback. Please try again or contact support@astropal.io');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof FeedbackData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
              <h1 className="text-3xl md:text-4xl font-light">Feedback Received</h1>
              <div className="space-y-4 text-gray-400">
                <p>Thank you for taking the time to share your thoughts with us!</p>
                <p>Your feedback helps us improve the cosmic experience for everyone.</p>
                <p>We'll review your message and get back to you if needed.</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-3">
                <h3 className="text-lg font-medium text-white">What's next?</h3>
                <ul className="text-sm text-gray-400 space-y-2 text-left">
                  <li>• Our team will review your feedback within 24-48 hours</li>
                  <li>• If you requested a response, we'll email you back</li>
                  <li>• Your input helps shape future cosmic experiences</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500">
                Questions? Contact <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
              </p>
            </div>
          ) : (
            // Feedback Form
            <>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-light mb-4">Share Your Cosmic Feedback</h1>
                <p className="text-gray-400 max-w-lg mx-auto">
                  Your thoughts help us improve the Astropal experience. We appreciate every insight you share.
                </p>
                {uid && (
                  <div className="mt-4 text-sm text-gray-500">
                    Account: {uid}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Email - only show if no UID */}
                {!uid && (
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-lg"
                      placeholder="your.email@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Rating */}
                <div>
                  <label className="flex items-center text-xs text-gray-400 mb-4">
                    OVERALL EXPERIENCE
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => updateField('rating', rating)}
                        className={`p-2 transition-colors ${
                          formData.rating >= rating 
                            ? 'text-yellow-400' 
                            : 'text-gray-600 hover:text-gray-400'
                        }`}
                        disabled={isLoading}
                      >
                        <Star 
                          size={24} 
                          fill={formData.rating >= rating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    {formData.rating > 0 && (
                      <span className="text-sm text-gray-400 ml-4">
                        {formData.rating === 1 && 'Poor'}
                        {formData.rating === 2 && 'Fair'}
                        {formData.rating === 3 && 'Good'}
                        {formData.rating === 4 && 'Very Good'}
                        {formData.rating === 5 && 'Excellent'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="flex items-center text-xs text-gray-400 mb-2">
                    FEEDBACK CATEGORY
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => updateField('category', e.target.value)}
                    className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-lg appearance-none [color-scheme:dark]"
                    disabled={isLoading}
                  >
                    <option value="" className="bg-gray-900">Select a category...</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-gray-900">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="flex items-center text-xs text-gray-400 mb-2">
                    YOUR MESSAGE *
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    rows={6}
                    className="w-full bg-transparent border border-gray-800 rounded-lg p-4 text-white focus:border-white focus:outline-none resize-none"
                    placeholder="Share your thoughts, suggestions, or questions with us..."
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                  >
                    <Send size={16} />
                    <span>{isLoading ? 'SENDING...' : 'SEND FEEDBACK'}</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    We read every message and appreciate your input.
                  </p>
                </div>
              </form>

              <div className="mt-12 text-center border-t border-gray-800 pt-8">
                <p className="text-sm text-gray-400 mb-4">
                  Need immediate assistance?
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

export default Feedback;
import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, ArrowLeft } from 'lucide-react';
import TrackingFreeLayout from './TrackingFreeLayout';

interface FeedbackData {
  email: string;
  likes: string[];
  dislikes: string[];
  likeOtherComment: string;
  dislikeOtherComment: string;
  uid?: string;
}

const Feedback: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackData>({
    email: '',
    likes: [],
    dislikes: [],
    likeOtherComment: '',
    dislikeOtherComment: ''
  });
  const [uid, setUid] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const likeTags = [
    'Content Quality',
    'Personalized Insights',
    'Daily Timing',
    'Email Design',
    'Accuracy',
    'Easy to Read',
    'Helpful Guidance',
    'Professional',
    'Engaging',
    'Other'
  ];

  const dislikeTags = [
    'Too Generic',
    'Wrong Timing',
    'Too Frequent',
    'Not Accurate',
    'Hard to Read',
    'Too Long',
    'Too Short',
    'Not Relevant',
    'Technical Issues',
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

    if (formData.likes.length === 0 && formData.dislikes.length === 0) {
      setError('Please select at least one tag in either section');
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
      // Submit feedback with tags
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
            action: 'feedback',
            likes_json: JSON.stringify(formData.likes),
            dislikes_json: JSON.stringify(formData.dislikes)
          },
          variantName: 'feedback',
          visitorData: {
            timestamp: new Date().toISOString(),
            action: 'feedback',
            has_uid: !!uid,
            likes_count: formData.likes.length,
            dislikes_count: formData.dislikes.length
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
    } catch (error) {
      setError('Failed to submit your feedback. Please try again or contact support@astropal.io');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string, type: 'likes' | 'dislikes') => {
    setFormData(prev => {
      const currentTags = prev[type];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      
      return { ...prev, [type]: newTags };
    });
  };

  const updateComment = (comment: string, type: 'likeOtherComment' | 'dislikeOtherComment') => {
    setFormData(prev => ({ ...prev, [type]: comment }));
  };

  return (
    <TrackingFreeLayout title="Feedback - Astropal">
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
                    We're a new project building something special! Your feedback helps us improve your cosmic journey. 
                    <span className="text-purple-400 font-medium"> As a thank you, we'll extend your free trial!</span>
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
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-lg"
                        placeholder="your.email@example.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* What you like */}
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-4">
                      WHAT DO YOU LIKE? ({formData.likes.length} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {likeTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag, 'likes')}
                          className={`p-3 text-sm border rounded-lg transition-all duration-200 ${
                            formData.likes.includes(tag)
                              ? 'bg-green-600 text-white border-green-500'
                              : 'bg-transparent text-gray-300 border-gray-800 hover:border-gray-600 hover:bg-gray-900'
                          }`}
                          disabled={isLoading}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    
                    {/* Other comment for likes */}
                    {formData.likes.includes('Other') && (
                      <div className="mt-4">
                        <textarea
                          value={formData.likeOtherComment}
                          onChange={(e) => updateComment(e.target.value, 'likeOtherComment')}
                          rows={3}
                          className="w-full bg-transparent border border-gray-800 rounded-lg p-3 text-white focus:border-white focus:outline-none resize-none"
                          placeholder="Please specify what you like..."
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>

                  {/* What you don't like */}
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-4">
                      WHAT DON'T YOU LIKE? ({formData.dislikes.length} selected)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {dislikeTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag, 'dislikes')}
                          className={`p-3 text-sm border rounded-lg transition-all duration-200 ${
                            formData.dislikes.includes(tag)
                              ? 'bg-red-600 text-white border-red-500'
                              : 'bg-transparent text-gray-300 border-gray-800 hover:border-gray-600 hover:bg-gray-900'
                          }`}
                          disabled={isLoading}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    
                    {/* Other comment for dislikes */}
                    {formData.dislikes.includes('Other') && (
                      <div className="mt-4">
                        <textarea
                          value={formData.dislikeOtherComment}
                          onChange={(e) => updateComment(e.target.value, 'dislikeOtherComment')}
                          rows={3}
                          className="w-full bg-transparent border border-gray-800 rounded-lg p-3 text-white focus:border-white focus:outline-none resize-none"
                          placeholder="Please specify what you don't like..."
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
    </TrackingFreeLayout>
  );
};

export default Feedback;
import React, { useState, useEffect } from 'react';
import { FieldTooltip } from '../FieldTooltip';
import ConfirmationBlock from '../ConfirmationBlock';

interface FormData {
  fullName: string;
  preferredName: string;
  email: string;
  birthDate: string;
  birthLocation: string;
  timeZone: string;
  dayStartTime: string;
  birthTime: string;
  relationshipStatus: string;
  practices: string[];
  lifeFocus: string[];
}

const Toggle: React.FC<{ 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-sm transition-all duration-300 text-left ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-500/50'
    } ${checked 
      ? 'border-purple-500 bg-purple-900/30 text-white' 
      : 'text-gray-300 hover:bg-gray-800/70'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <div className={`w-4 h-4 rounded border transition-all ${
        checked 
          ? 'bg-purple-600 border-purple-600' 
          : 'border-gray-500'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  </button>
);

export default function Variant2Form() {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    preferredName: '',
    email: '',
    birthDate: '',
    birthLocation: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayStartTime: '07:00',
    birthTime: '',
    relationshipStatus: '',
    practices: [],
    lifeFocus: [],
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Check for existing submission on component mount
  useEffect(() => {
    const checkSubmissionStatus = () => {
      const submittedEmail = localStorage.getItem('astropal_variant2_submitted_email');
      const submissionTimestamp = localStorage.getItem('astropal_variant2_submission_timestamp');
      
      if (submittedEmail && submissionTimestamp) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const submittedTime = parseInt(submissionTimestamp);
        
        if (submittedTime > oneWeekAgo) {
          setFormData(prev => ({ ...prev, email: submittedEmail }));
          setHasSubmitted(true);
          setShowConfirmation(true);
        } else {
          // Clear old submission data
          localStorage.removeItem('astropal_variant2_submitted_email');
          localStorage.removeItem('astropal_variant2_submission_timestamp');
        }
      }
    };

    checkSubmissionStatus();
  }, []);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePractice = (practice: string) => {
    setFormData(prev => ({
      ...prev,
      practices: prev.practices.includes(practice)
        ? prev.practices.filter(p => p !== practice)
        : prev.practices.length < 3 
          ? [...prev.practices, practice]
          : prev.practices
    }));
  };

  const toggleLifeFocus = (focus: string) => {
    if (formData.lifeFocus.includes(focus)) {
      setFormData(prev => ({
        ...prev,
        lifeFocus: prev.lifeFocus.filter(f => f !== focus)
      }));
    } else if (formData.lifeFocus.length < 3) {
      setFormData(prev => ({
        ...prev,
        lifeFocus: [...prev.lifeFocus, focus]
      }));
    }
  };

  const handleBirthTimeUnknown = () => {
    if (formData.birthTime === 'unknown') {
      updateField('birthTime', '');
    } else {
      updateField('birthTime', 'unknown');
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.preferredName.trim()) errors.push('Preferred name is required');
    if (!formData.birthDate) errors.push('Birth date is required');
    if (!formData.birthLocation.trim()) errors.push('Birth location is required');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Age validation (18+)
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) 
        ? age - 1 
        : age;
        
      if (actualAge < 18) {
        errors.push('You must be at least 18 years old to sign up');
      }
    }
    
    // Numerology validation
    if (formData.practices.includes('Numerology') && !formData.fullName.trim()) {
      errors.push('Full name is required when Numerology is selected');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if already submitted
    if (hasSubmitted) {
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Import and use the visitor tracking utility
      const { submitFormWithTracking } = await import('../../utils/visitorTracking');
      
      // Submit form with full visitor tracking
      await submitFormWithTracking(formData as unknown as Record<string, unknown>, 'variant2');
      
      // Store submission data in localStorage
      localStorage.setItem('astropal_variant2_submitted_email', formData.email);
      localStorage.setItem('astropal_variant2_submission_timestamp', Date.now().toString());
      
      // Fire Facebook conversion event ONLY after successful submission
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Astropal Registration',
          content_category: 'Lead',
          value: 4.99,
          currency: 'USD',
          variant: 'variant2'
        });
      }
      
      setHasSubmitted(true);
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {showConfirmation ? (
        <div className="flex items-center justify-center p-6">
          <ConfirmationBlock
            userEmail={formData.email}
            variant="wellness"
          />
        </div>
      ) : (
        <>          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Main Form Card with Title */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 md:p-8">
              {/* Form Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-light mb-3 text-white">Set Up Your Morning Ritual</h2>
                <p className="text-base text-gray-400">One quick setup for perfectly timed daily wisdom</p>
              </div>

              {/* Personal Information */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Full Name (Optional)
                      <FieldTooltip content="Your complete legal name is only required when Numerology is selected for accurate calculations" />
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                      required={formData.practices.includes('Numerology')}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Preferred Name *
                      <FieldTooltip content="How you'd like to be addressed in your daily cosmic insights" />
                    </label>
                    <input
                      type="text"
                      value={formData.preferredName}
                      onChange={(e) => updateField('preferredName', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Email Address *
                      <FieldTooltip content="Where we'll send your personalized daily cosmic guidance" />
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Birth Date *
                      <FieldTooltip content="Your date of birth for accurate astrological and numerological calculations" />
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField('birthDate', e.target.value)}
                      max={`${new Date().getFullYear() - 18}-12-31`}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Birth Location *
                      <FieldTooltip content="City, state, and country where you were born for location-based astrological calculations" />
                    </label>
                    <input
                      type="text"
                      value={formData.birthLocation}
                      onChange={(e) => updateField('birthLocation', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                      placeholder="City, State, Country"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Time Zone
                      <FieldTooltip content="Your current time zone for delivering content at the perfect moment" />
                    </label>
                    <select
                      value={formData.timeZone}
                      onChange={(e) => updateField('timeZone', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                    >
                      <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>Auto-detected</option>
                      <option value="America/New_York">Eastern</option>
                      <option value="America/Chicago">Central</option>
                      <option value="America/Denver">Mountain</option>
                      <option value="America/Los_Angeles">Pacific</option>
                      <option value="Europe/London">GMT</option>
                      <option value="Europe/Paris">CET</option>
                      <option value="Asia/Tokyo">JST</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Day Start Time
                      <FieldTooltip content="When your day typically begins - we'll deliver your cosmic insights at the perfect moment" />
                    </label>
                    <input
                      type="time"
                      value={formData.dayStartTime}
                      onChange={(e) => updateField('dayStartTime', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Birth Time
                      <FieldTooltip content="Your exact time of birth for precise astrological chart calculations. Select 'Unknown' if uncertain" />
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={formData.birthTime === 'unknown' ? '' : formData.birthTime}
                        onChange={(e) => updateField('birthTime', e.target.value)}
                        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                        disabled={formData.birthTime === 'unknown'}
                      />
                      <button
                        type="button"
                        onClick={handleBirthTimeUnknown}
                        className={`px-3 py-2 rounded-md text-xs font-medium transition-all ${
                          formData.birthTime === 'unknown' 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        UNKNOWN
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center text-xs font-medium text-gray-300">
                      Relationship Status
                      <FieldTooltip content="Optional information to personalize relationship and love-focused content" />
                    </label>
                    <select
                      value={formData.relationshipStatus}
                      onChange={(e) => updateField('relationshipStatus', e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all"
                    >
                      <option value="">Prefer not to say</option>
                      <option value="single">Single</option>
                      <option value="relationship">In Relationship</option>
                      <option value="married">Married</option>
                      <option value="complicated">It's Complicated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Cosmic Practices */}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">Cosmic Practices</h3>
                  <p className="text-sm text-gray-400">
                    Select up to 3 practices ({formData.practices.length}/3)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Astrology',
                    'Numerology', 
                    'Daily Tarot Wisdom',
                    'Crystal & Gemstone Guidance',
                    'Chakra & Energy Work',
                    'Feng Shui & Space Harmony'
                  ].map(practice => (
                    <Toggle
                      key={practice}
                      checked={formData.practices.includes(practice)}
                      onChange={() => togglePractice(practice)}
                      label={practice}
                      disabled={!formData.practices.includes(practice) && formData.practices.length >= 3}
                    />
                  ))}
                </div>
              </div>

              {/* Life Focus Areas */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">Life Focus Areas</h3>
                  <p className="text-sm text-gray-400">
                    Select up to 3 areas ({formData.lifeFocus.length}/3)
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Love & Relationships',
                    'Career & Success',
                    'Health & Wellness', 
                    'Wealth & Abundance',
                    'Personal Growth',
                    'Family & Home'
                  ].map(focus => (
                    <Toggle
                      key={focus}
                      checked={formData.lifeFocus.includes(focus)}
                      onChange={() => toggleLifeFocus(focus)}
                      label={focus}
                      disabled={!formData.lifeFocus.includes(focus) && formData.lifeFocus.length >= 3}
                    />
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Submit Button Section - Separated with more spacing */}
          <div className="text-center mt-12">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 md:px-12 py-3 md:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm md:text-base"
            >
              {isSubmitting ? 'CREATING YOUR COSMIC JOURNEY...' : 'BEGIN COSMIC JOURNEY'}
            </button>
            <p className="text-xs md:text-sm text-gray-500 mt-4">
              7-Day Free trial • No credit card required • $4.99/mo after
            </p>
          </div>
        </>
      )}
    </div>
  );
} 
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
    className={`group relative overflow-hidden w-full p-3 text-sm font-medium transition-all duration-300 transform hover:scale-[1.01] ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${checked 
      ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-400 shadow-md shadow-purple-500/20' 
      : 'bg-gray-900/30 backdrop-blur-sm text-gray-300 border border-gray-700/50 hover:border-purple-500/50 hover:bg-gray-800/50'
    }`}
    style={{ borderRadius: '8px' }}
  >
    <div className="relative z-10 flex items-center justify-between">
      <span className="font-medium tracking-wide text-sm">{label}</span>
      <div className={`w-4 h-4 rounded-full border transition-all duration-300 ${
        checked 
          ? 'bg-white border-white' 
          : 'border-gray-500'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-purple-600 ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </div>
  </button>
);

export default function Variant1Form() {
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
      const submittedEmail = localStorage.getItem('astropal_variant1_submitted_email');
      const submissionTimestamp = localStorage.getItem('astropal_variant1_submission_timestamp');
      
      if (submittedEmail && submissionTimestamp) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const submittedTime = parseInt(submissionTimestamp);
        
        if (submittedTime > oneWeekAgo) {
          setFormData(prev => ({ ...prev, email: submittedEmail }));
          setHasSubmitted(true);
          setShowConfirmation(true);
        } else {
          // Clear old submission data
          localStorage.removeItem('astropal_variant1_submitted_email');
          localStorage.removeItem('astropal_variant1_submission_timestamp');
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
      // Fire Facebook conversion event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'CompleteRegistration', {
          content_name: 'Astropal Registration',
          content_category: 'Lead',
          value: 4.99,
          currency: 'USD'
        });
      }
      
      // Import and use the visitor tracking utility
      const { submitFormWithTracking } = await import('../../utils/visitorTracking');
      
      // Submit form with full visitor tracking
      await submitFormWithTracking(formData as unknown as Record<string, unknown>, 'variant1');

      // Store submission data in localStorage
      localStorage.setItem('astropal_variant1_submitted_email', formData.email);
      localStorage.setItem('astropal_variant1_submission_timestamp', Date.now().toString());
      
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
    <div className="h-full flex flex-col">
      {showConfirmation ? (
        <div className="flex items-center justify-center p-6">
          <ConfirmationBlock
            userEmail={formData.email}
            variant="wellness"
          />
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold tracking-wide mb-3 text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Customize Your Daily Newsletter
            </h2>
            <p className="text-xs text-gray-400 font-light tracking-wide">
              Personalized cosmic wellness delivered daily
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
            {/* Personal Information Section */}
            <div className="bg-gradient-to-br from-gray-900/40 to-purple-900/15 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4 shadow-lg">
              <h3 className="text-sm font-bold text-white mb-4 tracking-wide border-b border-gray-700/50 pb-2">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    FULL NAME (OPTIONAL)
                    <FieldTooltip content="Your complete legal name is only required when Numerology is selected for accurate calculations" />
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300"
                    required={formData.practices.includes('Numerology')}
                    placeholder="Enter your full legal name"
                  />
                </div>
                
                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    PREFERRED NAME *
                    <FieldTooltip content="How you'd like to be addressed in your daily cosmic insights" />
                  </label>
                  <input
                    type="text"
                    value={formData.preferredName}
                    onChange={(e) => updateField('preferredName', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300"
                    required
                    placeholder="How should we address you?"
                  />
                </div>
                
                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    EMAIL ADDRESS *
                    <FieldTooltip content="Where we'll send your personalized daily cosmic guidance" />
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300"
                    required
                    placeholder="your@email.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                      BIRTH DATE *
                      <FieldTooltip content="Your date of birth for accurate astrological and numerological calculations" />
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField('birthDate', e.target.value)}
                      max={`${new Date().getFullYear() - 18}-12-31`}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                      BIRTH TIME
                      <FieldTooltip content="Your exact time of birth for precise astrological chart calculations. Select 'Unknown' if uncertain" />
                    </label>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <input
                        type="time"
                        value={formData.birthTime === 'unknown' ? '' : formData.birthTime}
                        onChange={(e) => updateField('birthTime', e.target.value)}
                        className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 [color-scheme:dark]"
                        disabled={formData.birthTime === 'unknown'}
                      />
                      <button
                        type="button"
                        onClick={handleBirthTimeUnknown}
                        className={`w-full sm:w-auto sm:flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-md transition-all duration-300 ${
                          formData.birthTime === 'unknown' 
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' 
                            : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                        }`}
                      >
                        UNKNOWN
                      </button>
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    BIRTH LOCATION *
                    <FieldTooltip content="City, state, and country where you were born for location-based astrological calculations" />
                  </label>
                  <input
                    type="text"
                    value={formData.birthLocation}
                    onChange={(e) => updateField('birthLocation', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300"
                    placeholder="City, State, Country"
                    required
                  />
                </div>

                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    TIME ZONE
                    <FieldTooltip content="Your current time zone for delivering content at the perfect moment" />
                  </label>
                  <select
                    value={formData.timeZone}
                    onChange={(e) => updateField('timeZone', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 appearance-none"
                  >
                    <option value={Intl.DateTimeFormat().resolvedOptions().timeZone} className="bg-gray-900">
                      Auto-detected
                    </option>
                    <option value="America/New_York" className="bg-gray-900">Eastern</option>
                    <option value="America/Chicago" className="bg-gray-900">Central</option>
                    <option value="America/Denver" className="bg-gray-900">Mountain</option>
                    <option value="America/Los_Angeles" className="bg-gray-900">Pacific</option>
                    <option value="Europe/London" className="bg-gray-900">GMT</option>
                    <option value="Europe/Paris" className="bg-gray-900">CET</option>
                    <option value="Asia/Tokyo" className="bg-gray-900">JST</option>
                  </select>
                </div>

                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    DAY START TIME
                    <FieldTooltip content="When your day typically begins - we'll deliver your cosmic insights at the perfect moment" />
                  </label>
                  <input
                    type="time"
                    value={formData.dayStartTime}
                    onChange={(e) => updateField('dayStartTime', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 [color-scheme:dark]"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center justify-between text-xs font-semibold text-gray-300 mb-2 tracking-wide">
                    RELATIONSHIP STATUS
                    <FieldTooltip content="Optional information to personalize relationship and love-focused content" />
                  </label>
                  <select
                    value={formData.relationshipStatus}
                    onChange={(e) => updateField('relationshipStatus', e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-md px-3 py-2 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none transition-all duration-300 appearance-none"
                  >
                    <option value="" className="bg-gray-900">Prefer not to say</option>
                    <option value="single" className="bg-gray-900">Single</option>
                    <option value="relationship" className="bg-gray-900">In Relationship</option>
                    <option value="married" className="bg-gray-900">Married</option>
                    <option value="complicated" className="bg-gray-900">It's Complicated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cosmic Practices Section */}
            <div className="bg-gradient-to-br from-purple-900/15 to-pink-900/15 backdrop-blur-sm border border-purple-700/30 rounded-xl p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-sm font-bold text-white mb-2 sm:mb-0 tracking-wide">
                  Cosmic Practices
                </h3>
                <p className="text-xs text-purple-300 font-medium">
                  Select up to 3 practices ({formData.practices.length}/3)
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
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

            {/* Life Focus Section */}
            <div className="bg-gradient-to-br from-pink-900/15 to-purple-900/15 backdrop-blur-sm border border-pink-700/30 rounded-xl p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-sm font-bold text-white mb-2 sm:mb-0 tracking-wide">
                  Life Focus Areas
                </h3>
                <p className="text-xs text-pink-300 font-medium">
                  Select up to 3 areas ({formData.lifeFocus.length}/3)
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
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

            {/* Submit Button */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={isSubmitting || hasSubmitted}
                className="group relative overflow-hidden w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-sm rounded-xl transition-all duration-300 transform hover:scale-105 shadow-xl shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none tracking-wide"
              >
                <span className="relative z-10">
                  {isSubmitting ? 'CREATING YOUR COSMIC JOURNEY...' : 'BEGIN COSMIC JOURNEY'}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              <p className="text-xs text-gray-500 mt-3 font-light">
                7-Day Free trial • No credit card required • $4.99/mo after
              </p>
            </div>
          </form>
        </>
      )}
    </div>
  );
} 
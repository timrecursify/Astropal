import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, Moon, Sun, Mail } from 'lucide-react';
import { FieldTooltip } from '../FieldTooltip';
import { useTaglineVariant } from '../../hooks/useTaglineVariant';

// Variant0 specific confirmation component
const Variant0Confirmation: React.FC<{ userEmail: string }> = ({ userEmail }) => (
  <div className="max-w-2xl mx-auto text-center py-16">
    <div className="mb-8">
      <img 
        src="/Astropal_Logo.png" 
        alt="Astropal Logo" 
        className="w-16 h-16 mx-auto mb-6"
      />
      <h2 className="text-3xl md:text-4xl font-light mb-4">Welcome to your cosmic journey!</h2>
      <p className="text-gray-400 text-lg mb-6">
        Your personalized daily insights are being prepared
      </p>
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 inline-flex items-center space-x-3 mb-8">
        <Mail className="w-5 h-5 text-gray-400" />
        <span className="text-gray-300">{userEmail}</span>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="space-y-3">
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-sm font-mono">1</span>
        </div>
        <h3 className="text-lg font-medium">Check your email</h3>
        <p className="text-sm text-gray-400">Your first cosmic insights are on the way</p>
      </div>
      <div className="space-y-3">
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-sm font-mono">2</span>
        </div>
        <h3 className="text-lg font-medium">Daily delivery</h3>
        <p className="text-sm text-gray-400">Expect your personalized guidance every morning at 6 AM</p>
      </div>
      <div className="space-y-3">
        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-sm font-mono">3</span>
        </div>
        <h3 className="text-lg font-medium">Free for 7 days</h3>
        <p className="text-sm text-gray-400">Explore all features with no commitment</p>
      </div>
    </div>
    
    <p className="text-xs text-gray-500">
      Questions? Contact <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
    </p>
  </div>
);

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
    className={`flex items-center justify-center w-full p-3 text-sm border border-gray-800 hover:border-gray-600 transition-all duration-200 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    } ${checked ? 'bg-white text-black border-white' : 'bg-transparent text-white hover:bg-gray-900'}`}
  >
    <span className="font-medium">{label}</span>
  </button>
);

const Variant0: React.FC = () => {
  const taglineVariant = useTaglineVariant();
  
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

  // Memoized scroll function to prevent reloading
  const scrollToForm = useCallback(() => {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Check for existing submission on component mount ONLY
  useEffect(() => {
    let mounted = true;
    
    const checkSubmissionStatus = () => {
      if (!mounted) return;
      
      try {
        const submittedEmail = localStorage.getItem('astropal_submitted_email');
        const submissionTimestamp = localStorage.getItem('astropal_submission_timestamp');
        
        if (submittedEmail && submissionTimestamp) {
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const submittedTime = parseInt(submissionTimestamp);
          
          if (submittedTime > oneWeekAgo) {
            setFormData(prev => ({ ...prev, email: submittedEmail }));
            setHasSubmitted(true);
            setShowConfirmation(true);
          } else {
            // Clear old submission data
            localStorage.removeItem('astropal_submitted_email');
            localStorage.removeItem('astropal_submission_timestamp');
          }
        }
      } catch (error) {
        console.error('Error checking submission status:', error);
      }
    };

    checkSubmissionStatus();
    
    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once on mount

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
      await submitFormWithTracking(formData as unknown as Record<string, unknown>, 'variant0');
      
      // Fire Facebook Lead conversion event ONLY after successful submission
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Astropal Registration',
          content_category: 'Lead',
          value: 4.99,
          currency: 'USD',
          variant: 'variant0'
        });
      }

      // Store submission data in localStorage
      localStorage.setItem('astropal_submitted_email', formData.email);
      localStorage.setItem('astropal_submission_timestamp', Date.now().toString());
      
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
    <div className="bg-black text-white overflow-hidden">
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
      </nav>

      {/* Hero Section */}
      <section id="hero-section" className="min-h-screen flex flex-col justify-center relative px-6">
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-gradient-to-l from-white/20 to-transparent blur-3xl animate-pulse" style={{animationDuration: '3s'}} />
        <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-gradient-to-r from-orange-500/10 to-transparent blur-3xl animate-pulse" style={{animationDuration: '4s'}} />
        
        <div className="relative max-w-6xl mx-auto py-24">
          <div className="max-w-3xl">
            <div className="text-xs text-gray-500 font-mono mb-8">[ PRECISION COSMIC INTELLIGENCE ]</div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-8">
              {(() => {
                const headline = taglineVariant.headline;
                // Apply subtle highlighting to key cosmic words for minimalist design
                return headline
                  .split(' ')
                  .map((word, index) => {
                    const cosmicWords = ['Cosmic', 'Stars', 'Universe', 'NASA', 'Astrology', 'Oracle', 'Intelligence', 'Advantage', 'Edge', 'Level', 'Advanced'];
                    const isCosmicWord = cosmicWords.some(cosmic => word.toLowerCase().includes(cosmic.toLowerCase()));
                    
                    return (
                      <span key={index}>
                        {isCosmicWord ? (
                          <span className="text-white">{word}</span>
                        ) : (
                          word
                        )}
                        {index < headline.split(' ').length - 1 ? ' ' : ''}
                      </span>
                    );
                  });
              })()}
            </h1>
            <div className="flex items-start space-x-4 mb-12">
              <ArrowRight className="w-4 h-4 mt-1 text-gray-500" />
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
                {taglineVariant.subheadline}
              </p>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="space-y-3">
                <Sparkles className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-medium">NASA-Powered Calculations</h3>
                <p className="text-sm text-gray-400">Real-time planetary positions from official space data with Swiss Ephemeris precision used by experts worldwide.</p>
              </div>
              <div className="space-y-3">
                <Moon className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-medium">Multi-Practice Integration</h3>
                <p className="text-sm text-gray-400">Professional-grade astrology, numerology, tarot, and energy work unified in one intelligent system.</p>
              </div>
              <div className="space-y-3">
                <Sun className="w-6 h-6 text-gray-400" />
                <h3 className="text-lg font-medium">Predictive Intelligence</h3>
                <p className="text-sm text-gray-400">Advanced cosmic weather alerts and optimal timing windows for decisions, backed by scientific precision.</p>
              </div>
            </div>

            {/* API Logos */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 mb-12">
              <div className="text-xs font-mono text-gray-400">NASA</div>
              <div className="text-xs font-mono text-gray-400">JPL HORIZONS</div>
              <div className="text-xs font-mono text-gray-400">SWISS EPHEMERIS</div>
              <div className="text-xs font-mono text-gray-400">EKELEN'S TAROT</div>
              <div className="text-xs font-mono text-gray-400">FENGSHUI API</div>
            </div>

            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium text-sm md:text-base"
            >
              CONFIGURE INTELLIGENCE SYSTEM
            </button>
            <p className="text-xs text-gray-500 mt-3">
              7-Day Free trial • No credit card required • $4.99/mo after
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="form-section" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {showConfirmation ? (
            <Variant0Confirmation userEmail={formData.email} />
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-light mb-4">Configure Your Intelligence System</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  Provide your cosmic coordinates for precision calculations and data-driven insights
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                {/* Personal Info - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      FULL NAME (OPTIONAL)
                      <FieldTooltip content="Your complete legal name is only required when Numerology is selected for accurate calculations" />
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm"
                      required={formData.practices.includes('Numerology')}
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      PREFERRED NAME *
                      <FieldTooltip content="How you'd like to be addressed in your daily cosmic insights" />
                    </label>
                    <input
                      type="text"
                      value={formData.preferredName}
                      onChange={(e) => updateField('preferredName', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      EMAIL *
                      <FieldTooltip content="Where we'll send your personalized daily cosmic guidance" />
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      BIRTH DATE *
                      <FieldTooltip content="Your date of birth for accurate astrological and numerological calculations" />
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField('birthDate', e.target.value)}
                      max={`${new Date().getFullYear() - 18}-12-31`}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm [color-scheme:dark]"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      BIRTH LOCATION *
                      <FieldTooltip content="City, state, and country where you were born for location-based astrological calculations" />
                    </label>
                    <input
                      type="text"
                      value={formData.birthLocation}
                      onChange={(e) => updateField('birthLocation', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm"
                      placeholder="City, State, Country"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      TIME ZONE
                      <FieldTooltip content="Your current time zone for delivering content at the perfect moment" />
                    </label>
                    <select
                      value={formData.timeZone}
                      onChange={(e) => updateField('timeZone', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm appearance-none [color-scheme:dark]"
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

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      DAY START TIME
                      <FieldTooltip content="When your day typically begins - we'll deliver your cosmic insights at the perfect moment" />
                    </label>
                    <input
                      type="time"
                      value={formData.dayStartTime}
                      onChange={(e) => updateField('dayStartTime', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      BIRTH TIME
                      <FieldTooltip content="Your exact time of birth for precise astrological chart calculations. Select 'Unknown' if uncertain" />
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={formData.birthTime === 'unknown' ? '' : formData.birthTime}
                        onChange={(e) => updateField('birthTime', e.target.value)}
                        className="flex-1 bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm [color-scheme:dark]"
                        disabled={formData.birthTime === 'unknown'}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.birthTime === 'unknown') {
                            updateField('birthTime', '');
                          } else {
                            updateField('birthTime', 'unknown');
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          formData.birthTime === 'unknown' 
                            ? 'bg-purple-600 text-white' 
                            : 'text-gray-500 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        UNKNOWN
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-gray-400 mb-2">
                      RELATIONSHIP STATUS
                      <FieldTooltip content="Optional information to personalize relationship and love-focused content" />
                    </label>
                    <select
                      value={formData.relationshipStatus}
                      onChange={(e) => updateField('relationshipStatus', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-800 pb-2 text-white focus:border-white focus:outline-none text-sm appearance-none [color-scheme:dark]"
                    >
                      <option value="" className="bg-gray-900">Prefer not to say</option>
                      <option value="single" className="bg-gray-900">Single</option>
                      <option value="relationship" className="bg-gray-900">In Relationship</option>
                      <option value="married" className="bg-gray-900">Married</option>
                      <option value="complicated" className="bg-gray-900">It's Complicated</option>
                    </select>
                  </div>
                </div>

                {/* Cosmic Practices - Mobile Optimized */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-xs text-gray-400 mb-2 sm:mb-0">COSMIC PRACTICES</h3>
                    <p className="text-xs text-gray-600">
                      Select up to 3 practices ({formData.practices.length}/3)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

                {/* Life Focus - Mobile Optimized */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-xs text-gray-400 mb-2 sm:mb-0">LIFE FOCUS</h3>
                    <p className="text-xs text-gray-600">
                      Select up to 3 areas ({formData.lifeFocus.length}/3)
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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

                {/* Submit Button - Mobile Optimized */}
                <div className="pt-6 text-center">
                  <button
                    type="submit"
                    disabled={hasSubmitted || isSubmitting}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium mb-3 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'ACTIVATING...' : hasSubmitted ? 'THANK YOU FOR SIGNING UP!' : 'ACTIVATE INTELLIGENCE SYSTEM'}
                  </button>
                  <p className="text-xs text-gray-500">
                    7-Day Free trial • No credit card required • $4.99/mo after
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Variant0; 
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { SignUpData, signUpSchema, sanitizeInput, sanitizeLocation, checkSubmissionRate, createHoneypotField, generateCSRFToken } from '../lib/validation';
import { useRegister } from '../lib/api';
import { useLogger } from '../lib/logger';
import FocusSelector from './FocusSelector';
import { FieldTooltip } from './Tooltip';
import ConfirmationBlock from './ConfirmationBlock';
import { useState, useEffect } from 'react';

export default function SignUpForm() {
  const t = useTranslations('signup');
  const { logUserAction, logError, logInfo } = useLogger('SignUpForm');
  const searchParams = useSearchParams();
  const registerMutation = useRegister();
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [csrfToken] = useState(() => generateCSRFToken());
  const [honeypotValue, setHoneypotValue] = useState('');
  const honeypotField = createHoneypotField();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      locale: 'en', // Will be set from current locale
      referral: searchParams.get('r') || undefined,
      focuses: [],
    },
  });

  // Check for rate limiting on component mount
  useEffect(() => {
    const checkRateLimit = () => {
      const lastSubmissionTime = localStorage.getItem('astropal_last_submission');
      const submittedEmail = localStorage.getItem('astropal_submitted_email');
      
      if (lastSubmissionTime && submittedEmail) {
        const timeDiff = Date.now() - parseInt(lastSubmissionTime);
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
        
        if (timeDiff < cooldownPeriod) {
          setIsRateLimited(true);
          setLastSubmission(submittedEmail);
        }
      }
    };

    checkRateLimit();
  }, []);

  const handleFocusChange = (focuses: string[]) => {
    setSelectedFocuses(focuses);
    setValue('focuses', focuses);
  };

  const onSubmit = async (data: SignUpData) => {
    // Security checks
    
    // 1. Honeypot check (bot detection)
    if (honeypotValue) {
      logError(new Error('Bot detected'), { honeypotValue, email: data.email });
      return; // Silent fail for bots
    }
    
    // 2. Rate limiting check
    if (isRateLimited || !checkSubmissionRate(data.email)) {
      alert('You have already submitted a registration recently. Please check your email or try again later.');
      logInfo('Rate limit triggered', { email: data.email });
      return;
    }

    // 3. Input sanitization
    const sanitizedData = {
      ...data,
      email: data.email.toLowerCase().trim(),
      birthLocation: sanitizeLocation(data.birthLocation),
      focuses: data.focuses.filter(focus => ['relationships', 'career', 'wellness', 'social', 'spiritual', 'evidence-based'].includes(focus)),
      csrfToken // Include CSRF token
    };

    try {
      await registerMutation.mutateAsync(sanitizedData);
      
      // Set rate limiting
      localStorage.setItem('astropal_last_submission', Date.now().toString());
      localStorage.setItem('astropal_submitted_email', data.email);
      
      // Log successful submission
      logUserAction('registration_success', {
        email: data.email,
        focuses: data.focuses,
        funnel_step: 'registration_success'
      });
      
      // Show confirmation modal
      setConfirmedEmail(data.email);
      setShowConfirmation(true);
      
      // Set rate limited state
      setIsRateLimited(true);
      setLastSubmission(data.email);
      
    } catch (error) {
      logError(error as Error, { 
        email: data.email,
        action: 'signup_validation'
      });
      
      // Check if error is due to existing email
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        alert('This email is already registered. Please check your inbox or try signing in.');
        // Set rate limiting for existing email too
        localStorage.setItem('astropal_last_submission', Date.now().toString());
        localStorage.setItem('astropal_submitted_email', data.email);
        setIsRateLimited(true);
        setLastSubmission(data.email);
      } else {
        alert('Registration failed. Please try again.');
      }
    }
  };

  // Get current email value for duplicate checking
  const currentEmail = watch('email');



  if (isRateLimited && lastSubmission) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto text-center">
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
            Registration Already Submitted
          </h3>
          <p className="text-gray-300 mb-4">
            You've already registered with <strong>{lastSubmission}</strong>
          </p>
          <p className="text-sm text-gray-400">
            Please check your inbox for the verification email, or try again in 24 hours.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {showConfirmation ? (
        /* Confirmation Block */
        <ConfirmationBlock
          userEmail={confirmedEmail}
          variant="default"
        />
      ) : (
        <>
          {/* Focus Selection Step */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <FocusSelector 
              onFocusChange={handleFocusChange}
              maxSelections={3}
              variant="signup"
            />
            {errors.focuses && (
              <p className="mt-2 text-sm text-red-400 text-center">{errors.focuses.message}</p>
            )}
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Honeypot field for bot detection */}
            <input
              {...honeypotField}
              value={honeypotValue}
              onChange={(e) => setHoneypotValue(e.target.value)}
            />
            
            {/* CSRF Token */}
            <input type="hidden" name="csrfToken" value={csrfToken} />
            
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Field (narrower) */}
          <div className="md:col-span-1">
            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              {t('email')}
              <FieldTooltip content="We'll send your personalized astrology newsletter to this email address. You can unsubscribe anytime." />
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="your@email.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              maxLength={254}
              required
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">{errors.email.message}</p>
            )}
          </div>

          {/* Date of Birth Field */}
          <div className="md:col-span-1">
            <label htmlFor="dob" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              {t('dateOfBirth')}
              <FieldTooltip content="Your birth date is essential for calculating your personal birth chart and planetary positions." />
            </label>
            <input
              {...register('dob')}
              type="date"
              id="dob"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-500 transition-colors"
              autoComplete="bday"
              required
              min="1904-01-01"
              max={new Date().toISOString().split('T')[0]}
              aria-describedby={errors.dob ? "dob-error" : undefined}
            />
            {errors.dob && (
              <p id="dob-error" className="mt-1 text-sm text-red-400" role="alert">{errors.dob.message}</p>
            )}
          </div>

          {/* Birth Location Field */}
          <div className="md:col-span-1">
            <label htmlFor="birthLocation" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              Birth Location
              <FieldTooltip content="Your birth location helps us calculate accurate rising signs and house positions for precise readings." />
            </label>
            <input
              {...register('birthLocation')}
              type="text"
              id="birthLocation"
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="City, Country"
              autoComplete="address-level2 address-level1"
              autoCapitalize="words"
              spellCheck="true"
              maxLength={100}
              required
              pattern="^[a-zA-Z\s,'-.\u00C0-\u017F\u0100-\u01FF]+$"
              aria-describedby={errors.birthLocation ? "location-error" : undefined}
            />
            {errors.birthLocation && (
              <p id="location-error" className="mt-1 text-sm text-red-400" role="alert">{errors.birthLocation.message}</p>
            )}
          </div>
        </div>

        <input {...register('locale')} type="hidden" />
        <input {...register('referral')} type="hidden" />

        <button
          type="submit"
          disabled={registerMutation.isPending || selectedFocuses.length === 0 || isRateLimited || !!honeypotValue}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:hover:from-purple-600 disabled:hover:to-pink-600"
          aria-describedby={selectedFocuses.length === 0 ? "focus-requirement" : undefined}
        >
          {registerMutation.isPending ? t('submitting') : t('submit')}
        </button>

        {selectedFocuses.length === 0 && (
          <p id="focus-requirement" className="text-center text-sm text-gray-500" role="alert">
            Please select at least one focus area to continue
          </p>
        )}

            <p className="text-center text-xs text-gray-500">
              By signing up, you agree to receive personalized astrology newsletters. You can unsubscribe anytime.
            </p>
          </form>
        </>
      )}
    </div>
  );
}
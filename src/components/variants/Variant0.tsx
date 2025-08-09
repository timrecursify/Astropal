import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Sparkles, Moon, Sun } from 'lucide-react';
import { useTaglineVariant } from '../../hooks/useTaglineVariant';
import { getStableTimezone, safeLocalStorageGet, safeLocalStorageRemove } from '../../utils/browserUtils';
import EnhancedConfirmation from '../EnhancedConfirmation';
import { getCtaVariant } from '../../utils/ctaVariants';
import { useLogger } from '../../hooks/useLogger';

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

const Variant0: React.FC = () => {
  const taglineVariant = useTaglineVariant();
  const { logUserAction, logError } = useLogger('Variant0');
  const cta = getCtaVariant();

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    preferredName: '',
    email: '',
    birthDate: '',
    birthLocation: '',
    timeZone: getStableTimezone(),
    dayStartTime: '07:00',
    birthTime: '',
    relationshipStatus: '',
    practices: [],
    lifeFocus: [],
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  // Scroll to form
  const scrollToForm = useCallback(() => {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
    logUserAction('scroll_to_form');
  }, [logUserAction]);

  // Check for existing submission on component mount ONLY
  useEffect(() => {
    let mounted = true;
    const checkSubmissionStatus = () => {
      if (!mounted) return;
      try {
        const submittedEmail = safeLocalStorageGet('astropal_submitted_email');
        const submissionTimestamp = safeLocalStorageGet('astropal_submission_timestamp');
        if (submittedEmail && submissionTimestamp) {
          const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
          const submittedTime = parseInt(submissionTimestamp);
          if (submittedTime > oneWeekAgo) {
            setFormData(prev => ({ ...prev, email: submittedEmail }));
            setShowConfirmation(true);
          } else {
            safeLocalStorageRemove('astropal_submitted_email');
            safeLocalStorageRemove('astropal_submission_timestamp');
          }
        }
      } catch (error) {
        logError(error, { phase: 'checkSubmissionStatus' });
      }
    };
    checkSubmissionStatus();
    return () => { mounted = false; };
  }, [logError]);

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <img src="/Astropal_Logo.png" alt="Astropal Logo" className="w-8 h-8" />
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
                return headline.split(' ').map((word, index) => {
                  const cosmicWords = ['Cosmic','Astrology','Daily','Brief','Timing','Power','Love','Career','Wellbeing','Guidance','Advantage'];
                  const highlight = cosmicWords.some(c => word.toLowerCase().includes(c.toLowerCase()));
                  return <span key={index}>{highlight ? <span className="text-white">{word}</span> : word}{index < headline.split(' ').length - 1 ? ' ' : ''}</span>;
                });
              })()}
            </h1>
            <div className="flex items-start space-x-4 mb-6">
              <ArrowRight className="w-4 h-4 mt-1 text-gray-500" />
              <p className="text-gray-400 text-sm leading-relaxed max-w-lg">{taglineVariant.subheadline}</p>
            </div>

            {/* CTA Only */}
            <div className="flex items-center justify-center mb-10">
              <button onClick={scrollToForm} className="w-full sm:w-auto px-6 md:px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium text-sm md:text-base">
                {cta.label}
              </button>
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
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section id="form-section" className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          {showConfirmation ? (
            <EnhancedConfirmation userEmail={formData.email} variant="variant0" />
          ) : (
            <></>
          )}
        </div>
      </section>
    </div>
  );
};

export default Variant0; 
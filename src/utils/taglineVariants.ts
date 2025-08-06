// Tagline A/B Testing System
// This file manages all tagline variants and their selection logic

export interface TaglineVariant {
  id: string;
  category: string;
  headline: string;
  subheadline: string;
  testingNotes: string;
}

export const TAGLINE_VARIANTS: TaglineVariant[] = [
  // CURIOSITY-DRIVEN VARIANTS
  {
    id: 'CUR-001',
    category: 'Curiosity-Driven',
    headline: 'What Did the Stars Plan for You Today?',
    subheadline: 'Your personalized cosmic forecast, delivered fresh every morning',
    testingNotes: 'Question-based hook, daily anticipation, personal relevance'
  },
  {
    id: 'CUR-002',
    category: 'Curiosity-Driven',
    headline: 'The Universe Has a Message for You',
    subheadline: "Don't miss what the cosmos revealed about your day",
    testingNotes: 'Urgency, FOMO, direct personal address'
  },

  // CONVENIENCE/ROUTINE VARIANTS
  {
    id: 'CON-001',
    category: 'Convenience/Routine',
    headline: 'Your Daily Dose of Cosmic Clarity',
    subheadline: '5 minutes. One email. Infinite possibilities.',
    testingNotes: 'Medical/supplement metaphor, time efficiency, brevity'
  },
  {
    id: 'CON-002',
    category: 'Convenience/Routine',
    headline: 'Skip the Tarot Cards. Get Your Answers Here.',
    subheadline: 'Modern cosmic guidance without the guesswork',
    testingNotes: 'Competitor comparison, convenience over traditional methods'
  },

  // SCIENTIFIC/CREDIBILITY VARIANTS
  {
    id: 'SCI-001',
    category: 'Scientific/Credibility',
    headline: 'NASA-Powered Astrology That Actually Works',
    subheadline: 'Real space data meets ancient wisdom in your inbox',
    testingNotes: 'Authority, credibility, "real" vs "fake" astrology'
  },
  {
    id: 'SCI-002',
    category: 'Scientific/Credibility',
    headline: 'Finally, Astrology with Actual Astronomy',
    subheadline: 'Swiss precision meets cosmic insight, delivered daily',
    testingNotes: 'Quality differentiation, European luxury association'
  },

  // TRANSFORMATION/OUTCOME VARIANTS
  {
    id: 'TRA-001',
    category: 'Transformation/Outcome',
    headline: 'Stop Wondering. Start Knowing.',
    subheadline: 'Daily cosmic intel that puts you ahead of the game',
    testingNotes: 'Confidence building, competitive advantage, certainty'
  },
  {
    id: 'TRA-002',
    category: 'Transformation/Outcome',
    headline: 'Your Unfair Cosmic Advantage',
    subheadline: "While others guess, you'll know exactly when to act",
    testingNotes: 'Exclusivity, timing benefits, superiority'
  },

  // MASS APPEAL/BROADER AUDIENCE VARIANTS
  {
    id: 'MAS-001',
    category: 'Mass Appeal/Broader Audience',
    headline: "Everyone's Talking About Their Daily Cosmic Brief",
    subheadline: 'Join thousands getting their edge from the stars',
    testingNotes: 'Social proof, mainstream acceptance, FOMO'
  },
  {
    id: 'MAS-002',
    category: 'Mass Appeal/Broader Audience',
    headline: 'The Newsletter Smart People Read Before Coffee',
    subheadline: 'Strategic cosmic insights for the modern professional',
    testingNotes: 'Intelligence positioning, professional appeal, male targeting'
  },

  // URGENCY/SCARCITY VARIANTS
  {
    id: 'URG-001',
    category: 'Urgency/Scarcity',
    headline: "Don't Navigate Today Blind",
    subheadline: 'Your cosmic compass arrives at dawn',
    testingNotes: 'Problem awareness, daily necessity, guidance metaphor'
  },
  {
    id: 'URG-002',
    category: 'Urgency/Scarcity',
    headline: "Today's Cosmic Weather Report",
    subheadline: 'Essential intel for navigating your day ahead',
    testingNotes: 'Weather metaphor, essential service positioning'
  },

  // MYSTICAL/MAGICAL VARIANTS
  {
    id: 'MYS-001',
    category: 'Mystical/Magical',
    headline: 'Your Personal Oracle, Delivered Daily',
    subheadline: 'Ancient secrets, decoded for modern life',
    testingNotes: 'Oracle positioning, ancient wisdom appeal'
  },
  {
    id: 'MYS-002',
    category: 'Mystical/Magical',
    headline: 'The Stars Whisper. We Translate.',
    subheadline: 'Your daily dose of cosmic intelligence',
    testingNotes: 'Mystical communication, translation service'
  },

  // LIFESTYLE/ASPIRATIONAL VARIANTS
  {
    id: 'LIF-001',
    category: 'Lifestyle/Aspirational',
    headline: 'Level Up Your Life with Cosmic Timing',
    subheadline: 'Daily guidance for ambitious souls',
    testingNotes: 'Gaming terminology, ambition targeting, timing benefits'
  },
  {
    id: 'LIF-002',
    category: 'Lifestyle/Aspirational',
    headline: 'The Cosmic Edge Every High Achiever Needs',
    subheadline: 'Strategic astrology for people who get things done',
    testingNotes: 'Achievement-oriented, professional targeting, results focus'
  },

  // SIMPLICITY/ACCESSIBILITY VARIANTS
  {
    id: 'SIM-001',
    category: 'Simplicity/Accessibility',
    headline: 'Astrology Made Simple. Results Made Real.',
    subheadline: 'No crystal balls required – just real guidance',
    testingNotes: 'Simplification, accessibility, practical results'
  },
  {
    id: 'SIM-002',
    category: 'Simplicity/Accessibility',
    headline: 'Cosmic Guidance for Normal People',
    subheadline: 'Finally, astrology that makes sense and fits your life',
    testingNotes: 'Relatability, normalizing astrology, life integration'
  },

  // COMPARISON/ALTERNATIVE VARIANTS
  {
    id: 'COM-001',
    category: 'Comparison/Alternative',
    headline: 'Better Than Your Horoscope',
    subheadline: 'Personalized cosmic intelligence vs generic predictions',
    testingNotes: 'Direct competitor comparison, personalization benefits'
  },
  {
    id: 'COM-002',
    category: 'Comparison/Alternative',
    headline: "This Isn't Your Newspaper Horoscope",
    subheadline: 'Precision cosmic guidance powered by real space data',
    testingNotes: 'Quality differentiation, data credibility'
  }
];

// Default tagline (fallback)
export const DEFAULT_TAGLINE: TaglineVariant = {
  id: 'DEFAULT',
  category: 'Default',
  headline: 'Unlock Your Cosmic Potential Every Morning',
  subheadline: 'Transform your life with personalized spiritual guidance that reveals your hidden strengths and perfect timing',
  testingNotes: 'Original default tagline'
};

/**
 * Generate a consistent tagline variant selection based on session
 * Uses a hash of session ID and timestamp to ensure consistent selection per user
 */
export function getTaglineVariant(): TaglineVariant {
  try {
    // Check if we already have a stored tagline variant for this session
    const storedVariantId = sessionStorage.getItem('astropal_tagline_variant');
    
    if (storedVariantId) {
      const storedVariant = TAGLINE_VARIANTS.find(v => v.id === storedVariantId);
      if (storedVariant) {
        return storedVariant;
      }
    }

    // Generate new variant selection
    const sessionId = getSessionId();
    const variantIndex = hashString(sessionId) % TAGLINE_VARIANTS.length;
    const selectedVariant = TAGLINE_VARIANTS[variantIndex];

    // Store the selection for consistency
    sessionStorage.setItem('astropal_tagline_variant', selectedVariant.id);
    
    return selectedVariant;
  } catch (error) {
    console.warn('Error getting tagline variant:', error);
    return DEFAULT_TAGLINE;
  }
}

/**
 * Get current tagline variant ID for tracking
 */
export function getTaglineVariantId(): string {
  try {
    const variant = getTaglineVariant();
    return variant.id;
  } catch (error) {
    console.warn('Error getting tagline variant ID:', error);
    return DEFAULT_TAGLINE.id;
  }
}

/**
 * Simple hash function for consistent variant selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get or create a session ID for consistent variant selection
 */
function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem('astropal_session_id');
    
    if (!sessionId) {
      // Generate a new session ID based on timestamp and random
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('astropal_session_id', sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Reset tagline variant (for testing purposes)
 */
export function resetTaglineVariant(): void {
  try {
    sessionStorage.removeItem('astropal_tagline_variant');
  } catch (error) {
    console.warn('Error resetting tagline variant:', error);
  }
}

/**
 * Get all available tagline variants (for admin/testing purposes)
 */
export function getAllTaglineVariants(): TaglineVariant[] {
  return TAGLINE_VARIANTS;
}
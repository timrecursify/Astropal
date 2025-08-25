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
  // Timing / Outcome (intent: daily planning, confidence)
  {
    id: 'OUT-001',
    category: 'Timing/Outcome',
    headline: 'Know When to Act Today.',
    subheadline: 'Daily power hours and cautions so choices feel easy',
    testingNotes: 'Tests “timing solves indecision” intent'
  },
  // Relationships (intent: love/connection guidance)
  {
    id: 'REL-101',
    category: 'Relationships',
    headline: 'Better Days for Love and Connection.',
    subheadline: 'Gentle, practical guidance for conversations and closeness',
    testingNotes: 'Tests relationship‑seeker intent'
  },
  // Emotional balance / wellbeing (intent: calm, ease)
  {
    id: 'EMO-201',
    category: 'Wellbeing',
    headline: 'Start Calm. Stay Centered.',
    subheadline: 'Morning highlights to avoid friction and keep your flow',
    testingNotes: 'Tests mood/peace intent'
  },
  // Credibility / trust (intent: “is this legit?”)
  {
    id: 'CRD-501',
    category: 'Credibility',
    headline: 'Clear Guidance, Real Signals.',
    subheadline: 'Daily cosmic highlights distilled from reliable data',
    testingNotes: 'Tests trust/cred intent without tech jargon'
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
    // TTL-based persistence across sessions (7 days)
    const raw = localStorage.getItem('astropal_tagline_variant_v2');
    if (raw) {
      const parsed = JSON.parse(raw) as { id: string; expiry: number };
      if (Date.now() < parsed.expiry) {
        const found = TAGLINE_VARIANTS.find(v => v.id === parsed.id);
        if (found) return found;
      }
    }

    // Generate new selection
    const sessionId = getSessionId();
    const variantIndex = hashString(sessionId) % TAGLINE_VARIANTS.length;
    const selectedVariant = TAGLINE_VARIANTS[variantIndex];

    // Persist with TTL
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('astropal_tagline_variant_v2', JSON.stringify({ id: selectedVariant.id, expiry: Date.now() + sevenDaysMs }));
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
  } catch {
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
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('astropal_session_id', sessionId);
    }
    return sessionId;
  } catch {
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Reset tagline variant (for testing purposes)
 */
export function resetTaglineVariant(): void {
  try {
    localStorage.removeItem('astropal_tagline_variant_v2');
  } catch {
    // no-op
  }
}

/**
 * Get all available tagline variants (for admin/testing purposes)
 */
export function getAllTaglineVariants(): TaglineVariant[] {
  return TAGLINE_VARIANTS;
}
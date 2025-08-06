import { useState, useEffect } from 'react';
import { getTaglineVariant, TaglineVariant, DEFAULT_TAGLINE } from '../utils/taglineVariants';

/**
 * Hook for managing tagline A/B testing
 * Returns the current tagline variant for the user's session
 */
export function useTaglineVariant(): TaglineVariant {
  const [taglineVariant, setTaglineVariant] = useState<TaglineVariant>(DEFAULT_TAGLINE);
  
  useEffect(() => {
    try {
      const variant = getTaglineVariant();
      setTaglineVariant(variant);
    } catch (error) {
      console.warn('Error loading tagline variant:', error);
      setTaglineVariant(DEFAULT_TAGLINE);
    }
  }, []);
  
  return taglineVariant;
}
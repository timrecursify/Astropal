'use client';

import { useEffect, useState } from 'react';
import { VariantA, VariantB, VariantC, VariantD } from '../../components/variants';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useLogger } from '../../lib/logger';

const variants = [
  { id: 'A', component: VariantA, name: 'Cosmic Calm', perspective: 'calm' },
  { id: 'B', component: VariantB, name: 'Know Before You Text', perspective: 'knowledge' },
  { id: 'C', component: VariantC, name: 'Time Your Success', perspective: 'success' },
  { id: 'D', component: VariantD, name: 'Precision Astrology', perspective: 'evidence' }
];

export default function HomePage() {
  const { logUserAction, logInfo } = useLogger('HomePage');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side before accessing localStorage
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    try {
      // Check if user has a stored variant preference
      const storedVariant = localStorage?.getItem('astropal_variant');
      
      let chosenVariant;
      
      if (storedVariant && variants.some(v => v.id === storedVariant)) {
        // Use stored variant
        chosenVariant = variants.find(v => v.id === storedVariant);
        logInfo('Using stored variant', { variantId: storedVariant });
      } else {
        // Randomly select a variant
        const randomIndex = Math.floor(Math.random() * variants.length);
        chosenVariant = variants[randomIndex];
        
        // Store the selection for consistency during the session
        try {
          localStorage?.setItem('astropal_variant', chosenVariant.id);
        } catch (e) {
          // Ignore localStorage errors (e.g., in incognito mode)
          console.warn('Could not save variant preference:', e);
        }
        
        logUserAction('random_variant_assigned', {
          variantId: chosenVariant.id,
          variantName: chosenVariant.name,
          perspective: chosenVariant.perspective
        });
      }
      
      setSelectedVariant(chosenVariant);
    } catch (error) {
      // Fallback to first variant if there's any error
      console.warn('Error accessing localStorage, using fallback variant:', error);
      setSelectedVariant(variants[0]);
    } finally {
      setIsLoading(false);
    }
  }, [isClient, logUserAction, logInfo]);

  // Show loading state while determining variant
  if (isLoading || !selectedVariant || !isClient) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your cosmic experience...</p>
        </div>
      </div>
    );
  }

  // Render the selected variant
  const VariantComponent = selectedVariant.component;
  
  return (
    <div className="relative">
      {/* Add language switcher overlay */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>
      
      {/* Render the selected variant */}
      <VariantComponent />
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { getUserVariant, type VariantType } from '../utils/abTesting';
import { loadTrackingScripts } from '../utils/trackingLoader';
import Variant0 from './variants/Variant0';
import Variant1 from './variants/Variant1';
import Variant2 from './variants/Variant2';

// Type declaration for Clarity
declare global {
  interface Window {
    clarity?: (command: string, key: string, value: string) => void;
  }
}

const ABTestRouter: React.FC = () => {
  const [variant, setVariant] = useState<VariantType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Client-side only variant assignment to avoid hydration issues
    const assignedVariant = getUserVariant();
    setVariant(assignedVariant);
    setIsLoading(false);

    // Load tracking scripts for main pages
    loadTrackingScripts();

    // Track with Clarity if available (after loading)
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.clarity) {
        window.clarity('set', 'ab_variant', assignedVariant);
      }
    }, 1000);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/Astropal_Logo.png" 
            alt="Astropal Logo" 
            className="w-8 h-8 animate-pulse"
          />
          <span className="font-mono text-white text-lg">ASTROPAL</span>
        </div>
      </div>
    );
  }

  // Render the assigned variant
  switch (variant) {
    case 'variant0':
      return <Variant0 />;
    case 'variant1':
      return <Variant1 />;
    case 'variant2':
      return <Variant2 />;
    default:
      // Fallback to variant0 if something goes wrong
      return <Variant0 />;
  }
};

export default ABTestRouter; 
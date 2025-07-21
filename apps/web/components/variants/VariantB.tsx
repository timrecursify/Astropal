'use client';

import React from 'react';
import { StarField } from '../cosmic';
import VariantNavigation from '../VariantNavigation';
import VariantBHero from './VariantB/Hero';
import VariantBPricing from './VariantB/Pricing';

export default function VariantB() {
  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden">
      <VariantNavigation />
      <StarField />
      
      {/* Main Content - Full viewport with no scroll */}
      <div className="absolute inset-0 pt-20 flex">
        
        {/* LEFT SECTION - Hero Content */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-2xl">
            <VariantBHero />
          </div>
        </div>
        
        {/* RIGHT SECTION - Pricing Sidebar */}
        <div className="hidden lg:flex w-[400px] bg-pink-900/20 border-l border-pink-800/30 p-6 overflow-y-auto">
          <div className="w-full">
            <VariantBPricing />
          </div>
        </div>
      </div>
      
      {/* Mobile Pricing - Below hero on small screens */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-black/95 border-t border-pink-800/30 p-4 max-h-[50vh] overflow-y-auto">
        <VariantBPricing />
      </div>
    </div>
  );
} 
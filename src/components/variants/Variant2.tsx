import React from 'react';
import { StarField } from '../cosmic';
import Variant2Hero from './Variant2Hero';
import Variant2Form from './Variant2Form';
import Footer from '../Footer';

export default function Variant2() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      {/* StarField Background - Ensure it's visible */}
      <div className="fixed inset-0 z-0">
        <StarField />
      </div>
      
      {/* Content container with proper z-index */}
      <div className="relative z-10 overflow-x-hidden">
        {/* Hero Section - Top of page with mobile optimization */}
        <section className="pt-12 md:pt-16 pb-12 md:pb-16 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <Variant2Hero />
          </div>
        </section>

        {/* Form Section - Centered below hero with mobile optimization */}
        <section className="pb-24 md:pb-32 px-4 md:px-6">
          <Variant2Form />
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
} 
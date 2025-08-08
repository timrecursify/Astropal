import React from 'react';
import { StarField } from '../cosmic';
import Variant2Hero from './Variant2Hero';
import Variant2Form from './Variant2Form';
import Footer from '../Footer';
import { useLogger } from '../../hooks/useLogger';
import Benefits from '../Benefits';
import Reviews from '../Reviews';

export default function Variant2() {
  const { logInfo } = useLogger('Variant2');
  logInfo('render');
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
        <section id="form-section" className="pb-24 md:pb-32 px-4 md:px-6">
          <Variant2Form />
        </section>

        {/* Benefits + Reviews to reinforce after form */}
        <section className="pb-16 md:pb-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <Benefits />
          </div>
        </section>
        <section className="pb-16 md:pb-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <Reviews />
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
} 
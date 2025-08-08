import React from 'react';
import { StarField, TerminalAnimation } from '../cosmic';
import Variant1Hero from './Variant1Hero';
import Variant1Form from './Variant1Form';
import Benefits from '../Benefits';
import Reviews from '../Reviews';
import Footer from '../Footer';
import { useLogger } from '../../hooks/useLogger';

export default function Variant1() {
  const { logInfo } = useLogger('Variant1');
  
  // Log initial render
  logInfo('render');
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* StarField Background - Fixed positioning */}
      <div className="fixed inset-0 z-0">
        <StarField />
      </div>
      
      {/* Single Column Layout - Works on all devices */}
      <div className="relative z-10 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-12">
          
          {/* Hero Section */}
          <section className="mb-16 md:mb-20">
            <div className="max-w-4xl mx-auto text-center">
              <Variant1Hero />
            </div>
          </section>

          {/* Form Section - Move earlier for conversion */}
          <section id="form-section" className="mb-16 md:mb-20">
            <div className="max-w-7xl mx-auto">
              <div className="bg-purple-900/20 backdrop-blur-sm border border-purple-800/30 rounded-xl p-6 md:p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Start Your <span className="text-purple-400">Cosmic Journey</span></h2>
                  <p className="text-gray-400">Get your first personalized daily brief</p>
                </div>
                <div className="max-w-6xl mx-auto">
                  <Variant1Form />
                </div>
              </div>
            </div>
          </section>

          {/* Terminal Animation Section (moved below form) */}
          <section className="mb-16 md:mb-20">
            <div className="max-w-4xl mx-auto text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                See Your <span className="text-purple-400">Cosmic Data</span> Come to Life
              </h2>
              <p className="text-gray-400 text-lg">
                Watch how we generate your personalized cosmic guidance in real-time
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <TerminalAnimation />
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-16 md:mb-20">
            <div className="max-w-6xl mx-auto">
              <Benefits />
            </div>
          </section>

          {/* Reviews Section */}
          <section className="mb-16 md:mb-20">
            <div className="max-w-6xl mx-auto">
              <Reviews />
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
} 
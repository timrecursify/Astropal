import React, { useState } from 'react';
import { StarField } from '../cosmic';
import Variant1Hero from './Variant1Hero';
import Variant1Form from './Variant1Form';
import Footer from '../Footer';
import { Menu, X } from 'lucide-react';

export default function Variant1() {
  const [showMobileForm, setShowMobileForm] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* StarField Background - Fixed positioning */}
      <div className="fixed inset-0 z-0">
        <StarField />
      </div>
      
      {/* Desktop Layout - Side by side (1200px+) */}
      <div className="hidden xl:flex min-h-screen relative z-10">
        {/* LEFT SECTION - Hero Content */}
        <div className="flex-1 overflow-y-auto h-screen">
          <div className="p-8 pt-12 min-h-full">
            <div className="w-full max-w-2xl mx-auto">
              <Variant1Hero />
            </div>
          </div>
        </div>
        
        {/* RIGHT SECTION - Form Sidebar */}
        <div className="w-[400px] bg-purple-900/20 backdrop-blur-sm border-l border-purple-800/30 overflow-y-auto h-screen">
          <div className="p-6 min-h-full">
            <Variant1Form />
          </div>
        </div>
      </div>

      {/* Large Tablet Layout - Side by side but narrower (1024px-1199px) */}
      <div className="hidden lg:block xl:hidden relative z-10">
        <div className="min-h-screen flex">
          <div className="flex-1 overflow-y-auto h-screen">
            <div className="p-6 pt-12 min-h-full">
              <div className="w-full max-w-xl mx-auto">
                <Variant1Hero />
              </div>
            </div>
          </div>
          <div className="w-[360px] bg-purple-900/20 backdrop-blur-sm border-l border-purple-800/30 overflow-y-auto h-screen">
            <div className="p-4 min-h-full">
              <Variant1Form />
            </div>
          </div>
        </div>
      </div>

      {/* Medium Tablet Layout - Stacked with proper spacing (768px-1023px) */}
      <div className="hidden md:block lg:hidden relative z-10">
        <div className="min-h-screen overflow-y-auto overflow-x-hidden">
          <div className="min-h-screen flex items-center justify-center p-8 pt-16">
            <div className="w-full max-w-2xl">
              <Variant1Hero />
            </div>
          </div>
          <div className="min-h-screen bg-purple-900/20 backdrop-blur-sm border-t border-purple-800/30 p-8">
            <div className="max-w-2xl mx-auto">
              <Variant1Form />
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* Small Tablet Layout - Optimized stacking (640px-767px) */}
      <div className="hidden sm:block md:hidden relative z-10">
        <div className="min-h-screen overflow-y-auto overflow-x-hidden">
          <div className="min-h-screen flex items-center justify-center p-6 pt-12 pb-20">
            <div className="w-full max-w-lg">
              <Variant1Hero />
            </div>
          </div>
          <button
            onClick={() => setShowMobileForm(true)}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white text-black px-6 py-3 rounded-full font-semibold shadow-2xl hover:bg-gray-200 transition-colors flex items-center space-x-2 max-w-[calc(100vw-3rem)] mx-auto"
          >
            <Menu className="w-4 h-4" />
            <span className="text-sm">CUSTOMIZE NEWSLETTER</span>
          </button>
          <Footer />
        </div>
      </div>

      {/* Mobile Layout - Hero with slide-over form (0-639px) */}
      <div className="block sm:hidden relative z-10">
        <div className="min-h-screen flex flex-col relative overflow-y-auto overflow-x-hidden">
          <button
            onClick={() => setShowMobileForm(true)}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-white text-black px-4 py-3 rounded-full font-semibold shadow-2xl hover:bg-gray-200 transition-colors flex items-center space-x-2 max-w-[calc(100vw-2rem)]"
          >
            <Menu className="w-4 h-4" />
            <span className="text-sm">GET STARTED</span>
          </button>
          <div className="flex-1 flex items-center justify-center p-4 pt-8 pb-20 min-h-screen">
            <div className="w-full max-w-sm">
              <Variant1Hero />
            </div>
          </div>
          <Footer />
        </div>
      </div>

      {/* Universal Mobile Slide-over Form */}
      {showMobileForm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMobileForm(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-black/90 backdrop-blur-sm border-l border-purple-800/30 z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-black/90 backdrop-blur-sm z-10">
              <h3 className="text-lg font-semibold text-white">Customize Newsletter</h3>
              <button
                onClick={() => setShowMobileForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <Variant1Form />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 
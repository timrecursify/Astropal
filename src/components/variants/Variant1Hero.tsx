import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTaglineVariant } from '../../hooks/useTaglineVariant';
import EmailSampleModal from '../cosmic/EmailSampleModal';
import { getCtaVariant } from '../../utils/ctaVariants';
import { useLogger } from '../../hooks/useLogger';

export default function Variant1Hero() {
  const taglineVariant = useTaglineVariant();
  const { logUserAction } = useLogger('Variant1Hero');
  const cta = getCtaVariant();
  const [open, setOpen] = React.useState(false);
  const scrollToForm = React.useCallback(() => {
    const el = document.getElementById('form-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    logUserAction('scroll_to_form');
  }, [logUserAction]);
  
  const avatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format',
  ];

  return (
    <div className="space-y-8">
      {/* Astropal Logo/Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center space-x-3 mb-8"
      >
        <img 
          src="/Astropal_Logo.png" 
          alt="Astropal Logo" 
          className="w-16 h-16 md:w-20 md:h-20"
        />
        <span className="font-mono text-3xl md:text-4xl font-semibold text-white">ASTROPAL</span>
      </motion.div>

      {/* Social Proof - 4.9 Stars with Avatars */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center space-x-3"
      >
        <div className="flex -space-x-2">
          {avatars.map((avatar, index) => (
            <motion.img
              key={index}
              src={avatar}
              alt=""
              className="w-8 h-8 rounded-full border-2 border-purple-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            />
          ))}
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-purple-400 fill-current" />
            ))}
          </div>
          <span className="text-purple-300 text-base font-mono">4.9</span>
        </div>
      </motion.div>
      
      {/* Main Headline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-4xl sm:text-4xl md:text-5xl font-bold leading-tight">
          {(() => {
            const headline = taglineVariant.headline;
            // Apply purple styling to key cosmic words
            return headline
              .split(' ')
              .map((word, index) => {
                const cosmicWords = ['Cosmic', 'Astrology', 'Daily', 'Brief', 'Timing', 'Power', 'Love', 'Career', 'Wellbeing', 'Guidance', 'Advantage'];
                const isCosmicWord = cosmicWords.some(cosmic => word.toLowerCase().includes(cosmic.toLowerCase()));
                
                return (
                  <span key={index}>
                    {isCosmicWord ? (
                      <span className="text-purple-400">{word}</span>
                    ) : (
                      word
                    )}
                    {index < headline.split(' ').length - 1 ? ' ' : ''}
                  </span>
                );
              });
          })()}
        </h1>
      </motion.div>
      
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-xl sm:text-xl md:text-2xl text-gray-300 leading-relaxed">
          {taglineVariant.subheadline}
        </p>
        <p className="text-lg sm:text-lg md:text-lg text-gray-500">
          Clear, practical guidance you can act on today
        </p>
      </motion.div>
      

      
      {/* CTA + Sample */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pt-4"
      >
        {/* API Logos */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
          <div className="text-xs font-mono text-gray-500">NASA</div>
          <div className="text-xs font-mono text-gray-500">JPL HORIZONS</div>
          <div className="text-xs font-mono text-gray-500">SWISS EPHEMERIS</div>
          <div className="text-xs font-mono text-gray-500">EKELEN'S TAROT</div>
          <div className="text-xs font-mono text-gray-500">FENGSHUI API</div>
        </div>
        <div className="flex items-center justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 w-full sm:w-auto max-w-xl">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-6 md:px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm md:text-base"
            >
              {cta.label}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(true); logUserAction('open_email_sample'); }}
              className="w-full sm:w-auto mt-3 sm:mt-0 px-6 md:px-8 py-3 border border-purple-700 text-white rounded-xl text-sm md:text-base hover:bg-purple-900/30"
            >
              View Sample Email
            </button>
          </div>
        </div>

      </motion.div>
      <EmailSampleModal open={open} onClose={() => { setOpen(false); logUserAction('close_email_sample'); }} variant="variant1" />
    </div>
  );
} 
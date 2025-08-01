import React from 'react';
import { motion } from 'framer-motion';
import { Star, Mail, Brain, Clock, Moon, Heart, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';

export default function Variant2Hero() {
  const avatars = [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face&auto=format',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face&auto=format',
  ];

  const benefits = [
    { icon: Mail, text: 'One-Time Setup, Lifetime Guidance', desc: 'Set your preferences once, receive perfect advice forever', color: 'text-purple-400' },
    { icon: Brain, text: 'Inbox Integration', desc: 'No new apps to remember, just check your email like always', color: 'text-pink-400' },
    { icon: Clock, text: 'Perfect Length', desc: 'Quick reads for busy mornings, deeper insights when you need them', color: 'text-blue-400' },
    { icon: Moon, text: 'Your Ideal Schedule', desc: 'Delivered exactly when you start your day, anywhere in the world', color: 'text-indigo-400' },
    { icon: Heart, text: 'Smart Personalization', desc: 'Content evolves with your life changes and preferences', color: 'text-rose-400' },
    { icon: Sparkles, text: 'Multiple Wisdom Traditions', desc: 'Choose your favorite practices or explore them all', color: 'text-yellow-400' },
    { icon: Shield, text: 'Relationship-Friendly', desc: 'Perfect guidance for singles, couples, and families', color: 'text-green-400' },
    { icon: Zap, text: 'Travel-Ready', desc: 'Automatically adjusts to your timezone and location changes', color: 'text-orange-400' },
    { icon: TrendingUp, text: 'Email Archive', desc: 'Keep your cosmic insights forever, searchable and organized', color: 'text-cyan-400' },
  ];

  return (
    <div className="text-center space-y-8 md:space-y-12">
      {/* Astropal Logo/Branding */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-center space-x-3 mb-6 md:mb-8"
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
              className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-purple-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            />
          ))}
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 md:w-4 md:h-4 text-purple-400 fill-current" />
            ))}
          </div>
          <span className="text-purple-300 text-sm md:text-base font-mono">4.9</span>
        </div>
      </motion.div>
      
      {/* Main Headline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          Your Morning
          <br />
          <span className="text-purple-400">Cosmic Coffee</span>
          <br />
          But for the Soul
        </h1>
      </motion.div>
      
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-lg sm:text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto px-4">
          5-minute personalized readings that fit perfectly into your daily routine, no apps required
        </p>
        <p className="text-base sm:text-base md:text-base text-gray-500 italic">
          Ancient wisdom, modern convenience - delivered fresh to your inbox
        </p>
      </motion.div>

      {/* Benefits Grid - Cool Layout with mobile optimization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 md:p-6 hover:border-purple-500/30 transition-all duration-300 hover:bg-gray-900/50"
              >
                <div className="flex items-start space-x-3 md:space-x-4">
                  <div className={`${benefit.color} mt-1`}>
                    <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-semibold text-sm md:text-sm mb-1">
                      {benefit.text}
                    </h3>
                    <p className="text-gray-400 text-sm md:text-xs leading-relaxed">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* API Logos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="flex flex-wrap items-center justify-center gap-6 md:gap-8"
      >
        <div className="text-xs font-mono text-gray-500">NASA</div>
        <div className="text-xs font-mono text-gray-500">JPL HORIZONS</div>
        <div className="text-xs font-mono text-gray-500">SWISS EPHEMERIS</div>
        <div className="text-xs font-mono text-gray-500">EKELEN'S TAROT</div>
        <div className="text-xs font-mono text-gray-500">FENGSHUI API</div>
      </motion.div>
    </div>
  );
} 
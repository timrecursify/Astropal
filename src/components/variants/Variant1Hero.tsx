import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Star, Mail, Clock, Moon, Heart, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';

export default function Variant1Hero() {
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
        className="flex items-center space-x-3 mb-8"
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
        className="flex items-center space-x-3"
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
          Unlock Your
          <br />
          <span className="text-purple-400">Cosmic Potential</span>
          <br />
          Every Morning
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
          Transform your life with personalized spiritual guidance that reveals your hidden strengths and perfect timing
        </p>
        <p className="text-lg sm:text-lg md:text-lg text-gray-500 italic">
          Your personal cosmic coach, whispering ancient secrets at dawn
        </p>
      </motion.div>
      
      {/* Enhanced Value Props */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-purple-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Soul Blueprint Activation</strong> - Discover your unique cosmic gifts and life purpose
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-pink-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Emotional Mastery Tools</strong> - Navigate feelings with celestial wisdom and clarity
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Divine Timing Revelations</strong> - Never miss your magical manifestation moments again
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Moon className="w-5 h-5 text-indigo-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Intuitive Awakening</strong> - Strengthen your inner knowing through cosmic connection
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Heart className="w-5 h-5 text-rose-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Relationship Alchemy</strong> - Transform connections using astrological compatibility insights
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Abundance Alignment</strong> - Attract prosperity when the stars favor your success
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Shield className="w-5 h-5 text-green-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Shadow Work Guidance</strong> - Heal limiting patterns with gentle cosmic support
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-orange-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Power Hour Activation</strong> - Maximize productivity during your personal peak times
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <span className="text-sm sm:text-sm md:text-base text-gray-300">
            <strong className="text-white">Spiritual Evolution Path</strong> - Track your awakening journey with cosmic milestones
          </span>
        </div>
      </motion.div>
      
      {/* CTA Section - Left Aligned */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="pt-8"
      >
        {/* API Logos */}
        <div className="flex flex-wrap items-center justify-start gap-6 mb-8">
          <div className="text-xs font-mono text-gray-500">NASA</div>
          <div className="text-xs font-mono text-gray-500">JPL HORIZONS</div>
          <div className="text-xs font-mono text-gray-500">SWISS EPHEMERIS</div>
          <div className="text-xs font-mono text-gray-500">EKELEN'S TAROT</div>
          <div className="text-xs font-mono text-gray-500">FENGSHUI API</div>
        </div>
        
        {/* Customer Reviews */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4"
          >
            <p className="text-sm text-gray-300 italic mb-2">
              "I discovered gifts I never knew I had. This spiritual awakening completely transformed how I see myself and my purpose."
            </p>
            <p className="text-xs text-gray-500">— Sarah M., Wellness Coach</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4"
          >
            <p className="text-sm text-gray-300 italic mb-2">
              "My intuition has become my superpower. I now trust my inner knowing and make decisions with confidence and clarity."
            </p>
            <p className="text-xs text-gray-500">— Marcus T., Software Engineer</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.4 }}
            className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4"
          >
            <p className="text-sm text-gray-300 italic mb-2">
              "I manifested my dream job by following the divine timing guidance. The abundance alignment really works!"
            </p>
            <p className="text-xs text-gray-500">— Emma L., Creative Director</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 
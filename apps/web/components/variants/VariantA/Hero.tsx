'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Heart, Moon, Star, Mail, Clock } from 'lucide-react';
import { FieldTooltip } from '../../Tooltip';
import ConfirmationBlock from '../../ConfirmationBlock';
import { useLogger } from '../../../lib/logger';
import { useRegister } from '../../../lib/api';

export default function VariantAHero() {
  const { logUserAction, logError, logInfo } = useLogger('VariantAHero');
  const registerMutation = useRegister();
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !birthDate || !birthLocation) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      logUserAction('variant_a_signup_attempt', {
        email: email,
        variant: 'calm',
        hasAllFields: true
      });

      await registerMutation.mutateAsync({
        email: email,
        dob: birthDate,
        birthLocation: birthLocation,
        focuses: ['wellness', 'spiritual'],
        locale: 'en',
        referral: undefined
      });

      logUserAction('variant_a_signup_success', {
        email: email,
        variant: 'calm'
      });

      setShowConfirmation(true);
      
    } catch (error) {
      logError(error as Error, {
        action: 'variant_a_signup',
        email: email
      });
      
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        alert('This email is already registered. Please check your inbox or try signing in.');
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  const avatars = [
    'https://images.unsplash.com/photo-1494790108755-2616b612b5bb?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=50&h=50&fit=crop&crop=face',
  ];

  return (
    <div className="space-y-8">
      {showConfirmation ? (
        <ConfirmationBlock
          userEmail={email}
          variant="wellness"
        />
      ) : (
        <>
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
        <h1 className="text-5xl font-bold leading-tight">
          Your daily dose of
          <br />
          <span className="text-purple-400">cosmic wellness</span>
        </h1>
      </motion.div>
      
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-2"
      >
        <p className="text-xl text-gray-300 leading-relaxed">
          Personalized astrology newsletter for mental wellness and emotional balance
        </p>
        <p className="text-gray-500 italic">
          Your inbox therapist, delivered daily at 6 AM
        </p>
      </motion.div>
      
      {/* Value Props */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center space-x-3">
          <Mail className="w-5 h-5 text-purple-400" />
          <span className="text-gray-300">
            <strong className="text-white">Daily emails</strong> - Personalized to your birth chart
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-pink-400" />
          <span className="text-gray-300">
            <strong className="text-white">Mental health insights</strong> - Cosmic timing for self-care
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-gray-300">
            <strong className="text-white">Perfect timing</strong> - Know when to act, rest, or reflect
          </span>
        </div>
      </motion.div>
      
      {/* Signup Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="space-y-4"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-3">
          <div>
            <label className="flex items-center text-xs text-gray-400 mb-2">
              Email
              <FieldTooltip content="We'll send your personalized astrology newsletter here" />
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-4 sm:px-3 sm:py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors text-base sm:text-sm touch-manipulation"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck="false"
              inputMode="email"
            />
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-400 mb-2">
              Birth Date
              <FieldTooltip content="Essential for calculating your personal birth chart" />
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-4 sm:px-3 sm:py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 transition-colors text-base sm:text-sm touch-manipulation"
              autoComplete="bday"
            />
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-400 mb-2">
              Birth Location
              <FieldTooltip content="Helps calculate accurate rising signs and house positions" />
            </label>
            <input
              type="text"
              placeholder="City, Country"
              value={birthLocation}
              onChange={(e) => setBirthLocation(e.target.value)}
              className="w-full px-4 py-4 sm:px-3 sm:py-3 bg-gray-900/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 transition-colors text-base sm:text-sm touch-manipulation"
              autoComplete="address-level2 address-level1"
              autoCapitalize="words"
              spellCheck="true"
            />
          </div>
        </div>
        
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 sm:py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 touch-manipulation min-h-[48px] active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            {isSubmitting ? 'GETTING YOUR COSMIC NEWSLETTER...' : 'GET MY COSMIC NEWSLETTER'}
          </button>
          
            <p className="text-center text-sm text-gray-500">
              7 days free • Your personal astro newsletter • Cancel anytime
            </p>
          </form>
        </motion.div>
        </>
      )}
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Briefcase, Zap, Star, Mail, Clock } from 'lucide-react';
import { FieldTooltip } from '../../Tooltip';
import ConfirmationBlock from '../../ConfirmationBlock';
import { useLogger } from '../../../lib/logger';
import { useRegister } from '../../../lib/api';

export default function VariantCHero() {
  const { logUserAction, logError } = useLogger('VariantCHero');
  const registerMutation = useRegister();
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !birthDate || !birthLocation) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      logUserAction('variant_c_signup_attempt', {
        email: email,
        variant: 'success',
        hasAllFields: true
      });

      await registerMutation.mutateAsync({
        email: email,
        dob: birthDate,
        birthLocation: birthLocation,
        focuses: ['career', 'social'],
        locale: 'en',
        referral: undefined
      });

      logUserAction('variant_c_signup_success', {
        email: email,
        variant: 'success'
      });

      setShowConfirmation(true);
      
    } catch (error) {
      logError(error as Error, {
        action: 'variant_c_signup',
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
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=50&h=50&fit=crop&crop=face',
  ];

  return (
    <div className="space-y-8">
      {showConfirmation ? (
        <ConfirmationBlock
          userEmail={email}
          variant="career"
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
              className="w-8 h-8 rounded-full border-2 border-yellow-500/30"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            />
          ))}
        </div>
        <div className="flex items-center space-x-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
            ))}
          </div>
          <span className="text-yellow-300 text-base font-mono">4.9</span>
        </div>
      </motion.div>
      
      {/* Main Headline */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h1 className="text-5xl font-bold leading-tight">
          Your daily
          <br />
          <span className="text-yellow-400">success intel</span>
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
          Smart newsletter with career timing insights delivered to your inbox
        </p>
        <p className="text-gray-500 italic">
          Cosmic business intelligence for strategic advantage
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
          <Mail className="w-5 h-5 text-yellow-400" />
          <span className="text-gray-300">
            <strong className="text-white">Daily career insights</strong> - Professional guidance in your inbox
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span className="text-gray-300">
            <strong className="text-white">Business timing</strong> - When to make strategic moves
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-gray-300">
            <strong className="text-white">Market analysis</strong> - Financial trends through cosmic lens
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
              <FieldTooltip content="We'll send your career and business insights newsletter here" />
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 bg-gray-900/50 border border-yellow-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-400 mb-2">
              Birth Date
              <FieldTooltip content="Essential for calculating your career timing and business cycles" />
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-3 py-3 bg-gray-900/50 border border-yellow-500/30 rounded-lg text-white focus:outline-none focus:border-yellow-400 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="flex items-center text-xs text-gray-400 mb-2">
              Birth Location
              <FieldTooltip content="Helps determine your professional strengths and leadership style" />
            </label>
            <input
              type="text"
              placeholder="City, Country"
              value={birthLocation}
              onChange={(e) => setBirthLocation(e.target.value)}
              className="w-full px-3 py-3 bg-gray-900/50 border border-yellow-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors text-sm"
            />
          </div>
        </div>
        
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
          >
            {isSubmitting ? 'GETTING YOUR SUCCESS NEWSLETTER...' : 'GET MY SUCCESS NEWSLETTER'}
          </button>
          
            <p className="text-center text-sm text-gray-500">
              7 days free • Daily business insights • Cancel anytime
            </p>
          </form>
        </motion.div>
        </>
      )}
    </div>
  );
} 
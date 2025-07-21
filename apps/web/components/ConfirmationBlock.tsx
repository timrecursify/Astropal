'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { logger } from '../lib/logger';

interface ConfirmationBlockProps {
  userEmail: string;
  variant?: 'wellness' | 'relationship' | 'career' | 'evidence-based' | 'default';
}

export default function ConfirmationBlock({ 
  userEmail, 
  variant = 'default'
}: ConfirmationBlockProps) {

  useEffect(() => {
    logger.log('info', 'Confirmation block displayed', { 
      component: 'ConfirmationBlock',
      userEmail: userEmail, // Full email for business use
      variant,
      timestamp: new Date().toISOString()
    });
    
    // Track confirmation view for analytics
    logger.log('info', 'User reached confirmation step', {
      component: 'ConfirmationBlock',
      variant,
      funnel_step: 'confirmation_view'
    });
  }, [userEmail, variant]);

  const getVariantContent = () => {
    switch (variant) {
      case 'wellness':
        return {
          title: 'Your cosmic wellness journey begins!',
          subtitle: 'Mental wellness insights coming your way',
          icon: '🧠'
        };
      case 'relationship':
        return {
          title: 'Your relationship intel is coming!',
          subtitle: 'Compatibility insights delivered daily',
          icon: '💕'
        };
      case 'career':
        return {
          title: 'Your success newsletter is ready!',
          subtitle: 'Career timing insights on the way',
          icon: '🚀'
        };
      case 'evidence-based':
        return {
          title: 'Your scientific astrology starts now!',
          subtitle: 'Evidence-based insights incoming',
          icon: '🔬'
        };
      default:
        return {
          title: 'Welcome to your astrology journey!',
          subtitle: 'Personalized insights coming soon',
          icon: '✨'
        };
    }
  };

  const content = getVariantContent();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 text-center"
    >
      {/* Success Icon and Title */}
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <div className="space-y-2">
          <div className="text-4xl">{content.icon}</div>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl sm:text-3xl font-bold text-white"
          >
            {content.title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-300"
          >
            {content.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Email confirmation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mx-auto max-w-md"
      >
        <div className="flex items-center justify-center space-x-3">
          <Mail className="w-5 h-5 text-blue-400" />
          <div className="text-center">
            <p className="text-sm text-gray-400">Check your inbox at</p>
            <p className="text-white font-medium break-all">{userEmail}</p>
          </div>
        </div>
      </motion.div>

      {/* What's next */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-white">What happens next?</h3>
        <div className="space-y-3 text-sm text-gray-300 max-w-md mx-auto">
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>Verify your email (check spam too!)</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>Your first newsletter arrives tomorrow at 6 AM</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span>7 days free, cancel anytime</span>
          </div>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-xs text-gray-500 max-w-md mx-auto"
      >
        Didn't get the email? Check your spam folder or contact support.
      </motion.p>
    </motion.div>
  );
} 
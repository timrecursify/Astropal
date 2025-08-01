import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

interface ConfirmationBlockProps {
  userEmail: string;
  variant?: 'wellness' | 'relationship' | 'default';
}

export default function ConfirmationBlock({ 
  userEmail, 
  variant = 'default'
}: ConfirmationBlockProps) {
  useEffect(() => {
    console.log('Confirmation displayed', { userEmail, variant });
  }, [userEmail, variant]);

  const getVariantContent = () => {
    switch (variant) {
      case 'wellness':
        return {
          title: 'Your cosmic wellness journey begins!',
          subtitle: 'Mental wellness insights coming your way',
          icon: 'brain'
        };
      case 'relationship':
        return {
          title: 'Your relationship intel is coming!',
          subtitle: 'Compatibility insights delivered daily',
          icon: 'heart'
        };
      default:
        return {
          title: 'Welcome to your cosmic journey!',
          subtitle: 'Personalized insights coming soon',
          icon: 'star'
        };
    }
  };

  const content = getVariantContent();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900/90 to-purple-900/30 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-8 text-center max-w-lg mx-auto shadow-2xl"
    >
      {/* Success Icon - Astropal Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30"
      >
        <img 
          src="/Astropal_Logo.png" 
          alt="Astropal Logo" 
          className="w-20 h-20"
        />
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4 mb-8"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-white">
          {content.title}
        </h3>
        <p className="text-gray-300 text-lg">
          {content.subtitle}
        </p>
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-xl p-4 inline-flex items-center space-x-3">
          <Mail className="w-5 h-5 text-purple-400" />
          <span className="text-sm text-gray-300 font-medium">{userEmail}</span>
        </div>
      </motion.div>

      {/* What's Next */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-4 text-left">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-1.5"></div>
            <div>
              <p className="text-white font-medium mb-1">Check your email</p>
              <p className="text-sm text-gray-400">Your first cosmic insights are on the way</p>
            </div>
          </div>
          <div className="flex items-start space-x-4 text-left">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-1.5"></div>
            <div>
              <p className="text-white font-medium mb-1">Daily delivery</p>
              <p className="text-sm text-gray-400">Expect your personalized guidance every morning</p>
            </div>
          </div>
          <div className="flex items-start space-x-4 text-left">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mt-1.5"></div>
            <div>
              <p className="text-white font-medium mb-1">Free for 7 days</p>
              <p className="text-sm text-gray-400">Explore all features with no commitment</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700/50 pt-6 mt-8">
          <p className="text-xs text-gray-500">
            Questions? Contact <a href="mailto:support@astropal.io" className="text-purple-400 hover:text-purple-300 transition-colors">support@astropal.io</a>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
} 
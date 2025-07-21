'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, Database, Crown } from 'lucide-react';

export default function VariantDPricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      tagline: 'Scientific Basics',
      icon: Mail,
      emailCount: '1 email/day',
      features: [
        'Daily astronomical data (6 AM)',
        'NASA ephemeris accuracy',
        'Basic transit calculations',
        'Scientific explanations',
        'Evidence-based insights',
        'Weekly methodology reports',
        'Monthly accuracy summaries',
        'Research source citations'
      ],
      color: 'gray',
      buttonText: 'Stay Free',
    },
    {
      name: 'Basic',
      price: '$7.99',
      period: '/mo',
      tagline: 'Research Grade',
      icon: Database,
      popular: true,
      emailCount: '2 emails/day',
      features: [
        'Morning scientific analysis (6 AM)',
        'Evening methodology review (7 PM)',
        'Swiss Ephemeris calculations',
        'Validated prediction tracking',
        'Statistical accuracy metrics',
        'Research paper references',
        'Weekly scientific reports',
        'Monthly precision statistics',
        'Historical accuracy data',
        'Error margin transparency'
      ],
      color: 'blue',
      buttonText: 'Start Research',
    },
    {
      name: 'Pro',
      price: '$14.99',
      period: '/mo',
      tagline: 'Academic Authority',
      icon: Crown,
      emailCount: '3 emails/day',
      features: [
        'Morning scientific breakdown (6 AM)',
        'Midday research updates (12 PM)',
        'Evening evidence review (7 PM)',
        'Real-time astronomical alerts',
        'Advanced statistical models',
        'Peer-reviewed methodologies',
        'Academic research access',
        'Historical data analysis',
        'Prediction accuracy tracking',
        'Custom calculation requests',
        'Research collaboration access',
        'Scientific advisory support'
      ],
      color: 'cyan',
      buttonText: 'Go Academic',
    },
  ];

  const getColorClasses = (color: string, popular = false) => {
    if (popular) {
      return {
        border: 'border-blue-400/50',
        bg: 'bg-blue-500/5',
        text: 'text-blue-400',
        button: 'bg-blue-500 hover:bg-blue-600 text-white'
      };
    }
    
    switch (color) {
      case 'cyan':
        return {
          border: 'border-cyan-500/30',
          bg: 'bg-cyan-500/5',
          text: 'text-cyan-400',
          button: 'border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10'
        };
      default:
        return {
          border: 'border-gray-700/50',
          bg: 'bg-gray-800/20',
          text: 'text-gray-400',
          button: 'border border-gray-600 text-gray-300 hover:bg-gray-700/30'
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Evidence-Based Newsletter Plans</h3>
        <p className="text-sm text-gray-400">Scientific astrology with astronomical accuracy</p>
      </div>
      
      {plans.map((plan, index) => {
        const colors = getColorClasses(plan.color, plan.popular);
        const midPoint = Math.ceil(plan.features.length / 2);
        const leftColumn = plan.features.slice(0, midPoint);
        const rightColumn = plan.features.slice(midPoint);
        
        return (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-4 rounded-xl border backdrop-blur-sm ${colors.border} ${colors.bg} ${plan.popular ? 'ring-1 ring-blue-400/30' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Scientific
                </span>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <plan.icon className={`w-5 h-5 ${colors.text}`} />
                <div>
                  <h4 className="text-white font-semibold text-sm">{plan.name}</h4>
                  <p className="text-xs text-gray-500">{plan.tagline}</p>
                  <p className="text-xs text-gray-400 font-mono">{plan.emailCount}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">{plan.price}</div>
                {plan.period && (
                  <div className="text-xs text-gray-400">{plan.period}</div>
                )}
              </div>
            </div>
            
            {/* Two Column Layout for Features */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
              <div className="space-y-2">
                {leftColumn.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {rightColumn.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-300 leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${colors.button}`}
            >
              {plan.buttonText}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
} 
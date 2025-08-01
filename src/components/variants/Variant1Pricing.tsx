import React from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, Brain, Sparkles } from 'lucide-react';

export default function Variant1Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      tagline: 'Cosmic Pulse',
      icon: Mail,
      emailCount: '1 email/day',
      features: [
        'Daily Cosmic Pulse (6 AM)',
        'Sun sign + Moon insights',
        'Daily mood forecast',
        'Lucky elements',
        'Shareable cosmic quotes',
        'Weekly preview email',
        'Monthly cosmic overview',
        'Basic upgrade teasers'
      ],
      color: 'gray',
      buttonText: 'Stay Free',
    },
    {
      name: 'Basic',
      price: '$7.99',
      period: '/mo',
      tagline: 'Cosmic Coach',
      icon: Brain,
      popular: true,
      emailCount: '2 emails/day',
      features: [
        'Morning horoscope (6 AM)',
        'Evening reflection (7 PM)',
        'Full birth chart analysis',
        'Career & relationship guidance',
        'Timing insights & power hours',
        'Mental health Moon tips',
        'Weekly astro weather',
        'Monthly personal forecast',
        'Mercury retrograde guides',
        'Manifestation rituals'
      ],
      color: 'purple',
      buttonText: 'Start Coaching',
    },
    {
      name: 'Pro',
      price: '$14.99',
      period: '/mo',
      tagline: 'Cosmic Authority',
      icon: Sparkles,
      emailCount: '3 emails/day',
      features: [
        'Morning deep dive (6 AM)',
        'Midday news analysis (12 PM)',
        'Evening guidance (7 PM)',
        'Real-time cosmic alerts',
        'News through astro lens',
        'Advanced mental health insights',
        'Business & finance timing',
        'Weekly authority reports',
        'Monthly deep-dive PDFs',
        'Priority support',
        'Audio horoscopes',
        'Crisis timing support'
      ],
      color: 'pink',
      buttonText: 'Go Authority',
    },
  ];

  const getColorClasses = (color: string, popular = false) => {
    if (popular) {
      return {
        border: 'border-purple-400/50',
        bg: 'bg-purple-500/5',
        text: 'text-purple-400',
        button: 'bg-purple-500 hover:bg-purple-600 text-white'
      };
    }
    
    switch (color) {
      case 'pink':
        return {
          border: 'border-pink-500/30',
          bg: 'bg-pink-500/5',
          text: 'text-pink-400',
          button: 'border border-pink-500/50 text-pink-400 hover:bg-pink-500/10'
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
        <h3 className="text-lg font-semibold text-white mb-2">Wellness Newsletter Plans</h3>
        <p className="text-sm text-gray-400">Mental wellness astrology delivered to your inbox</p>
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
            className={`relative p-4 rounded-xl border backdrop-blur-sm ${colors.border} ${colors.bg} ${plan.popular ? 'ring-1 ring-purple-400/30' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
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
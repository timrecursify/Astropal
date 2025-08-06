import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Star, Mail, Clock, Moon, Heart, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: Mail,
      color: 'text-purple-400',
      title: 'Soul Blueprint Activation',
      description: 'Discover your unique cosmic gifts and life purpose'
    },
    {
      icon: Brain,
      color: 'text-pink-400',
      title: 'Emotional Mastery Tools',
      description: 'Navigate feelings with celestial wisdom and clarity'
    },
    {
      icon: Clock,
      color: 'text-blue-400',
      title: 'Divine Timing Revelations',
      description: 'Never miss your magical manifestation moments again'
    },
    {
      icon: Moon,
      color: 'text-indigo-400',
      title: 'Intuitive Awakening',
      description: 'Strengthen your inner knowing through cosmic connection'
    },
    {
      icon: Heart,
      color: 'text-rose-400',
      title: 'Relationship Alchemy',
      description: 'Transform connections using astrological compatibility insights'
    },
    {
      icon: Sparkles,
      color: 'text-yellow-400',
      title: 'Abundance Alignment',
      description: 'Attract prosperity when the stars favor your success'
    },
    {
      icon: Shield,
      color: 'text-green-400',
      title: 'Shadow Work Guidance',
      description: 'Heal limiting patterns with gentle cosmic support'
    },
    {
      icon: Zap,
      color: 'text-orange-400',
      title: 'Power Hour Activation',
      description: 'Maximize productivity during your personal peak times'
    },
    {
      icon: TrendingUp,
      color: 'text-cyan-400',
      title: 'Spiritual Evolution Path',
      description: 'Track your awakening journey with cosmic milestones'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Transform Your Life with <span className="text-purple-400">Cosmic Wisdom</span>
        </h2>
        <p className="text-gray-400 text-lg">
          Unlock your full potential with personalized spiritual guidance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => {
          const IconComponent = benefit.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-6 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <IconComponent className={`w-6 h-6 ${benefit.color} flex-shrink-0 mt-1`} />
                <div>
                  <h3 className="text-white font-semibold text-base mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
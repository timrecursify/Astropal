'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Brain, Users, Sparkles, Target } from 'lucide-react';

interface FocusOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
}

interface FocusSelectorProps {
  onFocusChange?: (selectedFocuses: string[]) => void;
  maxSelections?: number;
  variant?: 'signup' | 'preferences';
}

export default function FocusSelector({ 
  onFocusChange, 
  maxSelections = 3,
  variant = 'signup' 
}: FocusSelectorProps) {
  const [selectedFocuses, setSelectedFocuses] = useState<string[]>([]);

  const focusOptions: FocusOption[] = [
    {
      id: 'relationships',
      name: 'Relationships',
      description: 'Love, dating, friendships, and family dynamics',
      icon: Heart,
      color: 'text-pink-400',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      id: 'career',
      name: 'Career & Business',
      description: 'Professional growth, timing, and financial success',
      icon: TrendingUp,
      color: 'text-yellow-400',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'wellness',
      name: 'Mental Wellness',
      description: 'Emotional health, stress management, and self-care',
      icon: Brain,
      color: 'text-purple-400',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'social',
      name: 'Social Life',
      description: 'Communication, networking, and group dynamics',
      icon: Users,
      color: 'text-blue-400',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'spiritual',
      name: 'Spiritual Growth',
      description: 'Personal development, manifestation, and intuition',
      icon: Sparkles,
      color: 'text-violet-400',
      gradient: 'from-violet-500 to-purple-500'
    },
    {
      id: 'evidence-based',
      name: 'Evidence-Based Astrology',
      description: 'Scientific methods, astronomical data, and research-backed insights',
      icon: Target,
      color: 'text-cyan-400',
      gradient: 'from-cyan-500 to-blue-500'
    }
  ];

  const handleFocusToggle = (focusId: string) => {
    let updatedFocuses: string[];
    
    if (selectedFocuses.includes(focusId)) {
      updatedFocuses = selectedFocuses.filter(id => id !== focusId);
    } else if (selectedFocuses.length < maxSelections) {
      updatedFocuses = [...selectedFocuses, focusId];
    } else {
      return; // Max selections reached
    }
    
    setSelectedFocuses(updatedFocuses);
    onFocusChange?.(updatedFocuses);
  };

  const getFocusButtonClasses = (option: FocusOption, isSelected: boolean) => {
    if (isSelected) {
      return `bg-gradient-to-r ${option.gradient} text-white border-transparent`;
    }
    return 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-600';
  };

  return (
    <div className="space-y-6">
      {variant === 'signup' && (
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-white mb-3">
            What interests you most?
          </h3>
          <p className="text-gray-400 text-sm">
            Choose up to {maxSelections} areas to personalize your newsletter content
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {focusOptions.map((option, index) => {
          const isSelected = selectedFocuses.includes(option.id);
          const isDisabled = !isSelected && selectedFocuses.length >= maxSelections;
          
          return (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleFocusToggle(option.id)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-xl border transition-all duration-300 text-left
                ${getFocusButtonClasses(option, isSelected)}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-700/50'}`}>
                  <option.icon className={`w-5 h-5 ${isSelected ? 'text-white' : option.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {option.name}
                  </h4>
                  <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {option.description}
                  </p>
                </div>
              </div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                >
                  <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {selectedFocuses.length > 0 && variant === 'signup' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/30 border border-gray-700 rounded-lg p-4"
        >
          <p className="text-sm text-gray-300 mb-2">
            <strong className="text-white">Your personalized content will focus on:</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedFocuses.map(focusId => {
              const option = focusOptions.find(opt => opt.id === focusId);
              return option ? (
                <span
                  key={focusId}
                  className={`px-3 py-1 rounded-full text-xs bg-gradient-to-r ${option.gradient} text-white`}
                >
                  {option.name}
                </span>
              ) : null;
            })}
          </div>
        </motion.div>
      )}

      {variant === 'signup' && (
        <p className="text-center text-xs text-gray-500">
          You can always change these preferences later in your account settings
        </p>
      )}
    </div>
  );
} 
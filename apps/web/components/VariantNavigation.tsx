'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, TrendingUp, Target, Menu, X } from 'lucide-react';

export default function VariantNavigation() {
  const params = useParams();
  const locale = params.locale as string;
  const [isOpen, setIsOpen] = useState(false);

  const variants = [
    {
      id: 'variant-a',
      name: 'Calm',
      fullName: 'Cosmic Calm',
      description: 'Mental Health',
      icon: Brain,
      color: 'purple',
      href: `/${locale}/variant-a`,
    },
    {
      id: 'variant-b', 
      name: 'Know',
      fullName: 'Know Before You Text',
      description: 'Social & Compatibility',
      icon: Heart,
      color: 'pink',
      href: `/${locale}/variant-b`,
    },
    {
      id: 'variant-c',
      name: 'Success',
      fullName: 'Time Your Success',
      description: 'Career & Success',
      icon: TrendingUp,
      color: 'yellow',
      href: `/${locale}/variant-c`,
    },
    {
      id: 'variant-d',
      name: 'Precision',
      fullName: 'Precision Astrology',
      description: 'Original Focus',
      icon: Target,
      color: 'blue',
      href: `/${locale}/variant-d`,
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return 'hover:bg-purple-600/20 border-purple-500/30 text-purple-400';
      case 'pink':
        return 'hover:bg-pink-600/20 border-pink-500/30 text-pink-400';
      case 'yellow':
        return 'hover:bg-yellow-600/20 border-yellow-500/30 text-yellow-400';
      default:
        return 'hover:bg-blue-600/20 border-blue-500/30 text-blue-400';
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 right-4 z-50 md:hidden bg-black/80 backdrop-blur-md border border-gray-800/50 rounded-full p-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </motion.button>

      {/* Desktop Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-md border border-gray-800/50 rounded-full px-4 py-2"
      >
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-400 font-mono whitespace-nowrap">VARIANTS:</span>
          <div className="flex items-center space-x-2">
            {variants.map((variant, index) => (
              <motion.div
                key={variant.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={variant.href}
                  className={`group flex items-center space-x-2 px-3 py-2 rounded-full transition-all hover:scale-105 border ${getColorClasses(variant.color)}`}
                  title={`${variant.fullName} - ${variant.description}`}
                >
                  <variant.icon className={`w-4 h-4 ${getColorClasses(variant.color).split(' ')[2]}`} />
                  <span className="text-white text-sm font-medium whitespace-nowrap">{variant.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: '0%' }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-40 w-80 h-full bg-black/95 backdrop-blur-md border-l border-gray-800/50 md:hidden"
          >
            <div className="p-6 pt-20">
              <div className="text-xs text-gray-400 font-mono mb-6 uppercase tracking-wider">
                A/B Test Variants
              </div>
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <motion.div
                    key={variant.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={variant.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-start space-x-3 p-4 rounded-lg transition-all hover:scale-[1.02] border ${getColorClasses(variant.color)}`}
                    >
                      <variant.icon className={`w-5 h-5 mt-0.5 ${getColorClasses(variant.color).split(' ')[2]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-base font-medium">{variant.fullName}</div>
                        <div className="text-sm text-gray-400 mt-1">{variant.description}</div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
} 
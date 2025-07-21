'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Users } from 'lucide-react';

export default function VariantAFooter() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0 }}
      className="border-t border-gray-800/50 p-6"
    >
      <div className="flex items-center justify-between">
        {/* Left Side - Trust Signals */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Safe space</span>
          </div>
          <div className="flex items-center space-x-2">
            <Brain className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Non-judgmental AI</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Your data protected</span>
          </div>
        </div>
        
        {/* Center - Testimonial */}
        <div className="text-center">
          <p className="text-gray-300 italic text-sm">
            "Finally understand why I feel the way I do"
          </p>
          <p className="text-purple-400 text-xs font-mono">@moonchild_maya</p>
        </div>
        
        {/* Right Side - Social Proof */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-gray-300 font-semibold">
            Join 10,000+ finding their emotional clarity
          </span>
        </div>
      </div>
    </motion.div>
  );
} 
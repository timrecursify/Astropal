'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users } from 'lucide-react';

export default function VariantCFooter() {
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
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">NASA-grade precision</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Strategic advantage</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Career-focused insights</span>
          </div>
        </div>
        
        {/* Center - Testimonial */}
        <div className="text-center">
          <p className="text-gray-300 italic text-sm">
            "Got my promotion during the exact window it predicted"
          </p>
          <p className="text-yellow-400 text-xs font-mono">@cosmicCEO</p>
        </div>
        
        {/* Right Side - Social Proof */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-gray-300 font-semibold">
            Join 10,000+ timing their success
          </span>
        </div>
      </div>
    </motion.div>
  );
} 
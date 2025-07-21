'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Users } from 'lucide-react';

export default function VariantBFooter() {
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
            <Heart className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Real compatibility science</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">Privacy first</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-400">No cringe predictions</span>
          </div>
        </div>
        
        {/* Center - Testimonial */}
        <div className="text-center">
          <p className="text-gray-300 italic text-sm">
            "Saved me from so many toxic situationships"
          </p>
          <p className="text-pink-400 text-xs font-mono">@venusvibes23</p>
        </div>
        
        {/* Right Side - Social Proof */}
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-pink-400" />
          <span className="text-sm text-gray-300 font-semibold">
            Join 10,000+ making better relationship choices
          </span>
        </div>
      </div>
    </motion.div>
  );
} 
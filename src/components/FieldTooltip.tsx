import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  children: React.ReactNode;
}

function Tooltip({ content, position = 'top', className = '', children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800';
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800';
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800';
    }
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${getPositionClasses()} z-[100]`}
            style={{ minWidth: '280px', maxWidth: '380px' }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs px-4 py-3 rounded-lg shadow-2xl border border-gray-700/50 whitespace-normal break-words leading-relaxed">
              {content}
            </div>
            <div 
              className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FieldTooltip({ content, className = '' }: { content: string; className?: string }) {
  return (
    <Tooltip content={content} position="top" className={`ml-2 ${className}`}>
      <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
    </Tooltip>
  );
}

// Specialized tooltip for main page with off-white background
export function MainPageTooltip({ content, className = '' }: { content: string; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Info className="w-3 h-3 text-gray-500 hover:text-gray-300 cursor-help transition-colors" />
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[100]"
            style={{ minWidth: '280px', maxWidth: '380px' }}
          >
            <div className="bg-gray-100 text-gray-900 text-xs px-4 py-3 rounded-lg shadow-2xl border border-gray-300 whitespace-normal break-words leading-relaxed">
              {content}
            </div>
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-l-transparent border-r-transparent border-b-transparent border-t-gray-100"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
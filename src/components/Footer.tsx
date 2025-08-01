import React from 'react';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <div className="pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 mb-4">
          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <Facebook size={14} />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <Instagram size={14} />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <Twitter size={14} />
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-400 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-2.54v5.79c0 2.84-2.26 5.14-5.09 5.14-1.09 0-2.09-.41-2.84-1.08-.78-.7-1.26-1.72-1.26-2.84 0-2.84 2.26-5.14 5.09-5.14.28 0 .55.02.81.08V1.44c-.26-.02-.53-.04-.81-.04-3.5 0-6.33 2.84-6.33 6.33 0 1.73.69 3.29 1.81 4.42 1.11 1.12 2.67 1.81 4.37 1.81 3.5 0 6.33-2.84 6.33-6.33V8.56c1.37.74 2.97 1.17 4.64 1.17v-1.24c-1.16 0-2.25-.26-3.22-.75-.5-.25-.98-.55-1.42-.91z"/>
              </svg>
            </a>
          </div>
          
          {/* Legal Links */}
          <div className="flex items-center space-x-4 text-xs">
            <a href="/privacy" className="text-gray-600 hover:text-gray-400 transition-colors">Privacy</a>
            <a href="/terms" className="text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 text-center">
          © 2025 Astropal.io
        </p>
      </div>
    </div>
  );
} 
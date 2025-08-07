import React, { useEffect } from 'react';
import { Mail } from 'lucide-react';

interface ConfirmationBlockProps {
  userEmail: string;
  variant: string;
}

const ConfirmationBlock: React.FC<ConfirmationBlockProps> = ({ userEmail }) => {
  
  // Lead event is fired in form submission - no duplicate event needed here

  return (
    <div className="max-w-md mx-auto text-center py-6">
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <img 
            src="/Astropal_Logo.png" 
            alt="Astropal Logo" 
            className="w-8 h-8"
          />
          <h2 className="text-xl font-medium text-white">Registration Complete!</h2>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-md p-3">
          <div className="flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 text-sm">{userEmail}</span>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">Your cosmic insights will arrive daily at 6 AM</p>
          <p className="text-gray-400">Check your email for your first personalized reading</p>
        </div>
        
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-800">
          Free for 7 days • Questions? <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationBlock; 
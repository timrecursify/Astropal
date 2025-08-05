import React, { useEffect } from 'react';
import { Mail } from 'lucide-react';

interface ConfirmationBlockProps {
  userEmail: string;
  variant: string;
}

const ConfirmationBlock: React.FC<ConfirmationBlockProps> = ({ userEmail }) => {
  
  // Lead event is fired in form submission - no duplicate event needed here

  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="mb-8">
        <img 
          src="/Astropal_Logo.png" 
          alt="Astropal Logo" 
          className="w-16 h-16 mx-auto mb-6"
        />
        <h2 className="text-3xl md:text-4xl font-light mb-4">Welcome to your cosmic journey!</h2>
        <p className="text-gray-400 text-lg mb-6">
          Your personalized daily insights are being prepared
        </p>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 inline-flex items-center space-x-3 mb-8">
          <Mail className="w-5 h-5 text-gray-400" />
          <span className="text-gray-300">{userEmail}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="space-y-3">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-mono">1</span>
          </div>
          <h3 className="text-lg font-medium">Check your email</h3>
          <p className="text-sm text-gray-400">Your first cosmic insights are on the way</p>
        </div>
        <div className="space-y-3">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-mono">2</span>
          </div>
          <h3 className="text-lg font-medium">Daily delivery</h3>
          <p className="text-sm text-gray-400">Expect your personalized guidance every morning at 6 AM</p>
        </div>
        <div className="space-y-3">
          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-sm font-mono">3</span>
          </div>
          <h3 className="text-lg font-medium">Free for 7 days</h3>
          <p className="text-sm text-gray-400">Explore all features with no commitment</p>
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        Questions? Contact <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
      </p>
    </div>
  );
};

export default ConfirmationBlock; 
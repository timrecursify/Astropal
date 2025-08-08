import React, { useState } from 'react';
import { Mail, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useLogger } from '../hooks/useLogger';

interface EnhancedConfirmationProps {
  userEmail: string;
  variant?: string;
}

const EnhancedConfirmation: React.FC<EnhancedConfirmationProps> = ({ userEmail, variant = 'default' }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const { logUserAction } = useLogger('EnhancedConfirmation');

  const styles = (() => {
    switch (variant) {
      case 'variant0':
        return {
          heading: 'text-3xl md:text-4xl font-light mb-6 text-white',
          stepCircle: 'w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto',
          stepNum: 'text-white text-2xl font-mono',
          box: 'bg-gray-900/40 backdrop-blur-sm border border-gray-800/80 rounded-xl p-6 mb-8 shadow-md',
          boxTitle: 'text-lg font-medium text-white',
          actionBtn: 'flex items-center space-x-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded transition-colors shadow',
        };
      case 'variant1':
        return {
          heading: 'text-3xl md:text-4xl font-light mb-6 text-white',
          stepCircle: 'w-16 h-16 bg-purple-900/40 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto',
          stepNum: 'text-purple-300 text-2xl font-mono',
          box: 'bg-purple-900/20 backdrop-blur-sm border border-purple-800/30 rounded-xl p-6 mb-8 shadow-lg',
          boxTitle: 'text-lg font-medium text-white',
          actionBtn: 'flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded transition-colors shadow',
        };
      case 'variant2':
        return {
          heading: 'text-3xl md:text-4xl font-light mb-6 text-white',
          stepCircle: 'w-16 h-16 bg-pink-900/30 border border-pink-700/40 rounded-full flex items-center justify-center mx-auto',
          stepNum: 'text-pink-300 text-2xl font-mono',
          box: 'bg-pink-900/20 backdrop-blur-sm border border-pink-800/30 rounded-xl p-6 mb-8 shadow-lg',
          boxTitle: 'text-lg font-medium text-white',
          actionBtn: 'flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded transition-colors shadow',
        };
      default:
        return {
          heading: 'text-3xl md:text-4xl font-light mb-6 text-white',
          stepCircle: 'w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto',
          stepNum: 'text-white text-2xl font-mono',
          box: 'bg-gray-900/40 backdrop-blur-sm border border-gray-800/80 rounded-xl p-6 mb-8 shadow-md',
          boxTitle: 'text-lg font-medium text-white',
          actionBtn: 'flex items-center space-x-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded transition-colors shadow',
        };
    }
  })();

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('newsletter@astropal.io');
      setCopiedEmail(true);
      logUserAction('copy_whitelist_email');
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = 'newsletter@astropal.io';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedEmail(true);
      logUserAction('copy_whitelist_email_fallback');
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const emailInstructions = [
    {
      client: 'Gmail',
      steps: [
        'Go to Settings → Filters and Blocked Addresses',
        'Click "Create a new filter"',
        'Enter "newsletter@astropal.io" in the From field',
        'Click "Create filter" and check "Never send it to Spam"'
      ]
    },
    {
      client: 'Outlook',
      steps: [
        'Go to Settings → Mail → Junk email',
        'Click "Safe senders and domains"',
        'Add "newsletter@astropal.io" to safe senders list'
      ]
    },
    {
      client: 'Apple Mail',
      steps: [
        'Open any email from newsletter@astropal.io',
        'Click the sender\'s email address',
        'Choose "Add to VIPs" or "Add to Contacts"'
      ]
    },
    {
      client: 'Yahoo Mail',
      steps: [
        'Go to Settings → More Settings → Filters',
        'Click "Add new filters"',
        'Set Sender contains "newsletter@astropal.io"',
        'Choose "Inbox" as destination folder'
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto text-center py-12 animate-[fadeIn_0.4s_ease-out]">
      <div className="mb-12">
        <img 
          src="/Astropal_Logo.png" 
          alt="Astropal Logo" 
          className="w-24 h-24 mx-auto mb-8"
        />
        <h2 className={styles.heading}>Welcome to your cosmic journey!</h2>
        <p className="text-gray-400 text-xl mb-8">
          Your personalized daily insights are being prepared
        </p>
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 inline-flex items-center space-x-4 mb-12">
          <Mail className="w-6 h-6 text-gray-400" />
          <span className="text-gray-300 text-lg">{userEmail}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="space-y-4">
          <div className={styles.stepCircle}>
            <span className={styles.stepNum}>1</span>
          </div>
          <h3 className="text-xl font-medium">Check your email</h3>
          <p className="text-gray-400">Your first cosmic insights are on the way</p>
        </div>
        <div className="space-y-4">
          <div className={styles.stepCircle}>
            <span className={styles.stepNum}>2</span>
          </div>
          <h3 className="text-xl font-medium">Daily delivery</h3>
          <p className="text-gray-400">Expect your personalized guidance every morning at 6 AM</p>
        </div>
        <div className="space-y-4">
          <div className={styles.stepCircle}>
            <span className={styles.stepNum}>3</span>
          </div>
          <h3 className="text-xl font-medium">Free for 7 days</h3>
          <p className="text-gray-400">Explore all features with no commitment</p>
        </div>
      </div>

      {/* Whitelist Advice Box */}
      <div className={styles.box}>
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Mail className="w-5 h-5 text-purple-400" />
          <h3 className={styles.boxTitle}>Ensure Delivery</h3>
        </div>
        <p className="text-gray-300 mb-4">
          Add our newsletter email to your safe senders list to ensure you never miss your cosmic insights:
        </p>
        <div className="flex items-center justify-center space-x-3 mb-4">
          <code className="bg-gray-800 px-4 py-2 rounded text-purple-300 font-mono">
            newsletter@astropal.io
          </code>
          <button
            onClick={copyEmailToClipboard}
            className={styles.actionBtn}
          >
            {copiedEmail ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        
        {/* Email Client Instructions */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="flex items-center justify-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors mx-auto"
        >
          <span className="text-sm">Email client instructions</span>
          {showInstructions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {showInstructions && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {emailInstructions.map((instruction, index) => (
              <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-purple-300 mb-3">{instruction.client}</h4>
                <ol className="text-sm text-gray-400 space-y-2">
                  {instruction.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex">
                      <span className="mr-2 text-purple-400">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500">
        Questions? Contact <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">support@astropal.io</a>
      </p>
    </div>
  );
};

export default EnhancedConfirmation;
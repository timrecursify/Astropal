import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalLine {
  timestamp: string;
  level: 'Info' | 'Notice';
  message: string;
  delay: number;
}

// Generate current time-based timestamps
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: true 
  });
};

const generateTerminalLines = (): TerminalLine[] => {
  const baseTime = new Date();
  const getTimeOffset = (seconds: number) => {
    const time = new Date(baseTime.getTime() + seconds * 1000);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  return [
    {
      timestamp: getTimeOffset(0),
      level: 'Notice',
      message: '=== Starting Cosmic Data Generation ===',
      delay: 0.3
    },
    {
      timestamp: getTimeOffset(1),
      level: 'Info',
      message: '🚀 Calling NASA Horizons API...',
      delay: 0.6
    },
    {
      timestamp: getTimeOffset(2),
      level: 'Info',
      message: '  - Fetching Sun position data',
      delay: 0.9
    },
    {
      timestamp: getTimeOffset(3),
      level: 'Info',
      message: '  - Fetching planetary alignments',
      delay: 1.2
    },
    {
      timestamp: getTimeOffset(4),
      level: 'Info',
      message: '  - Calculating Moon phases',
      delay: 1.5
    },
    {
      timestamp: getTimeOffset(5),
      level: 'Info',
      message: '✓ NASA data retrieved successfully',
      delay: 1.8
    },
    {
      timestamp: getTimeOffset(6),
      level: 'Info',
      message: '🇨🇭 Calling Swiss Ephemeris...',
      delay: 2.1
    },
    {
      timestamp: getTimeOffset(7),
      level: 'Info',
      message: '🔄 Calculating planetary aspects',
      delay: 2.4
    },
    {
      timestamp: getTimeOffset(8),
      level: 'Info',
      message: '🏠 Computing astrological houses',
      delay: 2.7
    },
    {
      timestamp: getTimeOffset(9),
      level: 'Info',
      message: '✓ Astrological calculations complete',
      delay: 3.0
    },
    {
      timestamp: getTimeOffset(10),
      level: 'Info',
      message: '🔢 Generating numerology insights',
      delay: 3.3
    },
    {
      timestamp: getTimeOffset(11),
      level: 'Info',
      message: '🧠 Starting AI content generation...',
      delay: 3.6
    },
    {
      timestamp: getTimeOffset(12),
      level: 'Info',
      message: '✓ Personalized guidance generated',
      delay: 3.9
    },
    {
      timestamp: getTimeOffset(13),
      level: 'Notice',
      message: '=== Cosmic Data Generation Complete ===',
      delay: 4.2
    }
  ];
};

export default function TerminalAnimation() {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [terminalLines] = useState(() => generateTerminalLines());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (visibleLines < terminalLines.length) {
        setVisibleLines(prev => prev + 1);
      } else {
        setIsComplete(true);
      }
    }, terminalLines[visibleLines]?.delay * 1000 || 0);

    return () => clearTimeout(timer);
  }, [visibleLines, terminalLines]);

  const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const [displayedText, setDisplayedText] = useState('');
    
    useEffect(() => {
      let i = 0;
      const timer = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(timer);
        }
      }, 20 + Math.random() * 30); // Variable typing speed for realism
      
      return () => clearInterval(timer);
    }, [text]);
    
    return <span>{displayedText}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {/* Terminal Header */}
      <div className="bg-gray-900 rounded-t-lg border border-gray-700 p-3">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-400 text-sm ml-4 font-mono">AstropalGuidanceGenerator v2.1.0</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="bg-black rounded-b-lg border-l border-r border-b border-gray-700 p-4 h-64 md:h-80 overflow-y-auto font-mono text-sm">
        <AnimatePresence>
          {terminalLines.slice(0, visibleLines).map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-start space-x-2 mb-1"
            >
              <span className="text-gray-500 text-xs whitespace-nowrap">{line.timestamp}</span>
              <span className={`text-xs font-semibold ${
                line.level === 'Notice' ? 'text-blue-400' : 'text-purple-400'
              }`}>
                {line.level}
              </span>
              <span className="text-green-400 flex-1">
                {index === visibleLines - 1 ? (
                  <TypewriterText text={line.message} />
                ) : (
                  line.message
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Cursor */}
        {!isComplete && (
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-green-400 ml-1"
          />
        )}
      </div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isComplete ? 1 : 0 }}
        transition={{ delay: 1 }}
        className="mt-4 text-center"
      >
        <p className="text-gray-400 text-sm">
          This is how we generate your personalized cosmic guidance every morning
        </p>
      </motion.div>
    </motion.div>
  );
}
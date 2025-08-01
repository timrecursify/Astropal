import React from 'react';
import { Star } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-center items-center px-6">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Star className="w-6 h-6" />
          <span className="font-mono text-lg">ASTROPAL</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-light mb-8">404</h1>
        <h2 className="text-2xl md:text-3xl font-light mb-6">Page Not Found</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          The cosmic path you're looking for seems to have drifted into another dimension.
        </p>
        
        <a 
          href="/"
          className="inline-block px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium"
        >
          RETURN TO EARTH
        </a>
      </div>
    </div>
  );
};

export default NotFound;
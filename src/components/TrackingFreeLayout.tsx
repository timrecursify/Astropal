import React from 'react';
import { blockTrackingScripts } from '../utils/trackingLoader';

interface TrackingFreeLayoutProps {
  children: React.ReactNode;
  title: string;
}

const TrackingFreeLayout: React.FC<TrackingFreeLayoutProps> = ({ children, title }) => {
  React.useEffect(() => {
    // Override document title for these pages
    document.title = title;
    
    // Block tracking scripts completely
    blockTrackingScripts();

    // Add meta tags to prevent indexing
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow, noarchive, nosnippet';
    document.head.appendChild(metaRobots);

    const metaGooglebot = document.createElement('meta');
    metaGooglebot.name = 'googlebot';
    metaGooglebot.content = 'noindex, nofollow, noarchive, nosnippet';
    document.head.appendChild(metaGooglebot);

    // Cleanup function
    return () => {
      document.head.removeChild(metaRobots);
      document.head.removeChild(metaGooglebot);
    };
  }, [title]);

  return <>{children}</>;
};

export default TrackingFreeLayout;
import React from 'react';

interface TrackingFreeLayoutProps {
  children: React.ReactNode;
  title: string;
}

const TrackingFreeLayout: React.FC<TrackingFreeLayoutProps> = ({ children, title }) => {
  React.useEffect(() => {
    // Override document title for these pages
    document.title = title;
    
    // Completely disable tracking scripts before they can load
    if (typeof window !== 'undefined') {
      // Disable Facebook Pixel completely
      if (window.fbq) {
        window.fbq = () => {}; // Stub out the function
      }
      
      // Disable Microsoft Clarity completely
      if (window.clarity) {
        window.clarity = () => {}; // Stub out the function
      }
      
      // Remove any existing tracking scripts
      const fbScripts = document.querySelectorAll('script[src*="facebook.net"], script[src*="fbevents.js"]');
      fbScripts.forEach(script => script.remove());
      
      const clarityScripts = document.querySelectorAll('script[src*="clarity.ms"]');
      clarityScripts.forEach(script => script.remove());
      
      // Block any future script loads for tracking
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const element = node as Element;
              if (element.tagName === 'SCRIPT') {
                const src = element.getAttribute('src');
                if (src && (src.includes('facebook.net') || src.includes('clarity.ms'))) {
                  element.remove();
                }
              }
            }
          });
        });
      });
      
      observer.observe(document.head, { childList: true, subtree: true });
      observer.observe(document.body, { childList: true, subtree: true });
    }

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
// Tracking script loader - only loads on allowed pages

let clarityLoaded = false;
let facebookPixelLoaded = false;

/**
 * Load tracking scripts only on main pages (not service pages)
 */
export function loadTrackingScripts(): void {
  const path = window.location.pathname;
  const excludedPaths = ['/feedback', '/unsubscribe'];
  
  // Don't load tracking on excluded paths
  if (excludedPaths.includes(path)) {
    console.log('Tracking scripts blocked on service page:', path);
    return;
  }

  console.log('Loading tracking scripts for:', path);

  // Load Microsoft Clarity
  if (!clarityLoaded && typeof window !== 'undefined') {
    (function(c: any, l: Document, a: string, r: string, i: string, t: HTMLScriptElement, y: HTMLScriptElement) {
      c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0] as HTMLScriptElement;
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", "so6j2uvy4i");
    clarityLoaded = true;
  }

  // Load Facebook Pixel
  if (!facebookPixelLoaded && typeof window !== 'undefined') {
    (function(f: any, b: Document, e: string, v: string, n: any, t: HTMLScriptElement, s: HTMLScriptElement) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0] as HTMLScriptElement;
      s.parentNode?.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    (window as any).fbq('init', '1840372693567321');
    (window as any).fbq('track', 'PageView');
    facebookPixelLoaded = true;

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1840372693567321&ev=PageView&noscript=1" />';
    document.body.appendChild(noscript);
  }
}

/**
 * Block tracking scripts completely (for service pages)
 */
export function blockTrackingScripts(): void {
  // Stub out functions to prevent errors
  if (typeof window !== 'undefined') {
    (window as any).fbq = () => {};
    (window as any).clarity = () => {};
    
    // Remove any existing tracking scripts
    const scripts = document.querySelectorAll('script[src*="clarity.ms"], script[src*="facebook.net"], script[src*="fbevents.js"]');
    scripts.forEach(script => script.remove());
    
    console.log('Tracking scripts blocked on service page');
  }
}
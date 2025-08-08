import React from 'react';

interface EmailPreviewProps {
  variant: 'variant0' | 'variant1' | 'variant2';
}

export default function EmailPreview({ variant }: EmailPreviewProps) {
  const accent = variant === 'variant0' ? 'border-gray-700' : variant === 'variant1' ? 'border-purple-700' : 'border-pink-700';
  const heading = variant === 'variant0' ? 'Your 6:00 AM Cosmic Brief' : variant === 'variant1' ? 'Your 6:00 AM Wellness Brief' : 'Your 6:00 AM Lifestyle Brief';
  const tag = variant === 'variant0' ? 'NASA • Swiss Ephemeris' : variant === 'variant1' ? 'Mood • Reflection • Clarity' : 'No Apps • Inbox • Perfect Timing';

  return (
    <div className={`bg-gray-900/40 border ${accent} rounded-xl p-4 md:p-5 w-full max-w-2xl mx-auto`}
         aria-label="Email preview">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <img src="/Astropal_Logo.png" alt="Astropal" className="w-5 h-5" />
          <span className="text-sm text-white font-medium">Astropal</span>
        </div>
        <span className="text-xs text-gray-500">6:00 AM</span>
      </div>
      <div className="mb-2">
        <h4 className="text-white text-sm md:text-base font-semibold">{heading}: Power Hour 9:40–10:15 AM</h4>
        <p className="text-xs text-gray-400">{tag}</p>
      </div>
      <div className="space-y-2 text-sm">
        <div className="text-gray-300">
          • Focus: Career momentum is favored; send that outreach by 10:00 AM.
        </div>
        <div className="text-gray-300">
          • Caution: Emotional spikes around 3 PM—pause before replying.
        </div>
        <div className="text-gray-300">
          • Ritual: 90-second breath at 11:30 AM for clarity; sip water.
        </div>
      </div>
    </div>
  );
}



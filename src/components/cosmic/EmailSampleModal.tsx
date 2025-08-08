import React from 'react';

interface EmailSampleModalProps {
  open: boolean;
  onClose: () => void;
  variant: 'variant0' | 'variant1' | 'variant2';
}

export default function EmailSampleModal({ open, onClose, variant }: EmailSampleModalProps) {
  if (!open) return null;

  const accent = variant === 'variant0' ? 'border-gray-700' : variant === 'variant1' ? 'border-purple-700' : 'border-pink-700';
  const isVariant0 = variant === 'variant0';
  const now = new Date();
  const dayName = now.toLocaleDateString(undefined, { weekday: 'long' });
  const monthDay = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className={`relative w-full max-w-3xl bg-gray-950 border ${accent} rounded-2xl shadow-2xl overflow-hidden`}
           role="dialog" aria-modal="true" aria-label="Sample Email Preview">
        {/* Header styled like an email header */}
        <div className="p-4 border-b border-gray-800">
          <div className="text-xs text-gray-500 mb-1">From: Astropal &lt;newsletter@astropal.io&gt;</div>
          <div className="text-xs text-gray-500 mb-1">To: you@example.com</div>
          <div className="text-sm text-white font-medium">Your Daily Cosmic Guide — {dayName}</div>
        </div>

        {/* Body: mirror of generated_email_sample.md structure (condensed) */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Email headline block */}
          <div className="text-center">
            <img src="/Astropal_Logo.png" alt="Astropal" className="w-10 h-10 mx-auto mb-3 opacity-80" />
            <div className="text-gray-300">Hello • {dayName}, {monthDay}</div>
            <h1 className="text-white text-lg font-semibold mt-1">Your Daily Cosmic Guide</h1>
          </div>
          <div className="text-gray-300">
            <div className="text-sm text-gray-400 italic mb-2">3 key insights + actionable steps for your day ahead</div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-left">
              <p className="text-gray-200 text-sm">What a fantastic Friday to close out your week! The Sun in Leo is showering you with bold, joyful energy, inspiring you to bask in your accomplishments and share your success with others. The Moon in Gemini adds a playful, communicative vibe, making it the perfect time to connect with loved ones and revel in the harmony of your achievements. Finish strong, celebrate every win, and fill today with joy and pride.</p>
            </div>
          </div>

          <div>
            <h3 className="text-white text-base font-semibold mb-3">Optimal Timing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className={`bg-gray-900/40 ${isVariant0 ? 'border-l-4 border-gray-500' : 'border-l-4 border-green-500/70'} border border-gray-800 rounded-lg p-3 text-left`}>
                <div className="text-[11px] uppercase text-gray-400 mb-2">Power Hours</div>
                <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                  <li>10am to 1pm — tie up loose ends and finish tasks with momentum</li>
                  <li>5pm to 8pm — celebration and meaningful connections with loved ones</li>
                </ul>
              </div>
              <div className={`bg-gray-900/40 ${isVariant0 ? 'border-l-4 border-gray-600' : 'border-l-4 border-red-500/70'} border border-gray-800 rounded-lg p-3 text-left`}>
                <div className="text-[11px] uppercase text-gray-400 mb-2">Caution Windows</div>
                <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                  <li>1pm to 3pm — avoid overindulgence; finish priorities first</li>
                </ul>
              </div>
            </div>
            {/* Insights heading below the timing grid */}
            <div className="mt-4 text-left">
              <div className="text-[12px] uppercase text-gray-300 font-semibold">Your Daily Insights</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`bg-gray-900/40 ${isVariant0 ? 'border-t-4 border-gray-600' : 'border-t-4 border-purple-500/70'} border border-gray-800 rounded-lg p-3 text-left`}>
              <div className={`text-[12px] uppercase ${isVariant0 ? 'text-gray-300' : 'text-gray-300'} font-semibold mb-2`}>Astrology Insights</div>
              <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                <li>The Sun in Leo lights up your week’s end with a burst of confidence and joy, helping you complete projects with flair and celebrate hard work with a big, proud heart.</li>
                <li>Current transits are spotlighting achievements in building stronger bonds in Love & Relationships through heartfelt conversations and shared moments of joy.</li>
                <li>In Wealth & Abundance, the stars cheer recent steps toward financial growth or creative ventures, while in Personal Growth, Leo’s energy celebrates the courage to step into your power.</li>
              </ul>
            </div>
            <div className={`bg-gray-900/40 ${isVariant0 ? 'border-t-4 border-gray-700' : 'border-t-4 border-blue-500/70'} border border-gray-800 rounded-lg p-3 text-left`}>
              <div className={`text-[12px] uppercase ${isVariant0 ? 'text-gray-300' : 'text-gray-300'} font-semibold mb-2`}>Numerology Guidance</div>
              <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                <li>With Life Path 8, there’s a natural drive for success; today’s Energy 7 brings a sense of completion and reflection to celebrate progress.</li>
                <li>Recognize one achievement in Love & Relationships where understanding and support deepened trust.</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-900/40 border-l-4 border-yellow-500/70 border border-gray-800 rounded-lg p-3 text-left">
              <div className="text-[12px] uppercase text-gray-300 font-semibold mb-2">Today’s Cosmic To‑Do</div>
              <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                <li>Wrap up a lingering task or project this morning with pride.</li>
                <li>Host or join a small gathering to toast weekly wins.</li>
                <li>Reach out for a heartfelt chat that brings mutual happiness.</li>
              </ul>
            </div>
            <div className="bg-gray-900/40 border-l-4 border-cyan-500/70 border border-gray-800 rounded-lg p-3 text-left">
              <div className="text-[12px] uppercase text-gray-300 font-semibold mb-2">Quick Reference</div>
              <ul className="text-gray-200 text-sm space-y-1 list-disc list-inside">
                <li><span className="text-gray-400">Lucky Colors</span> — Gold, Bright Yellow, Warm Coral</li>
                <li><span className="text-gray-400">Affirmation</span> — “I celebrate my strength and success with joy, knowing every step builds my abundant future.”</li>
                <li><span className="text-gray-400">Mindful Moment</span> — Take five minutes to write three wins and express gratitude for your journey.</li>
              </ul>
            </div>
          </div>

          <div className="text-[11px] text-gray-500 border-t border-gray-800 pt-3">
            Based on NASA Horizons, Swiss Ephemeris, and numerology calculations.
          </div>

          {/* Footer like an email footer */}
          <div className="pt-2 text-center text-[11px] text-gray-500">
            <div>© {new Date().getFullYear()} Astropal. All rights reserved.</div>
            <div className="mt-1">Visit astropal.io • Unsubscribe</div>
          </div>
        </div>
      </div>
    </div>
  );
}



export interface CtaVariant {
  id: string;
  label: string;
  subtext?: string;
}

export const CTA_VARIANTS: CtaVariant[] = [
  // Core conversion
  { id: 'CTA-GET-AI-BRIEF', label: 'Get My Daily AI Astrology Brief', subtext: 'Free 7‑day trial • No card • Cancel anytime' },
  { id: 'CTA-START-FREE', label: 'Start Free 7‑Day Trial', subtext: 'Personalized at 6 AM • Cancel anytime' },
  { id: 'CTA-SEND-FIRST', label: 'Send My First AI Forecast', subtext: 'Arrives at your start‑of‑day • No apps' },

  // Outcome-focused
  { id: 'CTA-SHOW-BEST-TIMES', label: 'Show Me Today’s Best Times', subtext: 'Power hours & cautions in one brief' },
  { id: 'CTA-UNLOCK-ADVANTAGE', label: 'Unlock My Morning Advantage', subtext: 'AI timing for work, love, wellbeing' },

  // Simplicity / convenience
  { id: 'CTA-GET-MORNING-GUIDE', label: 'Get My Morning Guide', subtext: 'One email, perfectly timed' },
  { id: 'CTA-NO-APPS', label: 'Send It to My Inbox', subtext: 'No apps to manage • Easy to keep' },

  // Personalization angle
  { id: 'CTA-PERSONALIZE', label: 'Personalize My AI Horoscope', subtext: 'Tuned to your details for accuracy' },
  { id: 'CTA-LOVE-CAREER', label: 'Get Love & Career Timing', subtext: 'Power hours for what matters most' },
];

const CTA_COOKIE = 'astropal_cta_variant';
const CTA_COOKIE_DAYS = 14;

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax;Secure`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const parts = document.cookie.split(';');
  for (let c of parts) {
    c = c.trim();
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length);
  }
  return null;
}

export function getCtaVariant(): CtaVariant {
  try {
    const existing = getCookie(CTA_COOKIE);
    if (existing) {
      const found = CTA_VARIANTS.find(v => v.id === existing);
      if (found) return found;
    }
    const idx = Math.floor(Math.random() * CTA_VARIANTS.length);
    const selected = CTA_VARIANTS[idx];
    setCookie(CTA_COOKIE, selected.id, CTA_COOKIE_DAYS);
    return selected;
  } catch {
    return CTA_VARIANTS[0];
  }
}



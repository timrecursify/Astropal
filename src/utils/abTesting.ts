// A/B Testing utilities
export type VariantType = 'variant0' | 'variant1' | 'variant2';

const VARIANT_COOKIE_NAME = 'astropal_ab_variant';
const COOKIE_EXPIRY_DAYS = 30;

// Set cookie with expiry
function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure`;
}

// Get cookie value
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Randomly assign variant with equal 33.33% distribution
function getRandomVariant(): VariantType {
  const random = Math.random();
  if (random < 0.333) return 'variant0';
  if (random < 0.666) return 'variant1';
  return 'variant2';
}

// Get or assign variant for user
export function getUserVariant(): VariantType {
  // Check if user already has a variant assigned
  const existingVariant = getCookie(VARIANT_COOKIE_NAME) as VariantType | null;
  
  if (existingVariant && ['variant0', 'variant1', 'variant2'].includes(existingVariant)) {
    return existingVariant;
  }
  
  // Assign new variant
  const newVariant = getRandomVariant();
  setCookie(VARIANT_COOKIE_NAME, newVariant, COOKIE_EXPIRY_DAYS);
  
  return newVariant;
}

// Get variant for analytics/tracking
export function getVariantForTracking(): string {
  return getUserVariant();
}

// Clear variant (for testing purposes)
export function clearVariant(): void {
  document.cookie = `${VARIANT_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
} 
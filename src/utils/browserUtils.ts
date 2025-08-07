// Browser utility functions to prevent re-renders

/**
 * Get the user's timezone in a stable way
 */
export function getStableTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Error getting timezone:', error);
    return 'UTC';
  }
}

/**
 * Safely check localStorage without causing errors
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  return null;
}

/**
 * Safely set localStorage without causing errors
 */
export function safeLocalStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
}

/**
 * Safely remove from localStorage
 */
export function safeLocalStorageRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}
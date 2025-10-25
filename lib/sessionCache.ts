import type { User } from '@/lib/api';

/**
 * Session Storage Cache for User Data
 *
 * Stores fetched user data in sessionStorage to avoid repeated API calls
 * within the same browser session. Cache is automatically cleared when:
 * - Browser tab is closed
 * - User logs out
 * - Session token changes
 *
 * This significantly reduces loading times for subsequent page loads and
 * navigation within the same session.
 */

const CACHE_KEY = 'lh_user_cache';
const CACHE_VERSION = 1;

interface CachedUserData {
  version: number;
  user: User;
  timestamp: number;
}

/**
 * Get cached user data from session storage
 * Returns null if cache doesn't exist or has been cleared
 */
export function getCachedUser(): User | null {
  try {
    if (typeof window === 'undefined') return null;

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedUserData = JSON.parse(cached);

    // Validate cache version
    if (data.version !== CACHE_VERSION) {
      clearUserCache();
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error reading user cache:', error);
    return null;
  }
}

/**
 * Store user data in session storage
 */
export function setCachedUser(user: User): void {
  try {
    if (typeof window === 'undefined') return;

    const data: CachedUserData = {
      version: CACHE_VERSION,
      user,
      timestamp: Date.now(),
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing user cache:', error);
  }
}

/**
 * Clear user cache from session storage
 * Call this when user logs out or session changes
 */
export function clearUserCache(): void {
  try {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
}

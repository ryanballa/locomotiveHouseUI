/**
 * Cookie utilities for managing client-side cookie operations
 * Used for persisting user preferences like selected club
 */

/**
 * Set a cookie value
 * @param name - Cookie name
 * @param value - Cookie value
 * @param days - Number of days until expiration (default: 365)
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  try {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    const path = "path=/";
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};${path};SameSite=Lax`;
  } catch (err) {
    // Silently fail if cookies are not available (e.g., in SSR)
    console.debug("Failed to set cookie:", err);
  }
}

/**
 * Get a cookie value
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  try {
    if (typeof document === "undefined") {
      return null;
    }

    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith(nameEQ)) {
        const value = trimmedCookie.substring(nameEQ.length);
        return decodeURIComponent(value);
      }
    }
    return null;
  } catch (err) {
    console.debug("Failed to get cookie:", err);
    return null;
  }
}

/**
 * Delete a cookie
 * @param name - Cookie name
 */
export function deleteCookie(name: string): void {
  try {
    setCookie(name, "", -1);
  } catch (err) {
    console.debug("Failed to delete cookie:", err);
  }
}

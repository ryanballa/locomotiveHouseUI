'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiClient, type User } from '@/lib/api';
import { UserSessionContext, type UserSessionError, type UserSessionContextType } from '@/context/UserSessionContext';
import { getCachedUser, setCachedUser, clearUserCache } from '@/lib/sessionCache';

interface UserSessionProviderProps {
  children: ReactNode;
}

/**
 * UserSessionProvider: Centralized user session management
 *
 * This provider fetches user information once from Clerk + backend and makes it
 * available throughout the application via the useSessionUser hook.
 *
 * Features:
 * - Fetches user data once on app load and caches in session
 * - Provides user info to all child components via context
 * - Handles loading, error, and authentication states
 * - Allows manual refetch of user data when needed
 * - Automatically clears cache on logout
 *
 * Usage:
 * Wrap your app with this provider in layout.tsx:
 *
 * ```typescript
 * <ClerkProvider>
 *   <UserSessionProvider>
 *     {children}
 *   </UserSessionProvider>
 * </ClerkProvider>
 * ```
 *
 * Then use useSessionUser() in any component to access user data:
 *
 * ```typescript
 * const { user, isSignedIn, isLoading } = useSessionUser();
 * ```
 */
export function UserSessionProvider({ children }: UserSessionProviderProps) {
  const { isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<UserSessionError | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from cache after hydration
  useEffect(() => {
    setIsHydrated(true);

    // Try to load from cache immediately to prevent hydration mismatch
    const cachedUser = getCachedUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
      setError(null);
    }
  }, []);

  // Fetch user data from API
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // If not signed in, clear user data and cache
      if (!isSignedIn) {
        setUser(null);
        clearUserCache();
        setIsLoading(false);
        return;
      }

      // Check cache first (already hydrated at this point)
      const cachedUser = getCachedUser();
      if (cachedUser) {
        setUser(cachedUser);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Get token from Clerk
      const token = await getToken();
      if (!token) {
        setError({
          code: 'UNAUTHENTICATED',
          message: 'Unable to get authentication token from Clerk',
        });
        setIsLoading(false);
        return;
      }

      // Fetch user data from backend
      const userData = await apiClient.getCurrentUser(token);

      if (!userData) {
        setError({
          code: 'NOT_FOUND',
          message: 'User not found. Please contact support if this persists.',
        });
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Cache and set user data
      setCachedUser(userData);
      setUser(userData);
      setError(null);
    } catch (err) {
      const cause = err instanceof Error ? err : new Error(String(err));
      const message = cause.message || 'Failed to fetch user information';

      if (
        message.includes('Unauthenticated') ||
        message.includes('401') ||
        message.includes('unauthorized')
      ) {
        setError({
          code: 'UNAUTHENTICATED',
          message: 'Your session has expired. Please sign in again.',
          cause,
        });
        clearUserCache();
      } else if (
        message.includes('Network') ||
        message.includes('ECONNREFUSED') ||
        message.includes('Failed to fetch')
      ) {
        setError({
          code: 'NETWORK',
          message: 'Network error while fetching user information.',
          cause,
        });
      } else {
        setError({
          code: 'UNKNOWN',
          message: message,
          cause,
        });
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  // Fetch user data when signed-in state changes
  useEffect(() => {
    if (!isHydrated) return;
    fetchUserData();
  }, [isSignedIn, isHydrated, fetchUserData]);

  const contextValue: UserSessionContextType = {
    user,
    isSignedIn: isSignedIn ?? false,
    isLoading,
    error,
    refetch: fetchUserData,
  };

  return (
    <UserSessionContext.Provider value={contextValue}>
      {children}
    </UserSessionContext.Provider>
  );
}

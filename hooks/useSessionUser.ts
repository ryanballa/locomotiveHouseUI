'use client';

import { useContext } from 'react';
import { UserSessionContext } from '@/context/UserSessionContext';

/**
 * Custom hook to access the current user session data
 *
 * This hook provides access to user information that has been fetched once
 * from Clerk and the backend API, stored in session, and managed via context.
 *
 * Instead of each component fetching user data independently, use this hook
 * to access the centralized user session data.
 *
 * @returns User session data including:
 *   - user: Full user object with id, token, name, email, permission, club_id, clubs
 *   - isSignedIn: Whether user is authenticated
 *   - isLoading: Whether user data is still being fetched
 *   - error: Error object if fetch failed
 *   - refetch: Function to manually refetch user data
 *
 * @throws Error if used outside of UserSessionProvider
 *
 * @example
 * ```typescript
 * const { user, isSignedIn, isLoading } = useSessionUser();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isSignedIn) return <SignInRequired />;
 *
 * return <div>Welcome {user?.name}</div>;
 * ```
 */
export function useSessionUser() {
  const context = useContext(UserSessionContext);

  if (!context) {
    throw new Error(
      'useSessionUser must be used within a UserSessionProvider. ' +
      'Make sure your app is wrapped with <UserSessionProvider> in layout.tsx'
    );
  }

  return context;
}

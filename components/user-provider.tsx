'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { apiClient, type User } from '@/lib/api';
import { useDialog } from '@/hooks/useDialog';
import { ProfileCompletionModal } from './ProfileCompletionModal';

/**
 * Provider component that wraps the entire application
 *
 * Features:
 * - Auto-registers users on sign-in
 * - Checks if user profile is complete in the BACKEND database (has first/last name)
 * - Shows profile completion modal if needed
 * - Prevents navigation until profile is completed
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded: authIsLoaded, getToken } = useAuth();
  const { user, isLoaded: userIsLoaded } = useUser();
  const { isOpen, open, close } = useDialog();
  const [missingFields, setMissingFields] = useState<('firstName' | 'lastName')[]>([]);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [backendUser, setBackendUser] = useState<User | null>(null);
  const [isUserRegistered, setIsUserRegistered] = useState(false);

  /**
   * Auto-register user on sign-in if they don't have lhUserId
   * This ensures the user exists in the database with their Clerk ID
   * This must run BEFORE the profile completion check
   */
  useEffect(() => {
    const ensureUserRegistered = async () => {
      if (!authIsLoaded || !userIsLoaded || !isSignedIn || !user) {
        return;
      }

      const lhUserId = (user.unsafeMetadata as any)?.lhUserId;

      // Skip if already registered
      if (lhUserId) {
        setIsUserRegistered(true);
        return;
      }

      try {
        // Trigger auto-registration - this creates the user in the database
        const response = await fetch('/api/user-id');

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Auto-registration failed:', errorData.error || response.statusText);
          setIsUserRegistered(true);
          return;
        }

        const data = await response.json();

        if (data.lhUserId) {
          // Force refresh user metadata to get the updated lhUserId
          await user.reload();
        } else {
          console.warn('Auto-registration did not return lhUserId:', data);
        }
      } catch (error) {
        console.error('Failed to auto-register user:', error);
      } finally {
        setIsUserRegistered(true);
      }
    };

    ensureUserRegistered();
  }, [authIsLoaded, userIsLoaded, isSignedIn, user]);

  /**
   * Check if user profile is complete in the backend database and show modal if needed
   * This runs AFTER auto-registration to ensure user data is synced
   */
  useEffect(() => {
    const checkAndPromptProfileCompletion = async () => {
      // Wait for auth, user, and registration to be complete
      if (!authIsLoaded || !userIsLoaded || !isUserRegistered) return;

      // If not signed in, skip check
      if (!isSignedIn || !user) {
        setHasCheckedProfile(true);
        return;
      }

      try {
        // Get the token to fetch backend user data
        const token = await getToken();
        if (!token) {
          console.warn('No token available for fetching backend user data');
          setHasCheckedProfile(true);
          return;
        }

        // Fetch the current user from the backend database
        const dbUser = await apiClient.getCurrentUser(token);

        if (!dbUser) {
          console.warn('Could not fetch backend user data');
          setHasCheckedProfile(true);
          return;
        }

        setBackendUser(dbUser);

        // Check for missing first name or last name in the BACKEND database
        const missing: ('firstName' | 'lastName')[] = [];

        if (!dbUser.firstName || dbUser.firstName.trim() === '') {
          missing.push('firstName');
        }

        if (!dbUser.lastName || dbUser.lastName.trim() === '') {
          missing.push('lastName');
        }

        // If profile is incomplete, show modal
        if (missing.length > 0) {
          setMissingFields(missing);
          open();
        }
      } catch (error) {
        console.error('Error checking profile completion:', error);
      } finally {
        setHasCheckedProfile(true);
      }
    };

    checkAndPromptProfileCompletion();
  }, [authIsLoaded, userIsLoaded, isUserRegistered, isSignedIn, user, getToken, open]);

  return (
    <>
      {children}
      <ProfileCompletionModal
        isOpen={isOpen}
        onClose={close}
        missingFields={missingFields}
        userId={backendUser?.id || null}
      />
    </>
  );
}

import { useEffect, useState, useCallback } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

/**
 * Indicates whether a user profile is incomplete
 */
interface ProfileCompletionStatus {
  /** Whether user profile is complete (has first and last name) */
  isComplete: boolean;

  /** Whether currently checking completion status */
  isLoading: boolean;

  /** Error message if check failed */
  error: string | null;

  /** Missing profile fields */
  missingFields: ("firstName" | "lastName")[];
}

/**
 * Hook to check if the current user's profile is complete
 *
 * Checks if user has both firstName and lastName in their Clerk profile.
 * Returns loading and error states while checking.
 *
 * ## Profile Completion Requirements
 *
 * A user's profile is considered complete when:
 * - User is signed in
 * - User has a firstName in their Clerk profile
 * - User has a lastName in their Clerk profile
 *
 * ## Usage
 *
 * ```tsx
 * const { isComplete, isLoading, missingFields } = useProfileCompletion();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!isComplete) return <CompleteProfileModal missingFields={missingFields} />;
 * return <AppContent />;
 * ```
 *
 * ## Real-World Example
 *
 * ```tsx
 * export function ProfileGuard({ children }: { children: React.ReactNode }) {
 *   const { isComplete, isLoading, missingFields } = useProfileCompletion();
 *   const { isOpen, open, close } = useDialog();
 *
 *   useEffect(() => {
 *     if (!isLoading && !isComplete) {
 *       open();
 *     }
 *   }, [isLoading, isComplete]);
 *
 *   return (
 *     <>
 *       {children}
 *       <ProfileCompletionModal
 *         isOpen={isOpen}
 *         onClose={close}
 *         missingFields={missingFields}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @returns {ProfileCompletionStatus} Profile completion status and loading/error states
 *
 * @see {@link useProfileCompletion} for checking profile completion
 */
export function useProfileCompletion(): ProfileCompletionStatus {
  const { getToken, isSignedIn, isLoaded: authIsLoaded } = useAuth();
  const { user, isLoaded: userIsLoaded } = useUser();
  const [isComplete, setIsComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<("firstName" | "lastName")[]>([]);

  useEffect(() => {
    let isActive = true;

    const checkProfileCompletion = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for auth to be loaded
        if (!authIsLoaded || !userIsLoaded) {
          return;
        }

        // If not signed in, profile is considered complete (will redirect to login)
        if (!isSignedIn || !user) {
          if (isActive) {
            setIsComplete(true);
            setIsLoading(false);
            setMissingFields([]);
          }
          return;
        }

        // Check for missing first name or last name
        const missing: ("firstName" | "lastName")[] = [];

        if (!user.firstName || user.firstName.trim() === "") {
          missing.push("firstName");
        }

        if (!user.lastName || user.lastName.trim() === "") {
          missing.push("lastName");
        }

        if (isActive) {
          setIsComplete(missing.length === 0);
          setMissingFields(missing);
          setIsLoading(false);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to check profile";
        if (isActive) {
          setError(errorMsg);
          setIsLoading(false);
          setIsComplete(true); // Allow app to continue on error
        }
      }
    };

    checkProfileCompletion();

    // Cleanup function
    return () => {
      isActive = false;
    };
  }, [authIsLoaded, userIsLoaded, isSignedIn, user]);

  return {
    isComplete,
    isLoading,
    error,
    missingFields,
  };
}

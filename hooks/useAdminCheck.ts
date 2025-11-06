import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import {
  getCachedUser,
  setCachedUser,
  clearUserCache,
} from "@/lib/sessionCache";
import type { User } from "@/lib/api";

type AdminCheckError = {
  code:
    | "UNAUTHENTICATED"
    | "FORBIDDEN"
    | "USER_NOT_FOUND"
    | "NETWORK"
    | "UNKNOWN";
  message: string;
  cause?: unknown;
} | null;

/**
 * Minimal user shape exposed by the admin check hook
 * Contains only the essential data needed to verify admin status
 * Prevents accidental mutations and reduces coupling
 *
 * Permission levels:
 * - 1: Admin (can manage clubs and users)
 * - 2: Regular user (limited to assigned club)
 * - 3: Super Admin (can see everything, bypasses club restrictions)
 * - 4: Limited (can only perform tasks within their scope)
 */
type MinimalUser = Readonly<Pick<User, "id" | "permission">>;

interface UseAdminCheckReturn {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  currentUser: MinimalUser | null;
  loading: boolean;
  error: AdminCheckError;
}

/**
 * Custom hook to check if the current user has admin or super admin permissions.
 *
 * Fetches current user data from API and validates permission level:
 * - Permission 1: Regular Admin (can manage clubs and users within their scope)
 * - Permission 3: Super Admin (can access everything, bypasses all restrictions)
 *
 * More efficient than fetching all users - uses /users/me endpoint.
 *
 * @returns {UseAdminCheckReturn} Object containing:
 *   - isAdmin: true if user has permission 1 or 3
 *   - isSuperAdmin: true if user has permission 3 (bypasses club restrictions)
 *   - currentUser: Minimal user data with id and permission
 *   - loading: true while checking admin status
 *   - error: Error details if check fails
 *
 * @example
 * ```typescript
 * const { isAdmin, isSuperAdmin, loading } = useAdminCheck();
 *
 * if (loading) return <LoadingSpinner />;
 * if (!isAdmin) return <AccessDenied />;
 *
 * if (isSuperAdmin) {
 *   // Show full admin panel with all features
 * } else {
 *   // Show limited admin panel
 * }
 * ```
 */
export function useAdminCheck(): UseAdminCheckReturn {
  const { getToken, isSignedIn } = useAuth();
  const [currentUser, setCurrentUser] = useState<MinimalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminCheckError>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // First useEffect: Initialize from cache after hydration
  useEffect(() => {
    setIsHydrated(true);

    // Try to load from cache immediately to prevent flicker
    const cachedUser = getCachedUser();
    if (cachedUser) {
      const minimalUser: MinimalUser = {
        id: cachedUser.id,
        permission: cachedUser.permission,
      };
      setCurrentUser(minimalUser);
      setLoading(false);
    }
  }, []);

  // Second useEffect: Check admin status
  useEffect(() => {
    let isActive = true;

    const checkAdmin = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSignedIn) {
          if (!isActive) return;
          setCurrentUser(null);
          clearUserCache();
          setLoading(false);
          return;
        }

        // Check if we have cached user data
        const cachedUser = getCachedUser();
        if (cachedUser && isActive) {
          const minimalUser: MinimalUser = {
            id: cachedUser.id,
            permission: cachedUser.permission,
          };
          setCurrentUser(minimalUser);

          // Validate admin permission from cache
          if (cachedUser.permission !== 1 && cachedUser.permission !== 3) {
            setError({
              code: "FORBIDDEN",
              message: "You do not have permission to access this resource.",
            });
          } else {
            setError(null);
          }

          setLoading(false);
          return;
        }

        const token = await getToken();
        if (!isActive) return;

        if (!token) {
          setError({
            code: "UNAUTHENTICATED",
            message: "Authentication token is required. Please sign in.",
          });
          setLoading(false);
          return;
        }

        // Fetch current user from the API
        const currentUserData = await apiClient.getCurrentUser(token);

        // Guard against state updates if component unmounted during async operation
        if (!isActive) return;

        // Extract only the minimal user data needed for admin check
        if (currentUserData) {
          const minimalUser: MinimalUser = {
            id: currentUserData.id,
            permission: currentUserData.permission,
          };
          setCurrentUser(minimalUser);

          // Cache the user data for future use
          setCachedUser(currentUserData);
        } else {
          setCurrentUser(null);
        }

        // Validate admin permission
        if (!currentUserData) {
          setError({
            code: "USER_NOT_FOUND",
            message: "User not found in database.",
          });
        } else if (
          currentUserData.permission !== 1 &&
          currentUserData.permission !== 3
        ) {
          setError({
            code: "FORBIDDEN",
            message: "You do not have permission to access this resource.",
          });
        } else {
          // Clear any previous errors if user has valid admin permission
          setError(null);
        }
      } catch (err) {
        if (!isActive) return;

        const cause = err instanceof Error ? err : new Error(String(err));
        const errorMessage = cause.message || "Failed to check admin status";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError({
            code: "UNAUTHENTICATED",
            message: "Your session has expired. Please sign in again.",
            cause,
          });
          clearUserCache();
        } else if (
          errorMessage.includes("Network") ||
          errorMessage.includes("ECONNREFUSED")
        ) {
          setError({
            code: "NETWORK",
            message: "Network error while checking admin status.",
            cause,
          });
        } else {
          setError({
            code: "UNKNOWN",
            message: errorMessage,
            cause,
          });
        }
      } finally {
        // Guard loading state update to prevent state update on unmounted component
        if (isActive) setLoading(false);
      }
    };

    checkAdmin();

    // Cleanup function: prevent state updates if component unmounts or dependencies change
    return () => {
      isActive = false;
    };
  }, [isSignedIn, getToken]);

  const isAdmin =
    currentUser &&
    (currentUser.permission === 1 || currentUser.permission === 3);

  const isSuperAdmin = currentUser && currentUser.permission === 3;

  return {
    isAdmin: !!isAdmin,
    isSuperAdmin: !!isSuperAdmin,
    currentUser,
    loading,
    error,
  };
}

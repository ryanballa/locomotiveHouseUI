import { useMemo } from "react";
import { useSessionUser } from "./useSessionUser";
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
 * Uses centralized session user data fetched once from the API.
 * Validates permission level:
 * - Permission 1: Regular Admin (can manage clubs and users within their scope)
 * - Permission 3: Super Admin (can access everything, bypasses all restrictions)
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
  const { user, isLoading, error: sessionError } = useSessionUser();

  // Memoize computed values to avoid unnecessary recalculations
  const { currentUser, isAdmin, isSuperAdmin, error } = useMemo(() => {
    if (!user) {
      return {
        currentUser: null,
        isAdmin: false,
        isSuperAdmin: false,
        error: null,
      };
    }

    const minimalUser: MinimalUser = {
      id: user.id,
      permission: user.permission,
    };

    const isAdminPermission =
      user.permission === 1 || user.permission === 3;
    const isSuperAdminPermission = user.permission === 3;

    // Determine if there's a permission error
    let permissionError: AdminCheckError = null;
    if (!isAdminPermission) {
      permissionError = {
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      };
    }

    return {
      currentUser: minimalUser,
      isAdmin: isAdminPermission,
      isSuperAdmin: isSuperAdminPermission,
      error: permissionError,
    };
  }, [user]);

  // Map session errors to admin check errors
  const finalError: AdminCheckError = error || (sessionError ? {
    code: sessionError.code as any,
    message: sessionError.message,
    cause: sessionError.cause,
  } : null);

  return {
    isAdmin,
    isSuperAdmin,
    currentUser,
    loading: isLoading,
    error: finalError,
  };
}

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import type { User } from "@/lib/api";

type AdminCheckError =
  | {
      code:
        | "UNAUTHENTICATED"
        | "FORBIDDEN"
        | "USER_NOT_FOUND"
        | "NETWORK"
        | "UNKNOWN";
      message: string;
      cause?: unknown;
    }
  | null;

interface UseAdminCheckReturn {
  isAdmin: boolean;
  currentUser: User | null;
  loading: boolean;
  error: AdminCheckError;
}

/**
 * Custom hook to check if the current user has admin permissions
 * Fetches current user data from API and validates permission level (1 or 3)
 * More efficient than fetching all users - uses /users/me endpoint
 */
export function useAdminCheck(): UseAdminCheckReturn {
  const { getToken, isSignedIn } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminCheckError>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSignedIn) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        const token = await getToken();
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

        setCurrentUser(currentUserData);

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
        }
      } catch (err) {
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
        } else if (errorMessage.includes("Network") || errorMessage.includes("ECONNREFUSED")) {
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
        setLoading(false);
      }
    };

    checkAdmin();
  }, [isSignedIn, getToken]);

  const isAdmin =
    currentUser &&
    (currentUser.permission === 1 || currentUser.permission === 3);

  return {
    isAdmin: !!isAdmin,
    currentUser,
    loading,
    error,
  };
}

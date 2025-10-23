import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import type { User } from "@/lib/api";

interface UseAdminCheckReturn {
  isAdmin: boolean;
  currentUser: User | null;
  loading: boolean;
  error: string | null;
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
  const [error, setError] = useState<string | null>(null);

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
          setError("Authentication required");
          setLoading(false);
          return;
        }

        // Fetch current user from the API
        const currentUserData = await apiClient.getCurrentUser(token);

        setCurrentUser(currentUserData);

        // Validate admin permission
        if (!currentUserData) {
          setError("User not found in database");
        } else if (
          currentUserData.permission !== 1 &&
          currentUserData.permission !== 3
        ) {
          setError("You do not have permission to access this resource.");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check admin status";
        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access this resource.");
        } else {
          setError(errorMessage);
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

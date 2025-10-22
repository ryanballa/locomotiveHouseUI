import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
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
 * Matches Clerk user ID against database users and validates permission level (1 or 3)
 */
export function useAdminCheck(): UseAdminCheckReturn {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
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

        // Fetch all users from the API
        const usersData = await apiClient.getUsers(token);

        // Find current user by matching Clerk ID
        const clerkUserId = user?.id;
        const matchedUser = usersData.find((u) => u.token === clerkUserId);

        setCurrentUser(matchedUser || null);

        // Validate admin permission
        if (!matchedUser) {
          setError("User not found in database");
        } else if (matchedUser.permission !== 1 && matchedUser.permission !== 3) {
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
  }, [isSignedIn, getToken, user?.id]);

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

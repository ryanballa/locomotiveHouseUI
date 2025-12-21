import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, User } from "@/lib/api";

interface UseClubMembersReturn {
  memberCount: number;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch the count of members in a club
 *
 * @param clubId - The ID of the club
 * @returns Object containing member count, loading state, and error state
 */
export function useClubMembers(clubId: number | string): UseClubMembersReturn {
  const { getToken, isSignedIn } = useAuth();
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          if (isActive) {
            setError("Authentication required");
          }
          return;
        }

        const clubUsers = await apiClient.getClubUsers(Number(clubId), token);
        if (!isActive) return;

        // Extract user objects from the API response
        const usersList: { id: number }[] = [];
        for (const item of clubUsers) {
          const userItem = (item as any).user;
          if (userItem) {
            usersList.push(userItem);
          }
        }

        if (isActive) {
          setMemberCount(usersList.length);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load members";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access members");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn]);

  return { memberCount, loading, error };
}

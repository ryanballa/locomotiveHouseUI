import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

interface UseClubCheckReturn {
  clubId: number | null;
  loading: boolean;
  hasClub: boolean;
}

/**
 * Custom hook to check if the current user has a club assignment
 * Fetches current user data from API and extracts club ID
 * Returns clubId, loading state, and boolean indicating if user has a club
 */
export function useClubCheck(): UseClubCheckReturn {
  const { getToken, isSignedIn } = useAuth();
  const [clubId, setClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkClub = async () => {
      try {
        setLoading(true);

        if (!isSignedIn) {
          setClubId(null);
          return;
        }

        const token = await getToken();
        if (!isActive) return;

        if (!token) {
          setClubId(null);
          return;
        }

        // Fetch current user from the API
        const currentUserData = await apiClient.getCurrentUser(token);

        // Guard against state updates if component unmounted during async operation
        if (!isActive) return;

        // Extract club_id from user data
        let userClubId: number | null = null;

        if (currentUserData) {
          // Check if user has clubs array (new format)
          if ((currentUserData as any).clubs && Array.isArray((currentUserData as any).clubs)) {
            const firstClub = (currentUserData as any).clubs[0];
            if (firstClub) {
              userClubId = firstClub.club_id;
            }
          } else if (currentUserData.club_id) {
            // Fall back to direct club_id field
            userClubId = currentUserData.club_id;
          }
        }

        setClubId(userClubId);
      } catch (err) {
        if (!isActive) return;
        console.error("Error checking club assignment:", err);
        setClubId(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    checkClub();

    // Cleanup function: prevent state updates if component unmounts or dependencies change
    return () => {
      isActive = false;
    };
  }, [isSignedIn, getToken]);

  return {
    clubId,
    loading,
    hasClub: clubId !== null,
  };
}

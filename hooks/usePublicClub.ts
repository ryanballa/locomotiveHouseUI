import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

interface Club {
  id: number;
  name: string;
}

interface UsePublicClubReturn {
  club: Club | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a specific club by ID for public pages
 * Works with or without authentication - tries to fetch with auth first,
 * then falls back to unauthenticated access
 *
 * @param clubId - The ID of the club to fetch
 * @returns Object containing club data, loading state, and error state
 */
export function usePublicClub(clubId: number | string): UsePublicClubReturn {
  const { getToken } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchClub = async () => {
      try {
        setLoading(true);
        setError(null);

        let foundClub: Club | null = null;
        let token: string | null = null;

        // Try to get token if user is signed in
        try {
          token = await getToken();
        } catch {
          // User is not signed in, continue without token
        }

        // Try to get club with token first (if available)
        if (token) {
          try {
            const clubs = await apiClient.getClubs(token);
            const clubData = clubs.find((c) => c.id === Number(clubId));
            if (clubData) {
              foundClub = clubData;
            }
          } catch (err) {
            // Fall through to unauthenticated access
          }
        }

        // If we didn't find the club with auth, try public access
        // by fetching notices (this works without auth)
        if (!foundClub) {
          try {
            await apiClient.getNoticesByClubId(Number(clubId));
            // If notices endpoint works, the club exists
            foundClub = { id: Number(clubId), name: `Club ${clubId}` };
          } catch (err) {
            // Club doesn't exist or API error
            if (isActive) {
              setError("Club not found");
            }
            return;
          }
        }

        if (isActive && foundClub) {
          setClub(foundClub);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load club";

        setError(errorMessage);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchClub();

    return () => {
      isActive = false;
    };
  }, [clubId, getToken]);

  return { club, loading, error };
}

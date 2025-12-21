import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";

interface Club {
  id: number;
  name: string;
}

interface UseClubReturn {
  club: Club | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a specific club by ID
 * Handles authentication, loading states, and error handling
 * Supports both authenticated and unauthenticated requests for public club pages
 *
 * @param clubId - The ID of the club to fetch
 * @returns Object containing club data, loading state, and error state
 */
export function useClub(clubId: number | string): UseClubReturn {
  const { getToken, isSignedIn } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchClub = async () => {
      try {
        setLoading(true);
        setError(null);

        let token: string | undefined = undefined;
        if (isSignedIn) {
          const authToken = await getToken();
          token = authToken || undefined;
        }

        // Try to fetch the club by ID directly (works for both authenticated and unauthenticated users)
        const foundClub = await apiClient.getClubById(Number(clubId), token);

        if (!isActive) return;

        if (foundClub) {
          setClub(foundClub);
        } else {
          setError("Club not found");
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
  }, [clubId, isSignedIn, getToken]);

  return { club, loading, error };
}

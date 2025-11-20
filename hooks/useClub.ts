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
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchClub = async () => {
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

        const clubs = await apiClient.getClubs(token);
        if (!isActive) return;

        const foundClub = clubs.find(
          (c) => c.id === Number(clubId)
        );

        if (foundClub) {
          setClub(foundClub);
        } else {
          setError("Club not found");
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load club";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access this club");
        } else {
          setError(errorMessage);
        }
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
  }, [clubId, isSignedIn]);

  return { club, loading, error };
}

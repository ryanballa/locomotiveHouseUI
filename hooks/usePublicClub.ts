import { useEffect, useState } from "react";
import { apiClient, Club } from "@/lib/api";

interface UsePublicClubReturn {
  club: Club | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a specific club by ID for public pages
 * Fetches full club details including name, description, and hero image
 * without requiring authentication
 *
 * @param clubId - The ID of the club to fetch
 * @returns Object containing club data, loading state, and error state
 */
export function usePublicClub(clubId: number | string): UsePublicClubReturn {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchClub = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch full club details publicly (without token)
        const clubData = await apiClient.getClubById(Number(clubId));

        if (!clubData) {
          throw new Error("Club not found");
        }

        if (isActive) {
          setClub(clubData);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Club not found";

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
  }, [clubId]);

  return { club, loading, error };
}

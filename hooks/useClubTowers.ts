import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, Tower } from "@/lib/api";

interface UseClubTowersReturn {
  towers: Tower[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch towers for a specific club
 *
 * @param clubId - The ID of the club
 * @returns Object containing towers array, loading state, and error state
 */
export function useClubTowers(clubId: number | string): UseClubTowersReturn {
  const { getToken, isSignedIn } = useAuth();
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchTowers = async () => {
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

        const towersData = await apiClient.getTowersByClubId(
          Number(clubId),
          token
        );
        if (isActive) {
          setTowers(towersData);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load towers";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access towers");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTowers();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn]);

  return { towers, loading, error };
}

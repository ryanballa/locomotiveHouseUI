import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, Issue, Tower } from "@/lib/api";

interface IssuesByTower {
  tower: Tower;
  issues: Issue[];
}

interface UseClubIssuesGroupedReturn {
  issuesByTower: IssuesByTower[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch issues for a club grouped by towers
 *
 * @param clubId - The ID of the club
 * @returns Object containing issues grouped by tower, loading state, and error state
 */
export function useClubIssuesGrouped(
  clubId: number | string
): UseClubIssuesGroupedReturn {
  const { getToken, isSignedIn } = useAuth();
  const [issuesByTower, setIssuesByTower] = useState<IssuesByTower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchIssuesGrouped = async () => {
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

        if (!isActive) return;

        // Fetch issues for each tower
        const grouped: IssuesByTower[] = [];
        for (const tower of towersData) {
          const issues = await apiClient.getIssuesByTowerId(
            Number(clubId),
            tower.id,
            token
          );
          grouped.push({ tower, issues });
        }

        if (isActive) {
          setIssuesByTower(grouped);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load issues";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access issues");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchIssuesGrouped();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn]);

  return { issuesByTower, loading, error };
}

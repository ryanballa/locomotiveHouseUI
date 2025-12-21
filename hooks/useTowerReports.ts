import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, TowerReport } from "@/lib/api";

export interface UseTowerReportsReturn {
  reports: TowerReport[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch tower reports for a specific tower
 * @param clubId - The club ID
 * @param towerId - The tower ID
 * @returns Object with reports, loading state, error, and refetch function
 */
export function useTowerReports(
  clubId: number | string,
  towerId: number | string
): UseTowerReportsReturn {
  const { getToken, isSignedIn } = useAuth();
  const [reports, setReports] = useState<TowerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }
      const reportsData = await apiClient.getTowerReportsByTowerId(
        Number(clubId),
        Number(towerId),
        token
      );
      setReports(reportsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch reports";
      setError(message);
      console.error("Error fetching tower reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    fetchReports();
  }, [clubId, towerId, isSignedIn]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
}

/**
 * Custom hook to fetch all tower reports for a club
 * @param clubId - The club ID
 * @returns Object with reports, loading state, error, and refetch function
 */
export function useClubTowerReports(clubId: number | string): UseTowerReportsReturn {
  const { getToken, isSignedIn } = useAuth();
  const [reports, setReports] = useState<TowerReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError("Failed to get authentication token");
        return;
      }
      const reportsData = await apiClient.getTowerReportsByClubId(
        Number(clubId),
        token
      );
      setReports(reportsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch reports";
      setError(message);
      console.error("Error fetching club tower reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    fetchReports();
  }, [clubId, isSignedIn]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
}

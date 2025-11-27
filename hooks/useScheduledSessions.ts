import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, type ScheduledSession } from "@/lib/api";

interface UseScheduledSessionsReturn {
  sessions: ScheduledSession[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch scheduled sessions for a club
 */
export function useScheduledSessions(
  clubId: number | null
): UseScheduledSessionsReturn {
  const { getToken, isSignedIn } = useAuth();
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId || !isSignedIn) {
      setSessions([]);
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!isActive || !token) {
          setSessions([]);
          return;
        }

        const sessionsData = await apiClient.getScheduledSessionsByClubId(
          clubId,
          token
        );

        if (isActive) {
          setSessions(sessionsData);
        }
      } catch (err) {
        if (isActive) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load scheduled sessions";
          console.error("Error fetching scheduled sessions:", err);
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn, getToken]);

  return { sessions, loading, error };
}

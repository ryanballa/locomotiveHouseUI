import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, type Club } from "@/lib/api";

interface UseUserClubsReturn {
  clubs: Club[];
  currentClubId: number | null;
  loading: boolean;
  error: string | null;
  selectClub: (clubId: number) => void;
}

/**
 * Custom hook to fetch and manage all clubs accessible to the current user
 * Returns list of clubs, current club ID, loading state, and error state
 * Includes selectClub function to change the active club
 */
export function useUserClubs(): UseUserClubsReturn {
  const { getToken, isSignedIn } = useAuth();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const fetchUserClubs = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSignedIn) {
          setClubs([]);
          setCurrentClubId(null);
          return;
        }

        const token = await getToken();
        if (!isActive) return;

        if (!token) {
          setClubs([]);
          setCurrentClubId(null);
          return;
        }

        // Fetch all clubs
        const allClubs = await apiClient.getClubs(token);
        if (!isActive) return;

        // Fetch current user to determine current club
        const currentUserData = await apiClient.getCurrentUser(token);
        if (!isActive) return;

        setClubs(allClubs);

        // Extract current club ID from user data
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

        setCurrentClubId(userClubId);
      } catch (err) {
        if (!isActive) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to load clubs";
        console.error("Error fetching user clubs:", err);
        setError(errorMessage);
        setClubs([]);
        setCurrentClubId(null);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchUserClubs();

    // Cleanup function: prevent state updates if component unmounts
    return () => {
      isActive = false;
    };
  }, [isSignedIn, getToken]);

  /**
   * Select a club and store in localStorage for persistence
   * TODO: Consider storing the primary club on the backend
   */
  const selectClub = (clubId: number) => {
    setCurrentClubId(clubId);
    localStorage.setItem("selectedClubId", clubId.toString());
  };

  return {
    clubs,
    currentClubId,
    loading,
    error,
    selectClub,
  };
}

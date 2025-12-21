import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, type Club } from "@/lib/api";
import { useSessionUser } from "./useSessionUser";
import { getCookie, setCookie } from "@/lib/cookieUtils";
import useLocalStorage from "@/hooks/useLocalStorage";

interface UseUserClubsReturn {
  clubs: Club[];
  currentClubId: number | null;
  loading: boolean;
  error: string | null;
  selectClub: (clubId: number) => void;
}

interface CurrentUser {
  id: number;
  name: string;
}

/**
 * Custom hook to fetch and manage all clubs accessible to the current user
 * Returns list of clubs, current club ID, loading state, and error state
 * Includes selectClub function to change the active club
 *
 * Uses session user data for user-specific info, fetches club list separately
 */
export function useUserClubs(): UseUserClubsReturn {
  const { getToken } = useAuth();
  const { user, isLoading: userLoading } = useSessionUser();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentClubId, setCurrentClubId] = useState<number | null>(null);
  const [currentClubsData, setCurrentClubsData] = useLocalStorage<Club[]>(
    "assignedClubs",
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // First useEffect: Initialize from cookie after hydration
  useEffect(() => {
    setIsHydrated(true);
    const savedClubId = getCookie("selectedClubId");
    if (savedClubId) {
      setCurrentClubId(parseInt(savedClubId, 10));
    }
  }, []);

  // Extract user's primary club ID from session data
  const userClubId = useMemo(() => {
    if (!user) return null;

    // Check if user has clubs array (new format)
    if ((user as any).clubs && Array.isArray((user as any).clubs)) {
      const firstClub = (user as any).clubs[0];
      return firstClub ? firstClub.club_id : null;
    }

    // Fall back to direct club_id field
    return user.club_id || null;
  }, [user]);

  // Fetch clubs when user is ready
  useEffect(() => {
    // Don't fetch until we've checked the cookie and user is loaded
    if (!isHydrated || userLoading) {
      return;
    }

    // Set data based on storage
    if (currentClubId && currentClubsData.find((c) => c.id === currentClubId)) {
      setClubs(currentClubsData);
      setLoading(false);
      return;
    }

    let isActive = true;

    // const getClubData = () => {
    //   const storedName = localStorage.getItem("selectedClubName");
    //   if (storedName) {
    //     setCurrentClubName(storedName);
    //   }
    // };

    const fetchUserClubs = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
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

        setClubs(allClubs);

        // Use saved club ID from cookie if available and valid, otherwise use user's default club
        const savedClubId = getCookie("selectedClubId");
        if (savedClubId) {
          const parsedSavedId = parseInt(savedClubId, 10);
          // Only use saved ID if it's in the list of accessible clubs
          if (assignedClubs.some((club) => club.id === parsedSavedId)) {
            setCurrentClubId(parsedSavedId);
          } else {
            // Saved club is not accessible, use user's primary club
            setCurrentClubId(userClubId);
          }
        } else {
          // No saved club, use user's primary club
          setCurrentClubId(userClubId);
        }
      } catch (err) {
        if (!isActive) return;
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load clubs";
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
  }, [user, getToken, isHydrated, userLoading, userClubId]);

  /**
   * Select a club and store in cookie for persistence
   * Cookie persists across pages and browser sessions
   */
  const selectClub = useCallback((clubId: number) => {
    setCurrentClubId(clubId);
    setCookie("selectedClubId", clubId.toString(), 365);
  }, []);

  return {
    clubs,
    currentClubId,
    loading,
    error,
    selectClub,
  };
}

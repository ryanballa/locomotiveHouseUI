import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, type Club } from "@/lib/api";
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
 */
export function useUserClubs(): UseUserClubsReturn {
  const { getToken, isSignedIn } = useAuth();
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

  useEffect(() => {
    // Don't fetch until we've checked the cookie
    if (!isHydrated) {
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
        // The User object has a club_id field that indicates their primary club
        let userClubId: number | null = null;
        if (currentUserData && currentUserData.clubs) {
          userClubId = currentUserData.clubs[0].id;
        }

        //Save all assigned clubs to local storage
        const assignedClubs = allClubs.filter((c) => {
          return currentUserData?.clubs?.filter((cd) => {
            return cd.id === c.id;
          });
        });
        setCurrentClubsData(assignedClubs);

        // Use saved club ID from cookie if available and valid, otherwise use user's default club
        const savedClubId = getCookie("selectedClubId");
        if (savedClubId) {
          const parsedSavedId = parseInt(savedClubId, 10);
          // Only use saved ID if it's in the list of accessible clubs
          if (allClubs.some((club) => club.id === parsedSavedId)) {
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
  }, [isSignedIn, getToken, isHydrated]);

  /**
   * Select a club and store in cookie for persistence
   * Cookie persists across pages and browser sessions
   */
  const selectClub = (clubId: number) => {
    setCurrentClubId(clubId);
    setCookie("selectedClubId", clubId.toString(), 365);
  };

  return {
    clubs,
    currentClubId,
    loading,
    error,
    selectClub,
  };
}

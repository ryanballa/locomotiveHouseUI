import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { getCachedUser, setCachedUser, clearUserCache } from "@/lib/sessionCache";

interface UseClubCheckReturn {
  clubId: number | null;
  loading: boolean;
  hasClub: boolean;
  isSuperAdmin: boolean;
  clubIds: number[]; // All accessible club IDs
  hasAccessToClub: (clubId: number) => boolean; // Check if user can access a specific club
}

/**
 * Custom hook to check if the current user has a club assignment or is a super admin.
 *
 * Fetches current user data from API and extracts club ID. Super admins (permission 3)
 * bypass club restrictions and can access all club-scoped features without explicit assignment.
 *
 * @returns {UseClubCheckReturn} Object containing:
 *   - clubId: User's assigned club ID, or null if not assigned (super admins can still access features)
 *   - loading: true while checking club assignment
 *   - hasClub: true if user has a club assignment OR is a super admin
 *   - isSuperAdmin: true if user has permission level 3 (can access everything)
 *
 * @example
 * ```typescript
 * const { clubId, hasClub, isSuperAdmin, loading } = useClubCheck();
 *
 * if (loading) return <LoadingSpinner />;
 * if (!hasClub) return <ClubRequired />;
 *
 * // Both regular users with assigned club and super admins get here
 * if (isSuperAdmin) {
 *   // Super admin can access all clubs
 *   return <SuperAdminView />;
 * } else {
 *   // Regular user accesses their assigned club
 *   return <ClubView clubId={clubId} />;
 * }
 * ```
 */
export function useClubCheck(): UseClubCheckReturn {
  const { getToken, isSignedIn } = useAuth();
  const [clubId, setClubId] = useState<number | null>(null);
  const [clubIds, setClubIds] = useState<number[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // First useEffect: Initialize from cache after hydration
  useEffect(() => {
    setIsHydrated(true);

    // Try to load from cache immediately to prevent flicker
    const cachedUser = getCachedUser();
    if (cachedUser) {
      let userClubId: number | null = null;
      let userClubIds: number[] = [];
      const userIsSuperAdmin = cachedUser.permission === 3;

      if ((cachedUser as any).clubs && Array.isArray((cachedUser as any).clubs)) {
        userClubIds = (cachedUser as any).clubs.map((c: any) => c.club_id);
        if (userClubIds.length > 0) {
          userClubId = userClubIds[0];
        }
      } else if (cachedUser.club_id) {
        userClubId = cachedUser.club_id;
        userClubIds = [cachedUser.club_id];
      }

      setClubId(userClubId);
      setClubIds(userClubIds);
      setIsSuperAdmin(userIsSuperAdmin);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const checkClub = async () => {
      try {
        setLoading(true);

        if (!isSignedIn) {
          if (!isActive) return;
          setClubId(null);
          setIsSuperAdmin(false);
          clearUserCache();
          setLoading(false);
          return;
        }

        // Check if we have cached user data
        const cachedUser = getCachedUser();
        if (cachedUser && isActive) {
          let userClubId: number | null = null;
          let userClubIds: number[] = [];
          const userIsSuperAdmin = cachedUser.permission === 3;

          // Check if user has clubs array (new format)
          if ((cachedUser as any).clubs && Array.isArray((cachedUser as any).clubs)) {
            userClubIds = (cachedUser as any).clubs.map((c: any) => c.club_id);
            if (userClubIds.length > 0) {
              userClubId = userClubIds[0];
            }
          } else if (cachedUser.club_id) {
            // Fall back to direct club_id field
            userClubId = cachedUser.club_id;
            userClubIds = [cachedUser.club_id];
          }

          setClubId(userClubId);
          setClubIds(userClubIds);
          setIsSuperAdmin(userIsSuperAdmin);
          setLoading(false);
          return;
        }

        const token = await getToken();
        if (!isActive) return;

        if (!token) {
          if (!isActive) return;
          setClubId(null);
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }

        // Fetch current user from the API
        const currentUserData = await apiClient.getCurrentUser(token);

        // Guard against state updates if component unmounted during async operation
        if (!isActive) return;

        // Extract club_id from user data
        let userClubId: number | null = null;
        let userClubIds: number[] = [];
        let userIsSuperAdmin = false;

        if (currentUserData) {
          // Check if user is a super admin (permission level 3)
          userIsSuperAdmin = currentUserData.permission === 3;

          // Cache the user data for future use
          setCachedUser(currentUserData);

          // Check if user has clubs array (new format)
          if ((currentUserData as any).clubs && Array.isArray((currentUserData as any).clubs)) {
            userClubIds = (currentUserData as any).clubs.map((c: any) => c.club_id);
            if (userClubIds.length > 0) {
              userClubId = userClubIds[0];
            }
          } else if (currentUserData.club_id) {
            // Fall back to direct club_id field
            userClubId = currentUserData.club_id;
            userClubIds = [currentUserData.club_id];
          }
        }

        setClubId(userClubId);
        setClubIds(userClubIds);
        setIsSuperAdmin(userIsSuperAdmin);
      } catch (err) {
        if (!isActive) return;
        console.error("Error checking club assignment:", err);
        setClubId(null);
        setIsSuperAdmin(false);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    checkClub();

    // Cleanup function: prevent state updates if component unmounts or dependencies change
    return () => {
      isActive = false;
    };
  }, [isSignedIn, getToken]);

  const hasAccessToClub = (requestedClubId: number): boolean => {
    // Super admins can access any club
    if (isSuperAdmin) return true;
    // Regular users can access clubs they're assigned to
    return clubIds.includes(requestedClubId);
  };

  return {
    clubId,
    loading,
    hasClub: clubId !== null || isSuperAdmin,
    isSuperAdmin,
    clubIds,
    hasAccessToClub,
  };
}

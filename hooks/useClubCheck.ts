import { useCallback, useMemo } from "react";
import { useSessionUser } from "./useSessionUser";

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
 * Uses centralized session user data fetched once from the API.
 * Super admins (permission 3) bypass club restrictions and can access all club-scoped features.
 *
 * @returns {UseClubCheckReturn} Object containing:
 *   - clubId: User's assigned club ID, or null if not assigned (super admins can still access features)
 *   - loading: true while checking club assignment
 *   - hasClub: true if user has a club assignment OR is a super admin
 *   - isSuperAdmin: true if user has permission level 3 (can access everything)
 *   - clubIds: All club IDs the user has access to
 *   - hasAccessToClub: Function to check if user can access a specific club
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
  const { user, isLoading } = useSessionUser();

  // Memoize club data extraction
  const { clubId, clubIds, isSuperAdmin } = useMemo(() => {
    if (!user) {
      return {
        clubId: null,
        clubIds: [],
        isSuperAdmin: false,
      };
    }

    const userIsSuperAdmin = user.permission === 3;
    let userClubId: number | null = null;
    let userClubIds: number[] = [];

    // Extract club IDs from clubs array if available
    if ((user as any).clubs && Array.isArray((user as any).clubs)) {
      userClubIds = (user as any).clubs.map((c: any) => c.club_id);
      if (userClubIds.length > 0) {
        userClubId = userClubIds[0];
      }
    } else if (user.club_id) {
      // Fall back to direct club_id field
      userClubId = user.club_id;
      userClubIds = [user.club_id];
    }

    return {
      clubId: userClubId,
      clubIds: userClubIds,
      isSuperAdmin: userIsSuperAdmin,
    };
  }, [user]);

  const hasAccessToClub = useCallback((requestedClubId: number): boolean => {
    // Super admins can access any club
    if (isSuperAdmin) return true;
    // Regular users can access clubs they're assigned to
    return clubIds.includes(requestedClubId);
  }, [isSuperAdmin, clubIds]);

  return {
    clubId,
    loading: isLoading,
    hasClub: clubId !== null || isSuperAdmin,
    isSuperAdmin,
    clubIds,
    hasAccessToClub,
  };
}

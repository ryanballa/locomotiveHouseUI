import { describe, it, expect } from "vitest";

/**
 * Test suite for user filtering logic in club assignment
 * Verifies that the correct users are available for assignment to each club
 */

function filterUsersForClub(allUsers: any[], clubId: number) {
  // Extract club_id from clubs array for each user
  const usersWithClubId = allUsers.map((user) => {
    const clubIds =
      user.clubs && Array.isArray(user.clubs)
        ? user.clubs.map((c: any) => c.club_id)
        : [];
    return {
      ...user,
      clubIds,
      club_id: clubIds.length > 0 ? clubIds[0] : user.club_id,
    };
  });

  // Filter users by club_id - check if the club is in their clubs array
  const clubUsers = usersWithClubId.filter((user) => {
    const userClubIds = user.clubIds || [];
    return userClubIds.includes(clubId) || user.club_id === clubId;
  });

  // Fixed logic - show users not assigned to THIS specific club
  const usersWithoutClub = usersWithClubId.filter((user) => {
    const userClubIds = user.clubIds || [];
    return !userClubIds.includes(clubId);
  });

  return { clubUsers, usersWithoutClub };
}

describe("Club User Filtering - Fixed Logic", () => {
  it("should show users with no clubs assigned", () => {
    const users = [{ id: 1, token: "token1", clubs: undefined, club_id: null }];
    const clubId = 1;

    const { usersWithoutClub } = filterUsersForClub(users, clubId);

    expect(usersWithoutClub).toHaveLength(1);
    expect(usersWithoutClub[0].id).toBe(1);
  });

  it("should show users assigned to other clubs (multi-club support)", () => {
    const users = [
      {
        id: 2,
        token: "token2",
        clubs: [{ club_id: 2 }, { club_id: 3 }],
        club_id: 2,
      },
    ];
    const clubId = 1; // Viewing club 1

    const { usersWithoutClub } = filterUsersForClub(users, clubId);

    expect(usersWithoutClub).toHaveLength(1);
    expect(usersWithoutClub[0].id).toBe(2);
  });

  it("should hide users already assigned to this specific club", () => {
    const users = [
      {
        id: 3,
        token: "token3",
        clubs: [{ club_id: 1 }],
        club_id: 1,
      },
    ];
    const clubId = 1;

    const { usersWithoutClub } = filterUsersForClub(users, clubId);

    expect(usersWithoutClub).toHaveLength(0);
  });

  it("should show users when viewing a different club", () => {
    const users = [
      {
        id: 4,
        token: "token4",
        clubs: [{ club_id: 1 }, { club_id: 2 }],
        club_id: 1,
      },
    ];
    const clubId = 3; // Viewing club 3

    const { usersWithoutClub } = filterUsersForClub(users, clubId);

    expect(usersWithoutClub).toHaveLength(1);
    expect(usersWithoutClub[0].id).toBe(4);
  });

  it("should handle complex multi-club scenario", () => {
    const users = [
      { id: 1, token: "token1", clubs: undefined, club_id: null }, // No clubs
      { id: 2, token: "token2", clubs: [{ club_id: 1 }], club_id: 1 }, // In club 1 only
      {
        id: 3,
        token: "token3",
        clubs: [{ club_id: 2 }, { club_id: 3 }],
        club_id: 2,
      }, // In clubs 2 and 3
      { id: 4, token: "token4", clubs: [{ club_id: 5 }], club_id: 5 }, // In club 5
    ];
    const clubId = 1; // Viewing club 1

    const { clubUsers, usersWithoutClub } = filterUsersForClub(users, clubId);

    // Assigned to club 1
    expect(clubUsers).toHaveLength(1);
    expect(clubUsers[0].id).toBe(2);

    // Available for assignment (not in club 1)
    expect(usersWithoutClub).toHaveLength(3);
    expect(usersWithoutClub.map((u) => u.id).sort()).toEqual([1, 3, 4]);
  });

  it("should show users with single club_id when viewing different club", () => {
    const users = [
      {
        id: 5,
        token: "token5",
        clubs: undefined,
        club_id: 2, // Has primary club assigned
      },
    ];
    const clubId = 1; // Viewing club 1

    const { usersWithoutClub } = filterUsersForClub(users, clubId);

    // User should be available because they're not in club 1
    expect(usersWithoutClub).toHaveLength(1);
    expect(usersWithoutClub[0].id).toBe(5);
  });
});

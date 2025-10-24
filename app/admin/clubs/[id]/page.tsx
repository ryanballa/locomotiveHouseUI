"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Club, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface EnrichedUser extends User {
  clerkName?: string;
  clerkEmail?: string;
}

function ClubDetailPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [unassigningUserId, setUnassigningUserId] = useState<number | null>(
    null
  );

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    fetchClubDetails();
  }, [clubId, getToken]);

  const handleAssignUser = async (userId: number) => {
    try {
      setAssigningUserId(userId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Find the user to get their permission level
      const userToAssign = unassignedUsers.find((u) => u.id === userId);
      const updateData: any = { club_id: clubId };

      // Include permission if the user has it
      if (userToAssign?.permission !== undefined) {
        updateData.permission = userToAssign.permission;
      }

      const result = await apiClient.updateUser(
        userId,
        updateData,
        token
      );

      if (result.updated) {
        // Refetch to ensure data is in sync
        await fetchClubDetails();
      } else {
        setError("Failed to assign user to club - API returned false");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to assign user";
      console.error("Error assigning user:", err);
      setError(errorMsg);
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleUnassignUser = async (userId: number) => {
    try {
      setUnassigningUserId(userId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Use the new DELETE endpoint to remove user from club
      const result = await apiClient.removeUserFromClub(
        userId,
        clubId,
        token
      );
      if (result.removed) {
        // Refetch to ensure data is in sync
        await fetchClubDetails();
      } else {
        setError("Failed to remove user from club");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign user");
    } finally {
      setUnassigningUserId(null);
    }
  };

  const enrichUsersWithClerkData = async (
    users: User[]
  ): Promise<EnrichedUser[]> => {
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          // Fetch Clerk user data from our API route
          const response = await fetch(`/api/clerk-user/${encodeURIComponent(user.token)}`);

          if (response.ok) {
            const data = await response.json();
            return { ...user, clerkName: data.name, clerkEmail: data.email };
          }
        } catch (error) {
          console.error(
            `Failed to fetch Clerk data for user ${user.id}:`,
            error
          );
        }

        return { ...user, clerkName: user.token };
      })
    );

    return enrichedUsers;
  };

  const enrichPermissions = ({ permission }: { permission: number }) => {
    switch (permission) {
      case 1:
        return "Admin";
      case 3:
        return "Super Admin";
      default:
        return "Regular";
    }
  };

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Fetch club details and all users in parallel
      const [clubData, allUsers] = await Promise.all([
        apiClient.getClubById(clubId, token),
        apiClient.getUsers(token),
      ]);

      setClub(clubData);

      // Extract club_id from clubs array for each user
      const usersWithClubId = allUsers.map((user) => {
        const clubIds = (user as any).clubs && Array.isArray((user as any).clubs)
          ? (user as any).clubs.map((c: any) => c.club_id)
          : [];
        return {
          ...user,
          clubIds,
          club_id: clubIds.length > 0 ? clubIds[0] : user.club_id, // Use first club for primary display
        };
      });

      // Filter users by club_id - check if the club is in their clubs array
      const clubUsers = usersWithClubId.filter((user) => {
        const userClubIds = (user as any).clubIds || [];
        return userClubIds.includes(clubId) || user.club_id === clubId;
      });
      const usersWithoutClub = usersWithClubId.filter(
        (user) => {
          const userClubIds = (user as any).clubIds || [];
          return userClubIds.length === 0 || (!userClubIds.includes(clubId) && !user.club_id);
        }
      );

      // Enrich users with Clerk data
      const [enrichedClubUsers, enrichedUnassignedUsers] = await Promise.all([
        enrichUsersWithClerkData(clubUsers),
        enrichUsersWithClerkData(usersWithoutClub),
      ]);

      setUsers(enrichedClubUsers);
      setUnassignedUsers(enrichedUnassignedUsers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load club details";
      console.error("Error fetching club details:", err);
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to view club details.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push("/admin/clubs")}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Clubs
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Club not found"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/clubs")}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Clubs
        </button>

        {/* Club Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{club.name}</h1>
          <p className="text-gray-600">Club ID: {club.id}</p>
        </div>

        {/* Assigned Users Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Assigned Users ({users.length})
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No users assigned to this club yet.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.clerkName || user.name || user.token}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.clerkEmail || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.permission !== null && user.permission !== undefined
                        ? user.permission
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleUnassignUser(user.id)}
                        disabled={unassigningUserId === user.id}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {unassigningUserId === user.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Unassigned Users Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Users ({unassignedUsers.length})
            </h2>
          </div>

          {unassignedUsers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No unassigned users available.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unassignedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.clerkName || user.name || user.token}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.clerkEmail || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.permission !== null && user.permission !== undefined
                        ? enrichPermissions({ permission: user.permission })
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignUser(user.id)}
                        disabled={assigningUserId === user.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningUserId === user.id
                          ? "Assigning..."
                          : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <AdminGuard>
      <ClubDetailPageContent />
    </AdminGuard>
  );
}

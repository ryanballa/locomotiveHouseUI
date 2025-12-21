"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";

interface EnrichedUser extends User {
  clerkName?: string;
  clerkEmail?: string;
}

function ClubUsersPageContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [unassigningUserId, setUnassigningUserId] = useState<number | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<Record<number, number>>({});

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    if (isAdmin) {
      fetchUsers();
    }
  }, [clubId, isAdmin]);

  const handleAssignUser = async (userId: number) => {
    try {
      setAssigningUserId(userId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        setAssigningUserId(null);
        return;
      }

      // Use selected permission if available, otherwise use user's existing permission
      const selectedPermission = selectedPermissions[userId];
      let permission: number;

      if (selectedPermission !== undefined) {
        permission = selectedPermission;
      } else {
        // Fallback to user's existing permission level
        const userToAssign = unassignedUsers.find((u) => u.id === userId);
        if (userToAssign?.permission !== undefined && userToAssign.permission !== null) {
          permission = userToAssign.permission;
        } else {
          // Default to Regular permission if none is selected
          permission = 2;
        }
      }

      console.log("Assigning user to club with data:", { userId, clubId, permission });

      const result = await apiClient.assignUserToClub(userId, clubId, permission, token);

      console.log("Assignment result:", result);

      if (result.updated) {
        // Clear the selected permission for this user
        setSelectedPermissions((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
        // Refetch to ensure data is in sync
        await fetchUsers();
      } else {
        const errorMessage = `Failed to assign user to club. API response: ${JSON.stringify(result)}`;
        console.error(errorMessage);
        setError(errorMessage);
        setAssigningUserId(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to assign user";
      console.error("Error assigning user:", err);
      console.error("Full error object:", JSON.stringify(err, null, 2));
      setError(`Error: ${errorMsg}`);
      setAssigningUserId(null);
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
      const result = await apiClient.removeUserFromClub(userId, clubId, token);
      if (result.removed) {
        // Refetch to ensure data is in sync
        await fetchUsers();
      } else {
        setError("Failed to remove user from club");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unassign user");
    } finally {
      setUnassigningUserId(null);
    }
  };

  const enrichUsersWithClerkData = async (users: User[]): Promise<EnrichedUser[]> => {
    // Use first_name, last_name, and email from backend instead of making Clerk API calls
    const enrichedUsers = users.map((user) => {
      // Build display name from first_name and last_name if available
      const clerkName =
        user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.name || user.token;

      return {
        ...user,
        clerkName,
        clerkEmail: user.email,
      };
    });

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = await getToken();
      if (!authToken) {
        setError("Authentication required");
        return;
      }

      console.log("Fetching users for club:", clubId);

      // Fetch club users
      const allUsers = await apiClient.getClubUsers(clubId, authToken);
      console.log("Raw club users response:", allUsers);

      // Extract user objects from the API response
      const clubUsers: User[] = [];
      for (const item of allUsers) {
        const userItem = (item as any).user;
        if (userItem) {
          clubUsers.push(userItem);
        }
      }

      console.log("Extracted club users:", clubUsers.length, clubUsers.map(u => ({ id: u.id, name: u.name })));

      // Enrich users with Clerk data
      const enrichedClubUsers = await enrichUsersWithClerkData(clubUsers);
      setUsers(enrichedClubUsers);
      console.log("Set assigned users:", enrichedClubUsers.length);

      // For unassigned users, we need to get all users and filter out the ones already assigned
      try {
        const allUsersInSystem = await apiClient.getUsers(authToken);
        console.log("All users in system:", allUsersInSystem.length);

        const clubUserIds = new Set(clubUsers.map((u) => u.id));
        console.log("Club user IDs:", Array.from(clubUserIds));

        const unassignedUsersList = allUsersInSystem.filter((u) => !clubUserIds.has(u.id));
        console.log("Unassigned users:", unassignedUsersList.length, unassignedUsersList.map(u => ({ id: u.id, name: u.name })));

        const enrichedUnassignedUsers = await enrichUsersWithClerkData(unassignedUsersList);
        setUnassignedUsers(enrichedUnassignedUsers);
        console.log("Set unassigned users:", enrichedUnassignedUsers.length);
      } catch (err) {
        console.error("Failed to fetch unassigned users:", err);
        setUnassignedUsers([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load users";
      console.error("Error fetching users:", err);
      console.error("Full error:", JSON.stringify(err, null, 2));
      setError(errorMessage);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/admin/clubs/${clubId}`)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Club Details
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Users</h1>
          <p className="text-gray-600">
            Assign and manage user access for this club
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

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
                        {unassigningUserId === user.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Available Users Section */}
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
                      <select
                        value={selectedPermissions[user.id] ?? (user.permission ?? "")}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            setSelectedPermissions((prev) => {
                              const updated = { ...prev };
                              delete updated[user.id];
                              return updated;
                            });
                          } else {
                            setSelectedPermissions((prev) => ({
                              ...prev,
                              [user.id]: Number(value),
                            }));
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        {user.permission !== null && user.permission !== undefined ? (
                          <option value={user.permission}>
                            {enrichPermissions({ permission: user.permission })}
                          </option>
                        ) : (
                          <option value="">Select a permission...</option>
                        )}
                        <option value="1">Admin</option>
                        <option value="2">Regular</option>
                        <option value="3">Super Admin</option>
                        <option value="4">Limited</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleAssignUser(user.id)}
                        disabled={assigningUserId === user.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {assigningUserId === user.id ? "Assigning..." : "Assign"}
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

export default function ClubUsersPage() {
  return (
    <AdminGuard>
      <ClubUsersPageContent />
    </AdminGuard>
  );
}

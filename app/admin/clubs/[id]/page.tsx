"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Club, type User, type Tower, type Issue, type IssueStatus, type ScheduledSession, type Notice } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { IssueTable } from "@/components/IssueTable";
import { TowerReportsSection } from "@/components/TowerReportsSection";
import { NoticesSection } from "@/components/NoticesSection";

interface EnrichedUser extends User {
  clerkName?: string;
  clerkEmail?: string;
}

function ClubDetailPageContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [unassignedUsers, setUnassignedUsers] = useState<EnrichedUser[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null);
  const [unassigningUserId, setUnassigningUserId] = useState<number | null>(
    null
  );
  const [selectedPermissions, setSelectedPermissions] = useState<
    Record<number, number>
  >({});
  const [towers, setTowers] = useState<Tower[]>([]);
  const [towerFormData, setTowerFormData] = useState({
    name: "",
    description: "",
  });
  const [editingTowerId, setEditingTowerId] = useState<number | null>(null);
  const [creatingTower, setCreatingTower] = useState(false);
  const [deletingTowerId, setDeletingTowerId] = useState<number | null>(null);
  const [towerIssues, setTowerIssues] = useState<Record<number, Issue[]>>({});
  const [selectedTowerForIssues, setSelectedTowerForIssues] = useState<number | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    title: "",
    type: "",
    description: "",
    status: "Open" as IssueStatus,
    user_id: 0,
  });
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [sessionFormData, setSessionFormData] = useState({
    schedule: "",
    description: "",
  });
  const [creatingSession, setCreatingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [token, setToken] = useState<string>("");

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    fetchClubDetails();
  }, [clubId]);

  const handleAssignUser = async (userId: number) => {
    try {
      setAssigningUserId(userId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const updateData: any = { club_id: clubId };

      // Use selected permission if available, otherwise use user's existing permission
      const selectedPermission = selectedPermissions[userId];
      if (selectedPermission !== undefined) {
        updateData.permission = selectedPermission;
      } else {
        // Fallback to user's existing permission level
        const userToAssign = unassignedUsers.find((u) => u.id === userId);
        if (userToAssign?.permission !== undefined) {
          updateData.permission = userToAssign.permission;
        }
      }

      const result = await apiClient.updateUser(
        userId,
        updateData,
        token
      );

      if (result.updated) {
        // Clear the selected permission for this user
        setSelectedPermissions((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
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

  /**
   * Enrich users with name and email from backend data (no longer fetching from Clerk)
   * firstName, lastName, and email are now stored in the database after profile completion
   */
  const enrichUsersWithClerkData = async (
    users: User[]
  ): Promise<EnrichedUser[]> => {
    // Use firstName, lastName, and email from backend instead of making Clerk API calls
    const enrichedUsers = users.map((user) => {
      // Build display name from firstName and lastName if available
      const clerkName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
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

  /**
   * Creates a new tower for the club
   */
  const handleCreateTower = async () => {
    try {
      if (!towerFormData.name.trim()) {
        setError("Tower name is required");
        return;
      }

      setCreatingTower(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createTower(
        clubId,
        towerFormData,
        token
      );

      if (result.created) {
        setTowerFormData({ name: "", description: "" });
        await fetchClubDetails();
      } else {
        setError("Failed to create tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create tower";
      console.error("Error creating tower:", err);
      setError(errorMsg);
    } finally {
      setCreatingTower(false);
    }
  };

  /**
   * Updates an existing tower
   * @param towerId The ID of the tower to update
   */
  const handleUpdateTower = async (towerId: number) => {
    try {
      if (!towerFormData.name.trim()) {
        setError("Tower name is required");
        return;
      }

      setEditingTowerId(towerId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateTower(
        clubId,
        towerId,
        towerFormData,
        token
      );

      if (result.updated) {
        setTowerFormData({ name: "", description: "" });
        setEditingTowerId(null);
        await fetchClubDetails();
      } else {
        setError("Failed to update tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update tower";
      console.error("Error updating tower:", err);
      setError(errorMsg);
    } finally {
      setEditingTowerId(null);
    }
  };

  /**
   * Deletes a tower from the club
   * @param towerId The ID of the tower to delete
   */
  const handleDeleteTower = async (towerId: number) => {
    if (!confirm("Are you sure you want to delete this tower?")) {
      return;
    }

    try {
      setDeletingTowerId(towerId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteTower(clubId, towerId, token);

      if (result.deleted) {
        await fetchClubDetails();
      } else {
        setError("Failed to delete tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete tower";
      console.error("Error deleting tower:", err);
      setError(errorMsg);
    } finally {
      setDeletingTowerId(null);
    }
  };

  /**
   * Starts editing a tower by populating the form with its data
   * @param tower The tower to edit
   */
  const startEditingTower = (tower: Tower) => {
    setTowerFormData({ name: tower.name, description: tower.description || "" });
    setEditingTowerId(tower.id);
  };

  /**
   * Fetches all issues for a specific tower
   * @param towerId The tower ID to fetch issues for
   */
  const fetchTowerIssues = async (towerId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const issues = await apiClient.getIssuesByTowerId(clubId, towerId, token);
      setTowerIssues((prev) => ({
        ...prev,
        [towerId]: issues,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch tower issues";
      console.error("Error fetching tower issues:", err);
      setError(errorMsg);
    }
  };

  /**
   * Opens the issue creation form for a specific tower
   * @param towerId The tower ID to create an issue for
   */
  const openIssueForm = (towerId: number) => {
    setSelectedTowerForIssues(towerId);
    setShowIssueForm(true);
    setEditingIssueId(null);
    setIssueFormData({
      title: "",
      type: "",
      description: "",
      status: "Open",
      user_id: currentUser?.id || 0,
    });
  };

  /**
   * Creates a new issue for the selected tower
   */
  const handleCreateIssue = async () => {
    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      if (!issueFormData.title.trim() || !issueFormData.type.trim()) {
        setError("Title and type are required");
        return;
      }

      setCreatingIssue(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createIssue(
        clubId,
        selectedTowerForIssues,
        issueFormData,
        token
      );

      if (result.created) {
        await fetchTowerIssues(selectedTowerForIssues);
        setShowIssueForm(false);
        setIssueFormData({
          title: "",
          type: "",
          description: "",
          status: "Open",
          user_id: currentUser?.id || 0,
        });
      } else {
        setError("Failed to create issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create issue";
      console.error("Error creating issue:", err);
      setError(errorMsg);
    } finally {
      setCreatingIssue(false);
    }
  };

  /**
   * Updates an existing issue
   * @param issueId The issue ID to update
   */
  const handleUpdateIssue = async (issueId: number) => {
    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      if (!issueFormData.title.trim() || !issueFormData.type.trim()) {
        setError("Title and type are required");
        return;
      }

      setEditingIssueId(issueId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateIssue(
        clubId,
        selectedTowerForIssues,
        issueId,
        issueFormData,
        token
      );

      if (result.updated) {
        await fetchTowerIssues(selectedTowerForIssues);
        setShowIssueForm(false);
        setIssueFormData({
          title: "",
          type: "",
          description: "",
          status: "Open",
          user_id: currentUser?.id || 0,
        });
      } else {
        setError("Failed to update issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update issue";
      console.error("Error updating issue:", err);
      setError(errorMsg);
    } finally {
      setEditingIssueId(null);
    }
  };

  /**
   * Deletes an issue from a tower
   * @param issueId The issue ID to delete
   */
  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }

    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      setDeletingIssueId(issueId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteIssue(
        clubId,
        selectedTowerForIssues,
        issueId,
        token
      );

      if (result.deleted) {
        await fetchTowerIssues(selectedTowerForIssues);
      } else {
        setError("Failed to delete issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete issue";
      console.error("Error deleting issue:", err);
      setError(errorMsg);
    } finally {
      setDeletingIssueId(null);
    }
  };

  /**
   * Starts editing an issue by populating the form with its data
   * @param issue The issue to edit
   */
  const startEditingIssue = (issue: Issue) => {
    setEditingIssueId(issue.id);
    setIssueFormData({
      title: issue.title,
      type: issue.type,
      description: issue.description || "",
      status: issue.status,
      user_id: issue.user_id,
    });
  };

  /**
   * Creates a new scheduled session for the club
   */
  const handleCreateScheduledSession = async () => {
    try {
      if (!sessionFormData.schedule.trim()) {
        setError("Session date/time is required");
        return;
      }

      setCreatingSession(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createScheduledSession(
        clubId,
        {
          schedule: new Date(sessionFormData.schedule),
          club_id: clubId,
          description: sessionFormData.description,
        },
        token
      );

      if (result.created) {
        setSessionFormData({ schedule: "", description: "" });
        await fetchClubDetails();
      } else {
        setError("Failed to create scheduled session");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create scheduled session";
      console.error("Error creating scheduled session:", err);
      setError(errorMsg);
    } finally {
      setCreatingSession(false);
    }
  };

  /**
   * Deletes a scheduled session from the club
   */
  const handleDeleteScheduledSession = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this scheduled session?")) {
      return;
    }

    try {
      setDeletingSessionId(sessionId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteScheduledSession(clubId, sessionId, token);

      if (result.deleted) {
        await fetchClubDetails();
      } else {
        setError("Failed to delete scheduled session");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete scheduled session";
      console.error("Error deleting scheduled session:", err);
      setError(errorMsg);
    } finally {
      setDeletingSessionId(null);
    }
  };

  /**
   * Updates an existing scheduled session
   * @param sessionId The session ID to update
   */
  const handleUpdateScheduledSession = async (sessionId: number) => {
    try {
      if (!sessionFormData.schedule.trim()) {
        setError("Session date/time is required");
        return;
      }

      setEditingSessionId(sessionId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateScheduledSession(
        clubId,
        sessionId,
        {
          schedule: new Date(sessionFormData.schedule),
          description: sessionFormData.description,
        },
        token
      );

      if (result.updated) {
        setSessionFormData({ schedule: "", description: "" });
        setEditingSessionId(null);
        await fetchClubDetails();
      } else {
        setError("Failed to update scheduled session");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update scheduled session";
      console.error("Error updating scheduled session:", err);
      setError(errorMsg);
    } finally {
      setEditingSessionId(null);
    }
  };

  /**
   * Starts editing a scheduled session by populating the form with its data
   * @param session The session to edit
   */
  const startEditingScheduledSession = (session: ScheduledSession) => {
    // Format the date for datetime-local input (YYYY-MM-DDTHH:mm)
    const date = new Date(session.schedule);
    const formattedDate = date.toISOString().slice(0, 16);
    setSessionFormData({
      schedule: formattedDate,
      description: session.description || "",
    });
    setEditingSessionId(session.id);
  };

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = await getToken();
      if (!authToken) {
        setError("Authentication required");
        return;
      }
      setToken(authToken);

      // Fetch club details, users, towers, scheduled sessions, and notices in parallel
      const [clubData, allUsers, towersData, sessionsData, noticesData] = await Promise.all([
        apiClient.getClubById(clubId, authToken),
        apiClient.getClubUsers(clubId, authToken),
        apiClient.getTowersByClubId(clubId, authToken),
        apiClient.getScheduledSessionsByClubId(clubId, authToken),
        apiClient.getNoticesByClubId(clubId, authToken),
      ]);

      setClub(clubData);
      setTowers(towersData);
      setScheduledSessions(sessionsData);
      setNotices(noticesData);

      // Extract user objects from the API response
      // The response is an array of objects with structure: { user: {...}, clubs: {...} }
      const clubUsers: User[] = [];
      for (const item of allUsers) {
        const userItem = (item as any).user;
        if (userItem) {
          clubUsers.push(userItem);
        }
      }

      // Enrich users with Clerk data
      const enrichedClubUsers = await enrichUsersWithClerkData(clubUsers);
      setUsers(enrichedClubUsers);

      // For unassigned users, we need to get all users and filter out the ones already assigned
      try {
        const allUsersInSystem = await apiClient.getUsers(authToken);
        const clubUserIds = new Set(clubUsers.map((u) => u.id));
        const unassignedUsers = allUsersInSystem.filter((u) => !clubUserIds.has(u.id));
        const enrichedUnassignedUsers = await enrichUsersWithClerkData(unassignedUsers);
        setUnassignedUsers(enrichedUnassignedUsers);
      } catch (err) {
        console.error("Failed to fetch unassigned users:", err);
        // If we can't get unassigned users, that's ok - admins can still manage assigned users
        setUnassignedUsers([]);
      }

      // Find current user by matching Clerk ID
      if (clerkUser?.id) {
        const matchedUser = clubUsers.find((u) => u.token === clerkUser.id);
        if (matchedUser) {
          setCurrentUser(matchedUser);
          // Update issue form with current user ID
          setIssueFormData((prev) => ({
            ...prev,
            user_id: matchedUser.id,
          }));
        }
      }
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
          <p className="text-gray-600 mb-4">Club ID: {club.id}</p>
          <button
            onClick={() => router.push(`/admin/clubs/${club.id}/invites`)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 inline-flex items-center gap-2"
          >
            <span>🔗</span> Manage Invites
          </button>
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

        {/* Towers Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Towers ({towers.length})
            </h2>
          </div>

          {/* Create/Edit Tower Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tower Name
                </label>
                <input
                  type="text"
                  value={towerFormData.name}
                  onChange={(e) =>
                    setTowerFormData({ ...towerFormData, name: e.target.value })
                  }
                  placeholder="Enter tower name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={towerFormData.description}
                  onChange={(e) =>
                    setTowerFormData({
                      ...towerFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter tower description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {editingTowerId ? (
                  <>
                    <button
                      onClick={() => handleUpdateTower(editingTowerId)}
                      disabled={editingTowerId === null || creatingTower}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Tower
                    </button>
                    <button
                      onClick={() => {
                        setTowerFormData({ name: "", description: "" });
                        setEditingTowerId(null);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateTower}
                    disabled={creatingTower}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingTower ? "Creating..." : "Create Tower"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Towers List */}
          {towers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No towers created yet.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tower ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {towers.map((tower) => (
                  <tr key={tower.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tower.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {tower.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tower.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTowerForIssues(tower.id);
                          if (!towerIssues[tower.id]) {
                            fetchTowerIssues(tower.id);
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        Issues ({towerIssues[tower.id]?.length || 0})
                      </button>
                      <button
                        onClick={() => startEditingTower(tower)}
                        disabled={editingTowerId !== null}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTower(tower.id)}
                        disabled={deletingTowerId === tower.id}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingTowerId === tower.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Issues Modal/Dropdown for Selected Tower */}
        {selectedTowerForIssues && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Tower Issues - {towers.find((t) => t.id === selectedTowerForIssues)?.name} ({towerIssues[selectedTowerForIssues]?.length || 0})
              </h2>
              <button
                onClick={() => setSelectedTowerForIssues(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Issue Creation/Edit Form */}
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={issueFormData.title}
                      onChange={(e) =>
                        setIssueFormData({ ...issueFormData, title: e.target.value })
                      }
                      placeholder="Enter issue title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={issueFormData.type}
                      onChange={(e) =>
                        setIssueFormData({ ...issueFormData, type: e.target.value })
                      }
                      placeholder="e.g., Maintenance, Bug, Feature"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={issueFormData.description}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter issue description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={issueFormData.status}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
                        status: e.target.value as IssueStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {editingIssueId ? (
                    <>
                      <button
                        onClick={() => handleUpdateIssue(editingIssueId)}
                        disabled={creatingIssue}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update Issue
                      </button>
                      <button
                        onClick={() => {
                          setEditingIssueId(null);
                          setIssueFormData({
                            title: "",
                            type: "",
                            description: "",
                            status: "Open",
                            user_id: currentUser?.id || 0,
                          });
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateIssue}
                      disabled={creatingIssue}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingIssue ? "Creating..." : "Create Issue"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Issues List */}
            <IssueTable
              issues={towerIssues[selectedTowerForIssues] || []}
              onEdit={startEditingIssue}
              onDelete={handleDeleteIssue}
              deletingIssueId={deletingIssueId}
              editingIssueId={editingIssueId}
              towerName={towers.find((t) => t.id === selectedTowerForIssues)?.name}
            />
          </div>
        )}

        {/* Scheduled Sessions Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Scheduled Sessions ({scheduledSessions.length})
            </h2>
          </div>

          {/* Create/Edit Scheduled Session Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={sessionFormData.schedule}
                  onChange={(e) =>
                    setSessionFormData({ ...sessionFormData, schedule: e.target.value })
                  }
                  placeholder="Select date and time"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={sessionFormData.description}
                  onChange={(e) =>
                    setSessionFormData({ ...sessionFormData, description: e.target.value })
                  }
                  placeholder="Add a description for this session"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {editingSessionId ? (
                  <>
                    <button
                      onClick={() => handleUpdateScheduledSession(editingSessionId)}
                      disabled={creatingSession}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Session
                    </button>
                    <button
                      onClick={() => {
                        setSessionFormData({ schedule: "", description: "" });
                        setEditingSessionId(null);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateScheduledSession}
                    disabled={creatingSession}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingSession ? "Creating..." : "Create Scheduled Session"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scheduled Sessions List */}
          {scheduledSessions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No scheduled sessions created yet.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scheduledSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.schedule).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                      {session.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => startEditingScheduledSession(session)}
                        disabled={editingSessionId !== null}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteScheduledSession(session.id)}
                        disabled={deletingSessionId === session.id}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingSessionId === session.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Tower Reports Section */}
        <div className="mt-8">
          <TowerReportsSection clubId={clubId} towers={towers} />
        </div>

        {/* Notices Section */}
        {token && (
          <div className="mt-8">
            <NoticesSection
              clubId={clubId}
              notices={notices}
              token={token}
              onNoticesUpdate={setNotices}
            />
          </div>
        )}
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

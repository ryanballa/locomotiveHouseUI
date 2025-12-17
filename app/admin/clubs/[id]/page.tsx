"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Club, type User, type ScheduledSession, type Notice } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { TowerReportsSection } from "@/components/TowerReportsSection";
import { NoticesSection } from "@/components/NoticesSection";

function ClubDetailPageContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

      // Fetch club details, scheduled sessions, and notices in parallel
      const [clubData, sessionsData, noticesData] = await Promise.all([
        apiClient.getClubById(clubId, authToken),
        apiClient.getScheduledSessionsByClubId(clubId, authToken),
        apiClient.getNoticesByClubId(clubId, authToken),
      ]);

      setClub(clubData);
      setScheduledSessions(sessionsData);
      setNotices(noticesData);

      // Find current user by matching Clerk ID
      if (clerkUser?.id) {
        try {
          const clubUsers = await apiClient.getClubUsers(clubId, authToken);
          const clubUsersList: User[] = [];
          for (const item of clubUsers) {
            const userItem = (item as any).user;
            if (userItem) {
              clubUsersList.push(userItem);
            }
          }
          const matchedUser = clubUsersList.find((u) => u.token === clerkUser.id);
          if (matchedUser) {
            setCurrentUser(matchedUser);
          }
        } catch (err) {
          console.error("Failed to fetch current user:", err);
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
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/users`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center gap-2"
            >
              <span>👥</span> Manage Users
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/towers`)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-500 inline-flex items-center gap-2"
            >
              <span>🏗️</span> Manage Towers
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/invites`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 inline-flex items-center gap-2"
            >
              <span>🔗</span> Manage Invites
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/applications`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"
            >
              <span>📝</span> View Applications
            </button>
          </div>
        </div>

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
          <TowerReportsSection clubId={clubId} />
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

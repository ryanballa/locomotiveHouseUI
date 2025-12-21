"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Club, type ScheduledSession } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";

function SessionsPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
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

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    fetchData();
  }, [clubId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const [clubData, sessionsData] = await Promise.all([
        apiClient.getClubById(clubId, token),
        apiClient.getScheduledSessionsByClubId(clubId, token),
      ]);

      setClub(clubData);

      // Filter sessions to only show upcoming ones (not older than 1 day)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const upcomingSessions = sessionsData.filter(
        (session) => new Date(session.schedule) > oneDayAgo
      );
      setScheduledSessions(upcomingSessions);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      console.error("Error fetching data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
        await fetchData();
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
        await fetchData();
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
        await fetchData();
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

  const startEditingScheduledSession = (session: ScheduledSession) => {
    const date = new Date(session.schedule);
    const formattedDate = date.toISOString().slice(0, 16);
    setSessionFormData({
      schedule: formattedDate,
      description: session.description || "",
    });
    setEditingSessionId(session.id);
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
            onClick={() => router.push(`/admin/clubs/${clubId}`)}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Club Details
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
        <button
          onClick={() => router.push(`/admin/clubs/${clubId}`)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Club Details
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Scheduled Sessions</h1>
          <p className="text-gray-600">
            {club.name} - Upcoming sessions only (past sessions hidden after 1 day)
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                No upcoming scheduled sessions.
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
      </main>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <AdminGuard>
      <SessionsPageContent />
    </AdminGuard>
  );
}

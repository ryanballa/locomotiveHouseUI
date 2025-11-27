"use client";

import { useRouter } from "next/navigation";
import { useScheduledSessions } from "@/hooks/useScheduledSessions";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiClient, type Appointment, type ScheduledSession } from "@/lib/api";
import { useDialog } from "@/hooks/useDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface ScheduledSessionsCardProps {
  clubId: number;
}

/**
 * Displays scheduled sessions for a club with sign-up buttons
 */
export function ScheduledSessionsCard({ clubId }: ScheduledSessionsCardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { sessions, loading, error } = useScheduledSessions(clubId);
  const [userSignedUpSessions, setUserSignedUpSessions] = useState<
    Map<number, number>
  >(new Map());
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(
    null
  );
  const { isOpen, open, close } = useDialog();
  const [pendingSessionId, setPendingSessionId] = useState<number | null>(null);

  // Fetch current user ID and their appointments to check for signed up sessions
  useEffect(() => {
    const fetchUserAndAppointments = async () => {
      try {
        const userIdResponse = await fetch("/api/user-id");
        const userIdData = await userIdResponse.json();

        if (userIdData.lhUserId) {
          setCurrentUserId(userIdData.lhUserId);

          // Fetch appointments for this user
          const token = await getToken();
          if (token) {
            const appointments = await apiClient.getAppointments(token);
            // Find all appointments with scheduled_session_id and map session ID to appointment ID
            const signedUpSessionMap = new Map<number, number>(
              appointments
                .filter((apt: Appointment) => apt.scheduled_session_id)
                .map((apt: Appointment) => [
                  apt.scheduled_session_id as number,
                  apt.id,
                ])
            );
            setUserSignedUpSessions(signedUpSessionMap);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user appointments:", err);
      }
    };

    fetchUserAndAppointments();
  }, [getToken]);

  const handleSignUp = (session: ScheduledSession) => {
    const scheduledDate = new Date(session.schedule);

    // Format date as YYYY-MM-DD for the form
    const dateStr = scheduledDate.toISOString().split("T")[0];

    // Convert to 12-hour format (e.g., "2:30 PM")
    const hours = scheduledDate.getHours();
    const minutes = scheduledDate.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight, 13-23 to 1-11
    const timeStr = `${displayHours}:${String(minutes).padStart(
      2,
      "0"
    )} ${ampm}`;

    // URL encode the parameters and redirect
    const params = new URLSearchParams({
      date: dateStr,
      time: timeStr,
      scheduledSessionId: session.id.toString(),
    });

    router.push(`/club/${clubId}/appointments/create?${params.toString()}`);
  };

  const handleUnsubscribeClick = (sessionId: number) => {
    setPendingSessionId(sessionId);
    open();
  };

  const handleUnsubscribeConfirm = async () => {
    if (pendingSessionId === null) return;

    try {
      setDeletingSessionId(pendingSessionId);
      const appointmentId = userSignedUpSessions.get(pendingSessionId);

      if (!appointmentId) {
        console.error("Appointment ID not found for session", pendingSessionId);
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("Authentication required");
        return;
      }

      const result = await apiClient.deleteAppointment(appointmentId, token);

      if (result.deleted) {
        // Update the state to remove this session from signed up
        const updatedMap = new Map(userSignedUpSessions);
        updatedMap.delete(pendingSessionId);
        setUserSignedUpSessions(updatedMap);
      } else {
        console.error("Failed to cancel sign-up");
      }
    } catch (err) {
      console.error("Error canceling sign-up:", err);
    } finally {
      setDeletingSessionId(null);
      close();
      setPendingSessionId(null);
    }
  };

  if (loading) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
        Loading scheduled sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Error loading scheduled sessions: {error}
      </div>
    );
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Scheduled Sessions
      </h2>
      <p className="text-gray-600 text-sm mb-4">
        Officially scheduled sessions
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => {
          const sessionDate = new Date(session.schedule);
          const isPast = sessionDate < new Date();

          return (
            <div
              key={session.id}
              className="border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {sessionDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm text-gray-600">
                  {sessionDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {session.description && (
                <p className="text-sm text-gray-700 mb-3 pb-3 border-b border-gray-200">
                  {session.description}
                </p>
              )}

              {userSignedUpSessions.has(session.id) ? (
                <button
                  onClick={() => handleUnsubscribeClick(session.id)}
                  disabled={deletingSessionId === session.id}
                  className="w-full px-4 py-2 rounded-lg font-medium transition bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingSessionId === session.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Canceling...
                    </>
                  ) : (
                    "✓ Signed Up"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSignUp(session)}
                  disabled={isPast}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition ${
                    isPast
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-50"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isPast ? "Session Passed" : "+ Sign Up"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        onConfirm={handleUnsubscribeConfirm}
        title="Cancel Sign-Up"
        description="Are you sure you want to cancel your sign-up for this session?"
        type="danger"
        confirmLabel="Cancel Sign-Up"
        isLoading={deletingSessionId !== null}
      />
    </div>
  );
}

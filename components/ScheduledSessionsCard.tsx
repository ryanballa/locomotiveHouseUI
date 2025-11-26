"use client";

import { useRouter } from "next/navigation";
import { useScheduledSessions } from "@/hooks/useScheduledSessions";
import type { ScheduledSession } from "@/lib/api";

interface ScheduledSessionsCardProps {
  clubId: number;
}

/**
 * Displays scheduled sessions for a club with sign-up buttons
 */
export function ScheduledSessionsCard({ clubId }: ScheduledSessionsCardProps) {
  const router = useRouter();
  const { sessions, loading, error } = useScheduledSessions(clubId);

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
    });

    router.push(`/club/${clubId}/appointments/create?${params.toString()}`);
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
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useScheduledSessions } from "@/hooks/useScheduledSessions";

interface ScheduledVisitsCardProps {
  clubId: string;
  shouldShowViewLink: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Tomorrow";
  } else {
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${dayName}, ${monthDay}`;
  }
}

export function ScheduledVisitsCard({
  clubId,
  shouldShowViewLink,
}: ScheduledVisitsCardProps) {
  const { sessions, loading, error } = useScheduledSessions(Number(clubId));

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduled Sessions
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Scheduled Sessions
        </h2>
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800">{error}</div>
        </div>
      </div>
    );
  }

  // Filter sessions for the next 7 days and group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const sessionsByDate: { [date: string]: typeof sessions } = {};
  sessions.forEach((session) => {
    const sessionDate = new Date(session.schedule);
    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate >= today && sessionDate < nextWeek) {
      const dateKey = sessionDate.toISOString().split("T")[0];
      if (!sessionsByDate[dateKey]) {
        sessionsByDate[dateKey] = [];
      }
      sessionsByDate[dateKey].push(session);
    }
  });

  const dates = Object.keys(sessionsByDate).sort();
  const totalSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.schedule);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today && sessionDate < nextWeek;
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Scheduled Sessions
      </h2>

      {totalSessions === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No sessions scheduled for the next 7 days.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {dates.map((date) => {
            const dateCount = sessionsByDate[date].length;

            return (
              <div
                key={date}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(date)}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                    {dateCount} {dateCount === 1 ? "session" : "sessions"}
                  </span>
                </div>
                <div className="space-y-1">
                  {sessionsByDate[date].map((session) => (
                    <div key={session.id} className="text-xs text-gray-600">
                      <span className="font-medium">
                        {new Date(session.schedule).toLocaleTimeString(
                          "en-US",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                      {session.description && (
                        <span> - {session.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shouldShowViewLink && totalSessions > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href={`/club/${clubId}/appointments`}>
            <p className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
              View all sessions →
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}

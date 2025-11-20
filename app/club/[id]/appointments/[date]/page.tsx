"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Appointment, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { useClubCheck } from "@/hooks/useClubCheck";

interface UserMap {
  [userId: number]: { name: string; permission: number | null };
}

function AppointmentDetailContent() {
  const { getToken, isSignedIn } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);
  const dateParam = params.date as string;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    hasAccessToClub,
    isSuperAdmin,
    loading: clubCheckLoading,
  } = useClubCheck();

  // Verify user has access to this club and fetch data
  useEffect(() => {
    // Wait for club check to complete before verifying access
    if (clubCheckLoading) {
      return;
    }

    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    if (!isSuperAdmin && !hasAccessToClub(clubId)) {
      setError("You do not have access to this club");
      setLoading(false);
      return;
    }

    fetchData();
  }, [clubId, hasAccessToClub, isSuperAdmin, isSignedIn, clubCheckLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // Fetch appointments and users data in parallel
      const [appointmentsData, usersData] = await Promise.all([
        apiClient.getClubAppointments(clubId, token),
        apiClient.getUsers(token),
      ]);

      // Filter appointments for the selected date
      const selectedDateAppointments = appointmentsData.filter((apt) => {
        const aptDate = apt.schedule.split("T")[0];
        return aptDate === dateParam;
      });

      // Sort by time
      selectedDateAppointments.sort(
        (a, b) =>
          new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
      );

      setAppointments(selectedDateAppointments);

      // Build user map for display
      const userMapData: UserMap = {};
      await Promise.all(
        usersData.map(async (user) => {
          try {
            const response = await fetch(
              `/api/clerk-user/${encodeURIComponent(user.token)}`
            );
            const data = await response.json();
            const displayName = data.name || user.name || `User ${user.id}`;
            userMapData[user.id] = { name: displayName, permission: user.permission };
          } catch (err) {
            console.error(`Failed to fetch Clerk user for ${user.token}`, err);
            userMapData[user.id] = { name: `User ${user.id}`, permission: user.permission };
          }
        })
      );

      setUserMap(userMapData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to view appointments.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDurationText = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm font-medium text-red-800">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ClubGuard isContentLoading={false}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Appointments
              </h1>
              <p className="text-lg text-gray-600">
                {formatDate(dateParam)}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 transition"
            >
              ← Back
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">
                No appointments scheduled for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => {
                const startTime = new Date(appointment.schedule);
                const endTime = new Date(
                  startTime.getTime() + appointment.duration * 60000
                );
                const userName =
                  userMap[appointment.user_id]?.name ||
                  `User ${appointment.user_id}`;

                return (
                  <div
                    key={appointment.id}
                    className="bg-white rounded-lg shadow-md p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {formatTime(appointment.schedule)}
                        </h2>
                        <p className="text-gray-600 text-sm mt-1">
                          ID: {appointment.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                          {getDurationText(appointment.duration)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-y border-gray-200">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">
                          User
                        </h3>
                        <p className="text-gray-900">{userName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">
                          End Time
                        </h3>
                        <p className="text-gray-900">{formatTime(endTime.toISOString())}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-500">
                      Full Schedule: {new Date(appointment.schedule).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ClubGuard>
  );
}

export default function AppointmentDetailPage() {
  return <AppointmentDetailContent />;
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Appointment, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { FridayEveningCard } from "@/components/FridayEveningCard";
import { useClubCheck } from "@/hooks/useClubCheck";
import { shouldShowFridayEvening } from "@/lib/fridayEveningConfig";
import Link from "next/link";

interface GroupedAppointments {
  [date: string]: Appointment[];
}

interface UserMap {
  [userId: number]: string;
}

function ClubAppointmentsContent() {
  const { getToken, isSignedIn } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<UserMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentUserLhId, setCurrentUserLhId] = useState<number | null>(null);
  const [creatingFriday, setCreatingFriday] = useState<string | null>(null);

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

    if (!isSuperAdmin && !hasAccessToClub(clubId)) {
      setError("You do not have access to this club");
      setLoading(false);
      return;
    }

    if (isSignedIn) {
      fetchData();
    }
  }, [clubId, hasAccessToClub, isSuperAdmin, isSignedIn, clubCheckLoading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch current user's lhUserId and other data in parallel
      const [appointmentsData, usersData, userIdResponse] = await Promise.all([
        apiClient.getClubAppointments(clubId, token || undefined),
        apiClient.getUsers(token || ""),
        fetch("/api/user-id"),
      ]);

      const userIdData = await userIdResponse.json();
      if (userIdData.lhUserId) {
        setCurrentUserLhId(userIdData.lhUserId);
      }

      setAppointments(appointmentsData);
      setUsers(usersData);

      // Fetch Clerk user details for each user
      const userMapData: UserMap = {};
      const clerkUserPromises = usersData.map(async (user) => {
        try {
          const response = await fetch(
            `/api/clerk-user/${encodeURIComponent(user.token)}`
          );
          const data = await response.json();

          // Use name from Clerk if available, otherwise use database name
          const displayName = data.name || user.name || `User ${user.id}`;
          userMapData[user.id] = displayName;
        } catch (err) {
          console.error(`Failed to fetch Clerk user for ${user.token}`, err);
          userMapData[user.id] = `User ${user.id}`;
        }
      });

      await Promise.all(clerkUserPromises);
      setUserMap(userMapData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to view and manage appointments.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const groupedAppointments = useMemo(() => {
    const grouped: GroupedAppointments = {};

    appointments.forEach((appointment) => {
      const date = new Date(appointment.schedule);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(appointment);
    });

    // Sort appointments within each day by time
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort(
        (a, b) =>
          new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
      );
    });

    return grouped;
  }, [appointments]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedAppointments).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [groupedAppointments]);

  const formatDayHeader = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      timeStyle: "short",
    }).format(date);
  };

  const handleAddSchedule = () => {};

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this appointment?")) {
      return;
    }

    try {
      setDeletingId(id);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteAppointment(id, token);
      if (result.deleted) {
        setAppointments(appointments.filter((a) => a.id !== id));
      } else {
        setError("Failed to delete appointment");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update appointment"
      );
    } finally {
      setDeletingId(null);
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Appointments
            </h1>
            <p className="text-gray-600">View all scheduled appointments</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 transition"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {shouldShowFridayEvening(clubId) && (
          <FridayEveningCard clubId={clubId} />
        )}

        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Appointments
          </h2>
          <Link href={`/club/${clubId}/appointments/create`}>
            <button
              onClick={handleAddSchedule}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              Add Appointment
            </button>
          </Link>
        </header>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">
              No appointments scheduled yet.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((dateKey) => (
              <div key={dateKey}>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 border-b-2 border-blue-600 pb-2">
                    {formatDayHeader(dateKey)}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {groupedAppointments[dateKey].length} appointment
                    {groupedAppointments[dateKey].length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {groupedAppointments[dateKey].map((appointment) => (
                    <div
                      key={appointment.id}
                      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl font-bold text-blue-600">
                              {formatTime(appointment.schedule)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Appointment #{appointment.id}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {appointment.duration} min
                        </span>
                      </div>
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-500 mb-3">
                          {userMap[appointment.user_id]
                            ? `Club Member: ${userMap[appointment.user_id]}`
                            : `User ID: ${appointment.user_id}`}
                        </p>
                        {currentUserLhId === appointment.user_id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/appointments/edit/${appointment.id}`
                                )
                              }
                              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(appointment.id)}
                              disabled={deletingId === appointment.id}
                              className="flex-1 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === appointment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClubAppointmentsPage() {
  return (
    <ClubGuard>
      <ClubAppointmentsContent />
    </ClubGuard>
  );
}

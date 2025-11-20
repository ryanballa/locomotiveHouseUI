import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, Appointment } from "@/lib/api";

interface AppointmentsByDate {
  [date: string]: number; // date -> count of appointments
}

interface UseClubAppointmentsReturn {
  appointmentsByDate: AppointmentsByDate;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch appointments for the next 7 days grouped by date with counts
 *
 * @param clubId - The ID of the club
 * @returns Object containing appointments grouped by date with counts, loading state, and error state
 */
export function useClubAppointments(
  clubId: number | string
): UseClubAppointmentsReturn {
  const { getToken, isSignedIn } = useAuth();
  const [appointmentsByDate, setAppointmentsByDate] = useState<AppointmentsByDate>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    let isActive = true;

    const fetchAppointments = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          if (isActive) {
            setError("Authentication required");
            setLoading(false);
          }
          return;
        }

        const appointments = await apiClient.getClubAppointments(
          Number(clubId),
          token
        );

        if (!isActive) return;

        // Get today and the next 7 days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const appointmentsByDateMap: AppointmentsByDate = {};

        // Initialize all 7 days with 0
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          appointmentsByDateMap[dateStr] = 0;
        }

        // Count appointments for each date
        appointments.forEach((appointment) => {
          // The schedule field contains the full datetime string
          if (appointment.schedule) {
            const appointmentDate = appointment.schedule.split("T")[0];
            if (appointmentsByDateMap.hasOwnProperty(appointmentDate)) {
              appointmentsByDateMap[appointmentDate]++;
            }
          }
        });

        if (isActive) {
          setAppointmentsByDate(appointmentsByDateMap);
        }
      } catch (err) {
        if (!isActive) return;

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load appointments";

        if (
          errorMessage.includes("Unauthenticated") ||
          errorMessage.includes("401")
        ) {
          setError("Please sign in to access appointments");
        } else {
          setError(errorMessage);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchAppointments();

    return () => {
      isActive = false;
    };
  }, [clubId, isSignedIn]);

  return { appointmentsByDate, loading, error };
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import {
  FRIDAY_EVENING_CONFIG,
  isFridayExcluded,
} from "@/lib/fridayEveningConfig";
import type { Appointment, User } from "@/lib/api";

interface Attendee {
  id: number;
  name?: string;
  email?: string;
}

interface FridayEveningData {
  date: string; // YYYY-MM-DD format
  fridayDate: Date;
  attendees: number[]; // Array of user IDs attending
  attendeeDetails: Attendee[]; // Array of attendee objects with names
  isUserAttending: boolean;
  userAppointmentId?: number;
}

/**
 * Friday Evening Attendance Component
 *
 * Displays the next 4 Fridays with evening attendance (6 PM onwards).
 * Shows who is attending and allows quick signup for 7-9 PM slots.
 *
 * Features:
 * - Shows next 4 Fridays
 * - Lists attendees for evening slots (6 PM+)
 * - Green card if 2+ attendees, orange otherwise
 * - Quick signup button for 7-9 PM
 * - Prevents duplicate signups
 * - Auto-updates attendance count when user signs up
 *
 * @param clubId - The club ID to fetch appointments for
 * @returns Rendered Friday evening cards component
 *
 * @example
 * ```typescript
 * <FridayEveningCard clubId={1} />
 * ```
 */
export function FridayEveningCard({ clubId }: { clubId: number }) {
  const { getToken, isSignedIn } = useAuth();
  const [fridayData, setFridayData] = useState<FridayEveningData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingUp, setSigningUp] = useState<number | null>(null); // Friday index being signed up
  const [unassigning, setUnassigning] = useState<number | null>(null); // Friday index being unassigned
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | undefined>(
    undefined
  );
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(
    undefined
  );

  /**
   * Fetch appointments and get current user ID
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isSignedIn) {
          setLoading(false);
          return;
        }

        const userToken = await getToken();
        if (!userToken) {
          setLoading(false);
          return;
        }

        // Get current user
        const currentUser = await apiClient.getCurrentUser(userToken);
        if (currentUser) {
          setCurrentUserId(currentUser.id);
          setCurrentUserName(currentUser.name);
          setCurrentUserEmail(currentUser.email);
        }

        // Get all appointments for the club
        const appointments = await apiClient.getAppointments(userToken);

        // Get all users to map attendee names
        const allUsers = await apiClient.getUsers(userToken);

        // Use firstName, lastName, and email from backend (synced from Clerk during profile completion)
        const enhancedUsers = allUsers.map((user) => {
          // Build name from firstName and lastName if available
          const name =
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.name;

          return {
            ...user,
            name,
            email: user.email, // Already from backend
          };
        });

        const userMap = new Map(enhancedUsers.map((user) => [user.id, user]));

        // Calculate next 4 Fridays
        const fridays = getNextFridays(4);

        // Process each Friday
        const fridayDataList = fridays.map((fridayDate) => {
          const dateStr = formatDateToString(fridayDate);

          // Filter appointments for this Friday that are in the evening (6 PM+)
          const eveningAppointments = appointments.filter((apt) => {
            const aptDate = new Date(apt.schedule);
            const aptHour = aptDate.getUTCHours();

            // Must be same day and in evening (6 PM+)
            return (
              formatDateToString(aptDate) === dateStr &&
              aptHour >= FRIDAY_EVENING_CONFIG.eveningStartHour
            );
          });

          // Get unique users attending
          const attendeeIds = new Set(
            eveningAppointments.map((apt) => apt.user_id)
          );
          const attendeeList = Array.from(attendeeIds)
            .map((userId) => {
              const user = userMap.get(userId);
              return {
                id: userId,
                name: user?.name,
                email: user?.email,
              };
            })
            .sort((a, b) => {
              const aDisplay = a.name || a.email || `User ${a.id}`;
              const bDisplay = b.name || b.email || `User ${b.id}`;
              return aDisplay.localeCompare(bDisplay);
            }); // Sort by name

          // Check if current user is attending
          const isUserAttending = currentUser
            ? attendeeIds.has(currentUser.id)
            : false;

          // Get user appointment ID if attending
          const userAppointmentId = currentUser
            ? eveningAppointments.find((apt) => apt.user_id === currentUser.id)
                ?.id
            : undefined;

          return {
            date: dateStr,
            fridayDate,
            attendees: Array.from(attendeeIds), // Array of user IDs
            attendeeDetails: attendeeList, // Array of attendee objects with names
            isUserAttending,
            userAppointmentId,
          };
        });

        setFridayData(fridayDataList);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load Friday evening data";
        console.error("Friday evening error:", message);
        setError(null); // Don't show error to user, just silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId, isSignedIn, getToken]);

  /**
   * Handle user signup for Friday evening
   */
  const handleSignup = async (fridayIndex: number) => {
    if (signingUp !== null) return; // Already signing up
    if (!isSignedIn) return;
    if (!currentUserId) return; // User ID not yet loaded

    try {
      setSigningUp(fridayIndex);

      const userToken = await getToken();
      if (!userToken) {
        setError("Authentication required");
        return;
      }

      const friday = fridayData[fridayIndex];
      const signupDate = new Date(friday.fridayDate);
      signupDate.setUTCHours(FRIDAY_EVENING_CONFIG.signupStartHour, 0, 0, 0);

      // Create appointment
      const appointmentData = {
        schedule: signupDate.toISOString(),
        duration: FRIDAY_EVENING_CONFIG.signupDurationMinutes,
        user_id: currentUserId,
      };

      const result = await apiClient.createAppointment(
        appointmentData,
        userToken
      );

      if (result.created) {
        // Update local state to reflect signup
        const updatedFridayData = [...fridayData];
        const currentData = updatedFridayData[fridayIndex];

        if (currentUserId && !currentData.attendees.includes(currentUserId)) {
          currentData.attendees.push(currentUserId);
          currentData.attendeeDetails.push({
            id: currentUserId,
            name: currentUserName,
            email: currentUserEmail,
          });
          // Re-sort by name/email/id
          currentData.attendeeDetails.sort((a, b) => {
            const aDisplay = a.name || a.email || `User ${a.id}`;
            const bDisplay = b.name || b.email || `User ${b.id}`;
            return aDisplay.localeCompare(bDisplay);
          });
          currentData.isUserAttending = true;
          currentData.userAppointmentId = result.id;
        }

        setFridayData(updatedFridayData);
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign up";
      console.error("Signup error:", message);
      setError("Failed to sign up for Friday evening");
    } finally {
      setSigningUp(null);
    }
  };

  /**
   * Handle user unassigning from Friday evening
   */
  const handleUnassign = async (fridayIndex: number) => {
    if (unassigning !== null) return; // Already unassigning
    if (!isSignedIn) return;
    if (!currentUserId) return; // User ID not yet loaded

    const friday = fridayData[fridayIndex];
    if (!friday.userAppointmentId) return; // No appointment to unassign

    // Confirm before unassigning
    if (
      !confirm("Are you sure you want to unassign yourself from this Friday?")
    ) {
      return;
    }

    try {
      setUnassigning(fridayIndex);

      const userToken = await getToken();
      if (!userToken) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteAppointment(
        friday.userAppointmentId,
        userToken
      );

      if (result.deleted) {
        // Update local state to reflect unassignment
        const updatedFridayData = [...fridayData];
        const currentData = updatedFridayData[fridayIndex];

        // Remove user from attendees
        currentData.attendees = currentData.attendees.filter(
          (id) => id !== currentUserId
        );
        currentData.attendeeDetails = currentData.attendeeDetails.filter(
          (attendee) => attendee.id !== currentUserId
        );
        currentData.isUserAttending = false;
        currentData.userAppointmentId = undefined;

        setFridayData(updatedFridayData);
      } else {
        const errorMsg =
          (result as any).error || "Failed to unassign. Please try again.";
        setError(errorMsg);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unassign";
      console.error("Unassign error:", message);
      setError(message);
    } finally {
      setUnassigning(null);
    }
  };

  if (!isSignedIn) {
    return null; // Don't show component if not signed in
  }

  if (loading) {
    return (
      <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center text-gray-600">
        Loading Friday evening schedule...
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Friday Evenings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fridayData.map((friday, index) => {
          const attendeeCount = friday.attendees.length;
          const isGreen =
            attendeeCount >= FRIDAY_EVENING_CONFIG.minAttendanceForGreen;
          const bgColor = isGreen
            ? "bg-green-50 border-green-200"
            : "bg-orange-50 border-orange-200";
          const textColor = isGreen ? "text-green-900" : "text-orange-900";
          const badgeColor = isGreen
            ? "bg-green-200 text-green-900"
            : "bg-orange-200 text-orange-900";

          return (
            <div
              key={friday.date}
              className={`border rounded-lg p-4 ${bgColor}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`text-lg font-semibold ${textColor}`}>
                    {formatDateToUTC(friday.fridayDate)}
                  </h3>
                  <p className={`text-sm ${textColor}`}>7PM - Close</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}
                >
                  {`${attendeeCount} ${
                    attendeeCount === 1 ? "person" : "people"
                  }`}
                </div>
              </div>

              <div className="mb-4">
                {attendeeCount > 0 ? (
                  <>
                    <p className={`text-sm ${textColor} mb-2`}>
                      {attendeeCount >=
                      FRIDAY_EVENING_CONFIG.minAttendanceForGreen
                        ? "✓ Enough people to visit!"
                        : `Need ${
                            FRIDAY_EVENING_CONFIG.minAttendanceForGreen -
                            attendeeCount
                          } more`}
                    </p>
                    <div className={`text-sm ${textColor}`}>
                      <p className={`text-sm font-semibold ${textColor} mb-1`}>
                        Attending:
                      </p>
                      <ul className="space-y-1">
                        {friday.attendeeDetails.map((attendee) => (
                          <li
                            key={attendee.id}
                            className="flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                            <span>
                              {attendee.name ||
                                attendee.email ||
                                `User ${attendee.id}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className={`text-sm ${textColor}`}>
                    Be the first to sign up!
                  </p>
                )}
              </div>

              {isFridayExcluded(friday.fridayDate) ? (
                <div className="w-full px-4 py-2 bg-gray-300 text-gray-600 font-medium rounded-lg text-center cursor-not-allowed opacity-50">
                  Not Available
                </div>
              ) : !friday.isUserAttending ? (
                <button
                  onClick={() => handleSignup(index)}
                  disabled={signingUp === index}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  {signingUp === index ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing up...
                    </>
                  ) : (
                    "+ Sign Up (7-9 PM)"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleUnassign(index)}
                  disabled={unassigning === index}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                >
                  {unassigning === index ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Unassigning...
                    </>
                  ) : (
                    "✓ You're signed up!"
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Get the next N Fridays from today (inclusive if today is Friday)
 */
function getNextFridays(count: number): Date[] {
  const fridays: Date[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let current = new Date(today);

  // Find the next Friday (0 = Sunday, 5 = Friday)
  const dayOfWeek = current.getUTCDay();
  const daysUntilFriday = dayOfWeek === 5 ? 0 : (5 - dayOfWeek + 7) % 7;

  current.setUTCDate(current.getUTCDate() + daysUntilFriday);

  for (let i = 0; i < count; i++) {
    fridays.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 7);
  }

  return fridays;
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateToString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format date using UTC timezone to avoid DST issues
 */
function formatDateToUTC(date: Date): string {
  const weekday = new Date(
    date.toLocaleString("en-US", { timeZone: "UTC" })
  ).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const month = date.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
  });
  const day = date.getUTCDate();
  return `${weekday}, ${month} ${day}`;
}

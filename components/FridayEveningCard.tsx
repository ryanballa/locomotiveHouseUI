'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { FRIDAY_EVENING_CONFIG } from '@/lib/fridayEveningConfig';
import type { Appointment, User } from '@/lib/api';

interface FridayEveningData {
  date: string; // YYYY-MM-DD format
  fridayDate: Date;
  attendees: number[]; // Array of user IDs attending
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

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
        }

        // Get all appointments for the club
        const appointments = await apiClient.getAppointments(userToken);

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
          const attendeeIds = new Set(eveningAppointments.map((apt) => apt.user_id));
          const uniqueAttendees = Array.from(attendeeIds).length;

          // Check if current user is attending
          const isUserAttending = currentUser ? attendeeIds.has(currentUser.id) : false;

          // Get user appointment ID if attending
          const userAppointmentId = currentUser
            ? eveningAppointments.find((apt) => apt.user_id === currentUser.id)?.id
            : undefined;

          return {
            date: dateStr,
            fridayDate,
            attendees: Array.from(attendeeIds), // Array of user IDs
            isUserAttending,
            userAppointmentId,
          };
        });

        setFridayData(fridayDataList);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load Friday evening data';
        console.error('Friday evening error:', message);
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
        setError('Authentication required');
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

      const result = await apiClient.createAppointment(appointmentData, userToken);

      if (result.created) {
        // Update local state to reflect signup
        const updatedFridayData = [...fridayData];
        const currentData = updatedFridayData[fridayIndex];

        if (currentUserId && !currentData.attendees.includes(currentUserId)) {
          currentData.attendees.push(currentUserId);
          currentData.isUserAttending = true;
          currentData.userAppointmentId = result.id;
        }

        setFridayData(updatedFridayData);
      } else {
        setError('Failed to sign up. Please try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign up';
      console.error('Signup error:', message);
      setError('Failed to sign up for Friday evening');
    } finally {
      setSigningUp(null);
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
          const isGreen = attendeeCount >= FRIDAY_EVENING_CONFIG.minAttendanceForGreen;
          const bgColor = isGreen ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200';
          const textColor = isGreen ? 'text-green-900' : 'text-orange-900';
          const badgeColor = isGreen ? 'bg-green-200 text-green-900' : 'bg-orange-200 text-orange-900';

          return (
            <div
              key={friday.date}
              className={`border rounded-lg p-4 ${bgColor}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className={`text-lg font-semibold ${textColor}`}>
                    {friday.fridayDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className={`text-sm ${textColor}`}>6 PM - Close</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                  {attendeeCount} {attendeeCount === 1 ? 'person' : 'people'}
                </div>
              </div>

              <div className="mb-4">
                {attendeeCount > 0 ? (
                  <p className={`text-sm ${textColor}`}>
                    {attendeeCount >= FRIDAY_EVENING_CONFIG.minAttendanceForGreen
                      ? '✓ Enough people to visit!'
                      : `Need ${FRIDAY_EVENING_CONFIG.minAttendanceForGreen - attendeeCount} more`}
                  </p>
                ) : (
                  <p className={`text-sm ${textColor}`}>Be the first to sign up!</p>
                )}
              </div>

              {!friday.isUserAttending ? (
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
                    '+ Sign Up (7-9 PM)'
                  )}
                </button>
              ) : (
                <div className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg text-center">
                  ✓ You're signed up!
                </div>
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
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

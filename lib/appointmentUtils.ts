/**
 * Utility functions for managing and filtering appointments
 */

import type { Appointment } from './api';

/**
 * Filters out appointments that have already occurred (before today).
 *
 * An appointment is considered "old" if its scheduled date/time is before
 * the start of the current day (00:00:00 in UTC). This ensures that
 * appointments scheduled for today and beyond are shown.
 *
 * @param appointments - Array of appointments to filter
 * @param referenceDate - Optional reference date to use for comparison (defaults to today)
 * @returns Filtered array containing only future or today's appointments
 *
 * @example
 * ```typescript
 * import { filterFutureAppointments } from '@/lib/appointmentUtils';
 * import type { Appointment } from '@/lib/api';
 *
 * const appointments: Appointment[] = [
 *   { id: 1, schedule: '2025-11-05T10:00:00Z', duration: 60, user_id: 1 },
 *   { id: 2, schedule: '2025-11-04T14:00:00Z', duration: 30, user_id: 2 }, // Yesterday
 *   { id: 3, schedule: '2025-11-06T09:00:00Z', duration: 45, user_id: 1 },
 * ];
 *
 * const futureAppointments = filterFutureAppointments(appointments);
 * // Result: [id 1 and 3 are kept, id 2 is filtered out]
 * ```
 *
 * @remarks
 * - Appointments with times in the past (even if they're earlier today) will be filtered
 * - Uses UTC for all comparisons
 * - Empty arrays return empty arrays
 * - Invalid dates in the schedule field are silently filtered out
 *
 * @throws Nothing - invalid appointments are silently filtered out
 */
export function filterFutureAppointments(
  appointments: Appointment[],
  referenceDate: Date = new Date()
): Appointment[] {
  // Get the start of today in UTC
  const startOfToday = new Date(referenceDate);
  startOfToday.setUTCHours(0, 0, 0, 0);

  return appointments.filter((appointment) => {
    try {
      const appointmentDate = new Date(appointment.schedule);
      // Check if the date is valid
      if (Number.isNaN(appointmentDate.getTime())) {
        return false;
      }
      // Keep the appointment if it's today or in the future
      return appointmentDate >= startOfToday;
    } catch {
      // If date parsing fails, filter out the appointment
      return false;
    }
  });
}

/**
 * Checks if a single appointment has already occurred (is in the past).
 *
 * An appointment is considered "past" if its scheduled date/time is before
 * the start of the current day (00:00:00 in UTC).
 *
 * @param appointment - The appointment to check
 * @param referenceDate - Optional reference date to use for comparison (defaults to today)
 * @returns true if the appointment is in the past, false if it's today or future
 *
 * @example
 * ```typescript
 * import { isAppointmentInPast } from '@/lib/appointmentUtils';
 *
 * const pastAppointment = {
 *   id: 1,
 *   schedule: '2025-11-04T10:00:00Z',
 *   duration: 60,
 *   user_id: 1
 * };
 *
 * if (isAppointmentInPast(pastAppointment)) {
 *   console.log('This appointment already occurred');
 * }
 * ```
 */
export function isAppointmentInPast(
  appointment: Appointment,
  referenceDate: Date = new Date()
): boolean {
  const startOfToday = new Date(referenceDate);
  startOfToday.setUTCHours(0, 0, 0, 0);

  try {
    const appointmentDate = new Date(appointment.schedule);
    // Check if the date is valid
    if (Number.isNaN(appointmentDate.getTime())) {
      return true;
    }
    return appointmentDate < startOfToday;
  } catch {
    // If date parsing fails, treat it as past
    return true;
  }
}

/**
 * Separates appointments into past and future groups.
 *
 * Useful for displaying appointments in different sections or for analytics.
 *
 * @param appointments - Array of appointments to separate
 * @param referenceDate - Optional reference date to use for comparison (defaults to today)
 * @returns Object with `past` and `future` appointment arrays
 *
 * @example
 * ```typescript
 * import { groupAppointmentsByTime } from '@/lib/appointmentUtils';
 *
 * const appointments = [
 *   { id: 1, schedule: '2025-11-04T10:00:00Z', duration: 60, user_id: 1 },
 *   { id: 2, schedule: '2025-11-10T14:00:00Z', duration: 30, user_id: 2 },
 * ];
 *
 * const { past, future } = groupAppointmentsByTime(appointments);
 * console.log(`${past.length} past appointments, ${future.length} future`);
 * ```
 */
export function groupAppointmentsByTime(
  appointments: Appointment[],
  referenceDate: Date = new Date()
): { past: Appointment[]; future: Appointment[] } {
  const past: Appointment[] = [];
  const future: Appointment[] = [];

  appointments.forEach((appointment) => {
    if (isAppointmentInPast(appointment, referenceDate)) {
      past.push(appointment);
    } else {
      future.push(appointment);
    }
  });

  return { past, future };
}

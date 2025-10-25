/**
 * Friday Evening Component Configuration
 *
 * This config determines which club(s) display the Friday evening
 * attendance component on their appointments page.
 *
 * The Friday evening component shows the next 4 Fridays with:
 * - Who is attending (6 PM to close)
 * - Attendance status (green if 2+, orange if <2)
 * - Quick signup button for 7-9 PM slots
 */

/**
 * Club ID that should display the Friday evening component
 * Set to null to disable the component globally
 * Set to a specific number (e.g., 1) to enable for that club only
 *
 * @example
 * // Enable for The Garfield-Clarendon Model Railroad Club (ID: 1)
 * export const FRIDAY_EVENING_CLUB_ID = 1;
 *
 * // Disable the component
 * export const FRIDAY_EVENING_CLUB_ID = null;
 */
export const FRIDAY_EVENING_CLUB_ID = 1;

/**
 * Evening time window configuration
 * Used to filter appointments for the "evening" view
 */
export const FRIDAY_EVENING_CONFIG = {
  /**
   * Start of evening window (6 PM in 24-hour format)
   * Used to find who is attending during the evening
   */
  eveningStartHour: 18,

  /**
   * Signup duration (minutes)
   * When a user clicks signup, creates appointment for this duration
   * @example 120 = 2 hours (7 PM to 9 PM)
   */
  signupDurationMinutes: 120,

  /**
   * Signup start time (7 PM in 24-hour format)
   * What time the signup appointment should start
   */
  signupStartHour: 19,

  /**
   * Minimum attendance threshold
   * If attendees >= this number, card is green; otherwise orange
   */
  minAttendanceForGreen: 2,

  /**
   * Number of Fridays to display
   */
  numFridaysToShow: 4,
};

/**
 * Helper function to check if component should be shown
 *
 * @param clubId - The current club ID
 * @returns true if this club should display the Friday evening component
 *
 * @example
 * if (shouldShowFridayEvening(1)) {
 *   // Show component
 * }
 */
export function shouldShowFridayEvening(clubId: number | null | undefined): boolean {
  if (!clubId || FRIDAY_EVENING_CLUB_ID === null) {
    return false;
  }
  return clubId === FRIDAY_EVENING_CLUB_ID;
}

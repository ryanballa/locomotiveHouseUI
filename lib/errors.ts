/**
 * Custom error types for the application.
 */

/**
 * Thrown when a required user ID is missing or not provided.
 */
export class UserIDMissingError extends Error {
  readonly code = 'USER_ID_MISSING';
  readonly statusCode = 400;

  constructor(message: string = 'User ID is required') {
    super(message);
    this.name = 'UserIDMissingError';
    Object.setPrototypeOf(this, UserIDMissingError.prototype);
  }
}

/**
 * Thrown when Clerk API fails due to network error or service issue.
 */
export class ClerkGeneralFailure extends Error {
  readonly code = 'CLERK_GENERAL_FAILURE';
  readonly statusCode = 500;

  constructor(message: string = 'Failed to fetch user from Clerk') {
    super(message);
    this.name = 'ClerkGeneralFailure';
    Object.setPrototypeOf(this, ClerkGeneralFailure.prototype);
  }
}

/**
 * Type guard to check if an error is a UserIDMissingError.
 */
export function isUserIDMissingError(error: unknown): error is UserIDMissingError {
  return error instanceof UserIDMissingError;
}

/**
 * Type guard to check if an error is a ClerkGeneralFailure.
 */
export function isClerkGeneralFailure(error: unknown): error is ClerkGeneralFailure {
  return error instanceof ClerkGeneralFailure;
}

/**
 * Type union of all custom errors.
 */
export type CustomError = UserIDMissingError | ClerkGeneralFailure;

/**
 * Check if an error is a custom application error.
 */
export function isCustomError(error: unknown): error is CustomError {
  return isUserIDMissingError(error) || isClerkGeneralFailure(error);
}

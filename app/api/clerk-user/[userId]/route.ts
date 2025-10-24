import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  UserIDMissingError,
  ClerkGeneralFailure,
  isCustomError,
} from "@/lib/errors";

export const runtime = "nodejs";

/**
 * Retrieves user information from Clerk.
 *
 * Fetches a user's name and email address from Clerk using the provided user ID.
 *
 * @param request - The incoming HTTP request
 * @param params - Route parameters containing the userId
 * @returns {Promise<NextResponse>} JSON response with user name and email
 *
 * @throws {UserIDMissingError} If the user ID is not provided in the route parameters
 * @throws {ClerkGeneralFailure} If Clerk API fails due to network error or service issue
 *
 * @example
 * ```typescript
 * // Request to GET /api/clerk-user/user_123
 * // Returns: { name: "John Doe", email: "john@example.com" }
 * ```
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      const error = new UserIDMissingError();
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    // Fetch user from Clerk
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      // Return user's name and email
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName ||
            user.lastName ||
            user.emailAddresses[0]?.emailAddress ||
            "Unknown User";

      const email = user.emailAddresses[0]?.emailAddress || null;

      return NextResponse.json({ name, email });
    } catch (clerkError) {
      const error = new ClerkGeneralFailure(
        clerkError instanceof Error ? clerkError.message : "Unknown error"
      );
      console.error("Error fetching Clerk user:", clerkError);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
  } catch (error) {
    if (isCustomError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    console.error("Unexpected error in GET /api/clerk-user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

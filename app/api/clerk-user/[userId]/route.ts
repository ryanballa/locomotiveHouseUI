import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Return user's name and email
    const name = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.lastName || user.emailAddresses[0]?.emailAddress || 'Unknown User';

    const email = user.emailAddresses[0]?.emailAddress || null;

    return NextResponse.json({ name, email });
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

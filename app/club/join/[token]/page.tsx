'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import type { Club } from '@/lib/api';

/**
 * Club Invite Join Page
 *
 * Standalone page (no navbar) that allows users to join a club using an invite token.
 * The token is passed via URL parameter: /club/join/[token]
 *
 * Features:
 * - No navigation (minimal, focused UI)
 * - Token validation and club lookup
 * - Loading states with spinner
 * - Error handling (expired, invalid, already member, etc.)
 * - Successful join with redirect to club appointments
 * - Unauthenticated user handling
 *
 * @example
 * User receives link: https://example.com/club/join/abc123def456
 * Page validates token, displays club info, and allows user to join
 *
 * @returns {JSX.Element} Rendered invite page
 */
export default function ClubInvitePage() {
  const router = useRouter();
  const params = useParams();
  const { getToken, isSignedIn, isLoaded } = useAuth();

  const token = params.token as string;

  // State management
  const [loading, setLoading] = useState(true);
  const [joiningClub, setJoiningClub] = useState(false);
  const [clubInfo, setClubInfo] = useState<Club | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validate invite token and fetch club information
   * Calls GET /api/clubs/invite/validate?token=TOKEN to get club details
   * Requires authentication since we'll be assigning the user to a club
   */
  useEffect(() => {
    const validateToken = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isLoaded) {
          // Still loading auth state
          return;
        }

        if (!isSignedIn) {
          // User not authenticated - will show sign-in prompt
          setLoading(false);
          return;
        }

        const userToken = await getToken();
        if (!userToken) {
          setError('Failed to get authentication token. Please sign in again.');
          setLoading(false);
          return;
        }

        // Validate token and get club info (requires auth)
        const validation = await apiClient.validateInviteToken(token, userToken);

        if (validation.valid && validation.clubId && validation.clubName) {
          setClubInfo({
            id: validation.clubId,
            name: validation.clubName,
          });
          setError(null);
        } else {
          const errorMessage = validation.error || 'Invalid or expired invite link';
          setError(errorMessage);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to validate invite token';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (token && isLoaded && isSignedIn) {
      validateToken();
    }
  }, [token, isLoaded, isSignedIn, getToken]);

  /**
   * Handle redirect after successful club join
   * Watches for success state and redirects after 2 seconds
   */
  useEffect(() => {
    if (success && clubInfo?.id) {
      const timer = setTimeout(() => {
        router.push(`/club/${clubInfo.id}/appointments`);
      }, 2000);

      // Cleanup function to clear timeout if component unmounts
      return () => clearTimeout(timer);
    }
  }, [success, clubInfo?.id, router]);

  /**
   * Handle joining the club with the invite token
   * Requires: clubId (from token validation) and userToken (from auth)
   */
  const handleJoinClub = async () => {
    if (!clubInfo?.id) {
      setError('Club information is missing. Please try again.');
      return;
    }

    try {
      setJoiningClub(true);
      setError(null);

      const userToken = await getToken();
      if (!userToken) {
        setError('Your session expired. Please sign in again.');
        setJoiningClub(false);
        return;
      }

      const result = await apiClient.joinClubWithToken(clubInfo.id, token, userToken);

      if (result.joined) {
        setSuccess(true);
      } else {
        const errorMessage = result.error || 'Failed to join club. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred while joining the club';
      setError(message);
    } finally {
      setJoiningClub(false);
    }
  };

  // Loading auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in state - require sign-in to join
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Join Club</h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to join a club. Please sign in to continue.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Go Home & Sign In
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600">Validating your invite link...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="mb-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Invalid Invite</h1>
          <p className="text-gray-600 mb-6 text-center">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-12 w-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-6">
            You've successfully joined {clubInfo?.name}. Redirecting...
          </p>
          <div className="animate-spin inline-block rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Main state - show club info and join button
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Join Club</h1>
        <p className="text-gray-600 text-center mb-8">
          {clubInfo ? `Join ${clubInfo.name}` : 'Loading club details...'}
        </p>

        {clubInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{clubInfo.name}</h2>
            <p className="text-sm text-gray-600">
              Tap the button below to confirm and join this club.
            </p>
          </div>
        )}

        <button
          onClick={handleJoinClub}
          disabled={joiningClub || !clubInfo}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          {joiningClub ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Joining...
            </>
          ) : (
            'Join Club'
          )}
        </button>

        <button
          onClick={() => router.push('/')}
          disabled={joiningClub}
          className="w-full mt-3 px-4 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-medium rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

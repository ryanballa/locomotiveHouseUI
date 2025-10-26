'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { useClubCheck } from '@/hooks/useClubCheck';

/**
 * Homepage for Locomotive House application
 *
 * Features:
 * - Welcome message for authenticated users
 * - Redirects to club appointments if user has a club assignment
 * - Shows getting started guidance for new users
 * - Sign in prompt for unauthenticated users
 *
 * @returns {JSX.Element} Rendered homepage
 */
export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { clubId, loading: clubLoading, hasClub, isSuperAdmin } = useClubCheck();

  useEffect(() => {
    // If user has a club assignment, redirect to appointments
    if (!clubLoading && hasClub && clubId) {
      router.push(`/club/${clubId}/appointments`);
    }
  }, [clubId, clubLoading, hasClub, router]);

  // Loading authentication state
  if (!isLoaded) {
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

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Locomotive House</h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage your club appointments, addresses, and team members all in one place.
            </p>
            <p className="text-gray-600 mb-8">
              Sign in to get started or ask an administrator for a club invite link.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Loading club assignment
  if (clubLoading) {
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

  // Super admin without club assignment - show admin panel
  if (isSuperAdmin && !clubId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, Super Admin</h1>
            <p className="text-gray-600 mb-8">
              You can access all features. Visit the Admin section to manage clubs and users.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // User signed in but no club assignment
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">Club Assignment Required</h2>
          <p className="text-sm mb-4">
            You need to be assigned to a club to access Locomotive House. Please contact an administrator or ask for a club invite link.
          </p>
          <p className="text-sm">
            If you have an invite link, visit it to join a club.
          </p>
        </div>
      </main>
    </div>
  );
}

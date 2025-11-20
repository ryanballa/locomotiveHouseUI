"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { useUserClubs } from "@/hooks/useUserClubs";
import { ClubGuard } from "@/components/ClubGuard";

/**
 * Homepage for Locomotive House application
 *
 * Features:
 * - Welcome message for authenticated users
 * - Redirects to club dashboard if user has a club assignment
 * - Shows getting started guidance for new users
 * - Sign in prompt for unauthenticated users
 *
 * @returns {JSX.Element} Rendered homepage
 */
export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { currentClubId, loading: clubLoading } = useUserClubs();

  useEffect(() => {
    // If user has a club assignment, redirect to club dashboard
    if (!clubLoading && currentClubId) {
      router.push(`/club/${currentClubId}`);
    }
  }, [currentClubId, clubLoading, router]);

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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Locomotive House
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Manage your club appointments, addresses, and team members all in
              one place.
            </p>
            <p className="text-gray-600 mb-8">
              Sign in to get started or ask an administrator for a club invite
              link.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // User signed in - use ClubGuard to handle club assignment and loading states
  return (
    <ClubGuard isContentLoading={clubLoading}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
      </div>
    </ClubGuard>
  );
}

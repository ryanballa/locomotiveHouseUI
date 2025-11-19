"use client";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";

/**
 * Homepage for Locomotive House application
 *
 * Features:
 * - Club landing page
 * - Redirects to club page is not authenticated
 * - Sign in prompt for unauthenticated users
 *
 * @returns {JSX.Element} Rendered homepage
 */
export default function ClubHome() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return (
      // Loading authentication state
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg max-w-md">
          <h2 className="text-lg font-semibold mb-2">
            Club Assignment Required
          </h2>
          <p className="text-sm mb-4">
            You need to be assigned to a club to access Locomotive House. Please
            contact an administrator or ask for a club invite link.
          </p>
          <p className="text-sm">
            If you have an invite link, visit it to join a club.
          </p>
        </div>
      </main>
    </div>
  );
}

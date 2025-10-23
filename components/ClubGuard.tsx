import { useClubCheck } from "@/hooks/useClubCheck";
import { Navbar } from "@/components/navbar";

interface ClubGuardProps {
  children: React.ReactNode;
}

/**
 * Component that wraps club-dependent pages and ensures user has a club assignment
 * Shows loading state while checking club assignment
 * Shows message if user is not assigned to a club
 * Only renders children if user has a club
 */
export function ClubGuard({ children }: ClubGuardProps) {
  const { hasClub, loading } = useClubCheck();

  if (loading) {
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

  if (!hasClub) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Club Assignment Required</h2>
            <p className="text-sm">
              You need to be assigned to a club to access this feature. Please contact an administrator to assign you to a club.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}

import { useClubCheck } from "@/hooks/useClubCheck";
import { Navbar } from "@/components/navbar";

interface ClubGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that protects club-scoped pages.
 *
 * Ensures user has a club assignment OR is a super admin before rendering content.
 * Super admins (permission level 3) bypass club restrictions and can access all features.
 *
 * @param props - Component props
 * @param props.children - Content to render if user has club access
 *
 * @returns Rendered children if user has access, otherwise shows loading/error state
 *
 * Behavior:
 * - **Loading**: Shows loading spinner while checking club assignment
 * - **No club & not super admin**: Shows message requesting club assignment
 * - **Has club OR super admin**: Renders children normally
 *
 * @example
 * ```typescript
 * export default function ClubAppointmentsPage() {
 *   return (
 *     <ClubGuard>
 *       <AppointmentsList />
 *     </ClubGuard>
 *   );
 * }
 *
 * // Users with assigned club can access
 * // Super admins can access all club features
 * // Other users see "Club Assignment Required" message
 * ```
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

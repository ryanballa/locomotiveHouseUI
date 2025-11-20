"use client";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { useClub } from "@/hooks/useClub";
import { useClubIssuesGrouped } from "@/hooks/useClubIssuesGrouped";
import { useClubAddresses } from "@/hooks/useClubAddresses";
import { useClubMembers } from "@/hooks/useClubMembers";
import { useClubAppointments } from "@/hooks/useClubAppointments";
import { TowerIssuesCard } from "@/components/TowerIssuesCard";
import { RecentAddressesCard } from "@/components/RecentAddressesCard";
import { ClubMembersCard } from "@/components/ClubMembersCard";
import { ScheduledVisitsCard } from "@/components/ScheduledVisitsCard";

/**
 * Homepage for Locomotive House application
 *
 * Features:
 * - Club landing page
 * - Shows error if a user is not assigned to a club
 * - Sign in prompt for unauthenticated users
 *
 * @returns {JSX.Element} Rendered homepage
 */
export default function ClubHome() {
  const params = useParams();
  const clubId = params.id as string;
  const { club, loading, error } = useClub(clubId);
  const { issuesByTower, loading: issuesLoading, error: issuesError } = useClubIssuesGrouped(clubId);
  const { addresses, loading: addressesLoading, error: addressesError } = useClubAddresses(clubId);
  const { memberCount, loading: membersLoading, error: membersError } = useClubMembers(clubId);
  const { appointmentsByDate, loading: appointmentsLoading, error: appointmentsError } = useClubAppointments(clubId);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm font-medium text-red-800">{error}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <ClubGuard isContentLoading={loading || !club}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">{club?.name}</h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ClubMembersCard
              memberCount={memberCount}
              loading={membersLoading}
              error={membersError}
            />
            <ScheduledVisitsCard
              appointmentsByDate={appointmentsByDate}
              loading={appointmentsLoading}
              error={appointmentsError}
            />
            <TowerIssuesCard
              issuesByTower={issuesByTower}
              loading={issuesLoading}
              error={issuesError}
            />
            <RecentAddressesCard
              addresses={addresses}
              loading={addressesLoading}
              error={addressesError}
            />
          </div>
            </>
          )}
        </main>
      </div>
    </ClubGuard>
  );
}

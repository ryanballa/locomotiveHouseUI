"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { useClub } from "@/hooks/useClub";
import { useClubIssuesGrouped } from "@/hooks/useClubIssuesGrouped";
import { useClubAddresses } from "@/hooks/useClubAddresses";
import { TowerIssuesCard } from "@/components/TowerIssuesCard";
import { RecentAddressesCard } from "@/components/RecentAddressesCard";
import { ClubNoticesCard } from "@/components/ClubNoticesCard";
import { ScheduledVisitsCard } from "@/components/ScheduledVisitsCard";
import { ClubHeader } from "@/components/ClubHeader";

/**
 * Homepage for Locomotive House application
 *
 * Features:
 * - Club landing page (password protected)
 * - Shows error if a user is not assigned to a club
 * - Redirects unauthenticated users to /club/:id/public
 *
 * @returns {JSX.Element} Rendered homepage
 */
export default function ClubHome() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const clubId = params.id as string;
  const { club, loading, error } = useClub(clubId);
  const {
    issuesByTower,
    loading: issuesLoading,
    error: issuesError,
  } = useClubIssuesGrouped(clubId);
  const {
    addresses,
    loading: addressesLoading,
    error: addressesError,
  } = useClubAddresses(clubId);

  // Redirect unauthenticated users to public page
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/club/${clubId}/public`);
    }
  }, [isLoaded, isSignedIn, clubId, router]);

  return (
    <ClubGuard isContentLoading={loading || !club}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error || !club ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm font-medium text-red-800">
                {error || "Club not found"}
              </div>
            </div>
          ) : (
            <>
              {/* Club Header */}
              <ClubHeader club={club} />

              {/* Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ClubNoticesCard clubId={clubId} />
                <ScheduledVisitsCard
                  clubId={clubId}
                  shouldShowViewLink={true}
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

"use client";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { useClub } from "@/hooks/useClub";
import { ScheduledVisitsCard } from "@/components/ScheduledVisitsCard";

/**
 * Public club page for Locomotive House application
 *
 * Features:
 * - Publicly accessible club information (no authentication required)
 * - Shows only scheduled sessions
 * - No club membership data, issues, or member information
 *
 * @returns {JSX.Element} Rendered public club page
 */
export default function PublicClubPage() {
  const params = useParams();
  const clubId = params.id as string;
  const { club, loading, error } = useClub(clubId);

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

  if (error || !club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm font-medium text-red-800">
              {error || "Club not found"}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{club.name}</h1>

        <div className="max-w-2xl">
          <ScheduledVisitsCard clubId={clubId} shouldShowViewLink={false} />
        </div>
      </main>
    </div>
  );
}

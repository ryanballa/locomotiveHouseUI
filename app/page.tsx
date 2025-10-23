"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClubCheck } from "@/hooks/useClubCheck";
import { ClubGuard } from "@/components/ClubGuard";
import { Navbar } from "@/components/navbar";

function HomeContent() {
  const router = useRouter();
  const { clubId, loading } = useClubCheck();

  useEffect(() => {
    if (!loading && clubId) {
      // Redirect to the club's appointments page
      router.push(`/club/${clubId}/appointments`);
    }
  }, [clubId, loading, router]);

  // Show loading state while checking club assignment
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

export default function Home() {
  return (
    <ClubGuard>
      <HomeContent />
    </ClubGuard>
  );
}

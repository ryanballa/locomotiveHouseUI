"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Club, type User, type Notice } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { NoticesSection } from "@/components/NoticesSection";

function ClubDetailPageContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [token, setToken] = useState<string>("");

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = await getToken();
      if (!authToken) {
        setError("Authentication required");
        return;
      }
      setToken(authToken);

      // Fetch club details and notices in parallel
      const [clubData, noticesData] = await Promise.all([
        apiClient.getClubById(clubId, authToken),
        apiClient.getNoticesByClubId(clubId, authToken),
      ]);

      setClub(clubData);
      setNotices(noticesData);

      // Find current user by matching Clerk ID
      if (clerkUser?.id) {
        try {
          const clubUsers = await apiClient.getClubUsers(clubId, authToken);
          const clubUsersList: User[] = [];
          for (const item of clubUsers) {
            const userItem = (item as any).user;
            if (userItem) {
              clubUsersList.push(userItem);
            }
          }
          const matchedUser = clubUsersList.find((u) => u.token === clerkUser.id);
          if (matchedUser) {
            setCurrentUser(matchedUser);
          }
        } catch (err) {
          console.error("Failed to fetch current user:", err);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load club details";
      console.error("Error fetching club details:", err);
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to view club details.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
          <button
            onClick={() => router.push("/admin/clubs")}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Clubs
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Club not found"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/admin/clubs")}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Clubs
        </button>

        {/* Club Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{club.name}</h1>
          <p className="text-gray-600 mb-4">Club ID: {club.id}</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/users`)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center gap-2"
            >
              <span>👥</span> Manage Users
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/towers`)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition focus:outline-none focus:ring-2 focus:ring-orange-500 inline-flex items-center gap-2"
            >
              <span>🏗️</span> Manage Towers
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/reports`)}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition focus:outline-none focus:ring-2 focus:ring-teal-500 inline-flex items-center gap-2"
            >
              <span>📊</span> Manage Reports
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/sessions`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 inline-flex items-center gap-2"
            >
              <span>📅</span> Manage Sessions
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/invites`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500 inline-flex items-center gap-2"
            >
              <span>🔗</span> Manage Invites
            </button>
            <button
              onClick={() => router.push(`/admin/clubs/${club.id}/applications`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 inline-flex items-center gap-2"
            >
              <span>📝</span> View Applications
            </button>
          </div>
        </div>

        {/* Notices Section */}
        {token && (
          <div className="mt-8">
            <NoticesSection
              clubId={clubId}
              notices={notices}
              token={token}
              onNoticesUpdate={setNotices}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClubDetailPage() {
  return (
    <AdminGuard>
      <ClubDetailPageContent />
    </AdminGuard>
  );
}

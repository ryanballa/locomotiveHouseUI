"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import DOMPurify from "dompurify";
import { apiClient, type Notice } from "@/lib/api";

interface ClubNoticesCardProps {
  clubId: string;
}

/**
 * Displays active club notices on the dashboard
 * Shows notices that haven't expired, with formatted content
 */
export function ClubNoticesCard({ clubId }: ClubNoticesCardProps) {
  const { getToken } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const noticesData = await apiClient.getNoticesByClubId(
          parseInt(clubId),
          token || undefined
        );

        // Filter out expired notices and sort by updated_at descending
        const activeNotices = noticesData
          .filter((notice) => {
            if (!notice.expires_at) return true;
            const expiresAt = new Date(notice.expires_at);
            return expiresAt > new Date();
          })
          .sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA; // Newest first
          });

        setNotices(activeNotices);
      } catch (err) {
        console.error("Failed to fetch notices:", err);
        setError(err instanceof Error ? err.message : "Failed to load notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, [clubId, getToken]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Club Notices</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Club Notices</h2>
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Club Notices</h2>
        <p className="text-gray-500 text-center py-8">No active notices</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Club Notices</h2>
      <div className="space-y-4">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                {notice.type && (
                  <span className="inline-block px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded mb-2">
                    {notice.type}
                  </span>
                )}
              </div>
              {notice.expires_at && (
                <p className="text-xs text-gray-600">
                  Expires:{" "}
                  {new Date(notice.expires_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              )}
            </div>
            <div
              className="text-sm text-gray-800 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(notice.description),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

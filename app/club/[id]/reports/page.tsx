"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { useClub } from "@/hooks/useClub";

interface Tower {
  id: number;
  name: string;
}

interface TowerReport {
  id: number;
  tower_id: number;
  club_id?: number;
  user_id?: number;
  description?: string;
  report_at?: string | Date;
  created_at?: string;
  updated_at?: string;
}

interface ClubUser {
  id: number;
  token: string; // Clerk user ID
  permission: number;
}

interface UserEmailInfo {
  name?: string;
  email?: string;
}

export default function ClubReportsPage() {
  const params = useParams();
  const clubId = params.id as string;
  const { getToken } = useAuth();
  const { club, loading: clubLoading } = useClub(clubId);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [towers, setTowers] = useState<Tower[]>([]);
  const [reports, setReports] = useState<TowerReport[]>([]);
  const [userEmails, setUserEmails] = useState<Map<number, UserEmailInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  // Fetch towers and reports
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();

        // Fetch towers
        const towersData = await apiClient.getTowersByClubId(
          parseInt(clubId),
          token || undefined
        );
        setTowers(towersData);

        // Fetch all reports for the club
        const allReports = await apiClient.getTowerReportsByClubId(
          parseInt(clubId),
          token || undefined
        );
        setReports(allReports);

        // Fetch users for the club
        const clubUsersResponse = await apiClient.getClubUsers(
          parseInt(clubId),
          token || ""
        );

        // Extract Clerk user IDs from the response and fetch their emails from Clerk
        const emailsMap = new Map<number, UserEmailInfo>();

        for (const userItem of clubUsersResponse) {
          const clerkUserId = (userItem as any).user?.token;
          const userId = (userItem as any).user?.id;

          if (clerkUserId && userId) {
            try {
              const clerkUserInfo = await apiClient.getClerkUserInfo(clerkUserId);
              emailsMap.set(userId, clerkUserInfo);
            } catch (err) {
              console.error(`Failed to fetch Clerk info for user ${userId}:`, err);
            }
          }
        }

        setUserEmails(emailsMap);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load reports and towers"
        );
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchData();
    }
  }, [clubId, getToken]);

  // Filter reports by selected month and year
  const filteredReports = reports.filter((report) => {
    if (!report.report_at) return false;
    const reportDate = new Date(report.report_at);
    return (
      reportDate.getMonth() + 1 === selectedMonth &&
      reportDate.getFullYear() === selectedYear
    );
  });

  // Group reports by tower
  const reportsByTower = towers.reduce(
    (acc, tower) => {
      acc[tower.id] = filteredReports.filter(
        (report) => report.tower_id === tower.id
      );
      return acc;
    },
    {} as Record<number, TowerReport[]>
  );

  const formatReportDate = (dateString?: string | Date): string => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ClubGuard isContentLoading={clubLoading}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && !clubLoading ? (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm font-medium text-red-800">{error}</div>
            </div>
          ) : null}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {club?.name || "Club"} Reports
            </h1>
            <p className="text-gray-600">
              View and manage tower reports by month and year
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="month"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Month
                </label>
                <select
                  id="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Year
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reports Display */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : towers.length === 0 ? (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
              <div className="text-sm font-medium text-blue-900">
                No towers found for this club
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {towers.map((tower) => {
                const towerReports = reportsByTower[tower.id] || [];
                return (
                  <div
                    key={tower.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden"
                  >
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {tower.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {towerReports.length} report
                        {towerReports.length !== 1 ? "s" : ""} for{" "}
                        {
                          months.find((m) => m.value === selectedMonth)
                            ?.label
                        }{" "}
                        {selectedYear}
                      </p>
                    </div>

                    {towerReports.length === 0 ? (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500">
                          No reports for this period
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {towerReports.map((report) => {
                          const userInfo = report.user_id
                            ? userEmails.get(report.user_id)
                            : null;
                          return (
                            <div key={report.id} className="px-6 py-4">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {formatReportDate(report.report_at)}
                                </p>
                                {userInfo?.email && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                    {userInfo.email}
                                  </span>
                                )}
                              </div>
                              {report.description && (
                                <p className="text-sm text-gray-700 mt-2">
                                  {report.description}
                                </p>
                              )}
                              {report.created_at && (
                                <p className="text-xs text-gray-500 mt-3">
                                  Created:{" "}
                                  {new Date(report.created_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ClubGuard>
  );
}

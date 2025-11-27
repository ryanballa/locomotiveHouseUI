"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient, type TowerReport, type Tower } from "@/lib/api";
import { useClubTowerReports } from "@/hooks/useTowerReports";

interface TowerWithReports extends Tower {
  reportCount?: number;
}

interface TowerReportsSectionProps {
  clubId: number;
  towers: Tower[];
}

export function TowerReportsSection({ clubId, towers }: TowerReportsSectionProps) {
  const { getToken } = useAuth();
  const { reports: allReports, loading, error, refetch } = useClubTowerReports(clubId);
  const [expandedTowers, setExpandedTowers] = useState<Set<number>>(new Set());
  const [towerReports, setTowerReports] = useState<Record<number, TowerReport[]>>({});
  const [creatingReport, setCreatingReport] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [newReportData, setNewReportData] = useState<Record<number, string>>({});
  const [reportError, setReportError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Organize reports by tower
  useEffect(() => {
    const organized: Record<number, TowerReport[]> = {};
    towers.forEach(tower => {
      organized[tower.id] = [];
    });
    allReports.forEach(report => {
      if (report.tower_id in organized) {
        organized[report.tower_id].push(report);
      }
    });
    setTowerReports(organized);
  }, [allReports, towers]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const user = await apiClient.getCurrentUser(token);
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };
    fetchCurrentUser();
  }, [getToken]);

  const handleCreateReport = async (towerId: number) => {
    try {
      if (!newReportData[towerId]?.trim()) {
        setReportError("Report description is required");
        return;
      }

      if (!currentUserId) {
        setReportError("User information not available");
        return;
      }

      setCreatingReport(true);
      setReportError(null);
      const token = await getToken();
      if (!token) {
        setReportError("Authentication required");
        return;
      }

      const reportPayload = {
        description: newReportData[towerId],
        tower_id: towerId,
        user_id: currentUserId,
      };

      const result = await apiClient.createTowerReport(
        clubId,
        towerId,
        reportPayload,
        token
      );

      if (result.created) {
        setNewReportData(prev => ({
          ...prev,
          [towerId]: "",
        }));
        await refetch();
      } else {
        setReportError("Failed to create report");
      }
    } catch (err) {
      let errorMsg = "Failed to create report";
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMsg = JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      console.error("Error creating report:", err);
      setReportError(errorMsg);
    } finally {
      setCreatingReport(false);
    }
  };

  const handleDeleteReport = async (towerId: number, reportId: number) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      setReportError(null);
      const token = await getToken();
      if (!token) {
        setReportError("Authentication required");
        return;
      }

      const result = await apiClient.deleteTowerReport(
        clubId,
        towerId,
        reportId,
        token
      );

      if (result.deleted) {
        await refetch();
      } else {
        setReportError("Failed to delete report");
      }
    } catch (err) {
      let errorMsg = "Failed to delete report";
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "object" && err !== null) {
        errorMsg = JSON.stringify(err);
      } else {
        errorMsg = String(err);
      }
      console.error("Error deleting report:", err);
      setReportError(errorMsg);
    } finally {
      setDeletingReportId(null);
    }
  };

  const toggleTowerExpanded = (towerId: number) => {
    setExpandedTowers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(towerId)) {
        newSet.delete(towerId);
      } else {
        newSet.add(towerId);
      }
      return newSet;
    });
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return "N/A";
    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      return date.toLocaleString();
    } catch {
      return String(dateValue);
    }
  };

  const formatDescription = (description?: string) => {
    return description || "No description provided";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Tower Reports</h2>
        </div>
        <div className="p-8 text-center">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">Tower Reports</h2>
        <p className="text-gray-600 text-sm mt-1">
          View and manage reports for each tower in this club
        </p>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {reportError && (
        <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-200">
          <p className="text-yellow-700 text-sm">{reportError}</p>
        </div>
      )}

      {towers.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500 text-lg">No towers created yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {towers.map(tower => {
            const reports = towerReports[tower.id] || [];
            const isExpanded = expandedTowers.has(tower.id);

            return (
              <div key={tower.id} className="p-6">
                <button
                  onClick={() => toggleTowerExpanded(tower.id)}
                  className="w-full text-left flex items-center justify-between hover:bg-gray-50 p-3 rounded-lg transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`transform transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                      ▶
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tower.name}
                      </h3>
                      {tower.description && (
                        <p className="text-sm text-gray-600">{tower.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {reports.length} {reports.length === 1 ? "report" : "reports"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pl-12 space-y-4">
                    {/* Create New Report Form */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Report Description
                      </label>
                      <textarea
                        value={newReportData[tower.id] || ""}
                        onChange={(e) =>
                          setNewReportData(prev => ({
                            ...prev,
                            [tower.id]: e.target.value,
                          }))
                        }
                        placeholder="Enter report description"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={() => handleCreateReport(tower.id)}
                        disabled={creatingReport}
                        className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingReport ? "Creating..." : "Create Report"}
                      </button>
                    </div>

                    {/* Reports List */}
                    {reports.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No reports for this tower yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reports.map(report => (
                          <div
                            key={report.id}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-gray-500 uppercase">
                                    Report #{report.id}
                                  </span>
                                  {report.user_id && (
                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                      User ID: {report.user_id}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 mb-3">
                                  {report.report_at && (
                                    <>Report at: {formatDate(report.report_at)}</>
                                  )}
                                  {report.created_at && (
                                    <>
                                      {report.report_at && " • "}
                                      Created: {formatDate(report.created_at)}
                                    </>
                                  )}
                                </div>
                                <div className="bg-white border border-gray-300 rounded p-3 text-sm text-gray-700 break-words max-h-64 overflow-y-auto">
                                  {formatDescription(report.description)}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteReport(tower.id, report.id)}
                                disabled={deletingReportId === report.id}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                              >
                                {deletingReportId === report.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

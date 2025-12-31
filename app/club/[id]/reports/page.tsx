"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient, type Club, type TowerReport, type Tower, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { ClubGuard } from "@/components/ClubGuard";
import { useClubTowerReports } from "@/hooks/useTowerReports";

interface ReportModalData {
  description: string;
  tower_id: number;
  month: number;
  year: number;
}

function ClubReportsPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = Number(params.id);

  const [club, setClub] = useState<Club | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Filter state
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<TowerReport | null>(null);
  const [modalFormData, setModalFormData] = useState<ReportModalData>({
    description: "",
    tower_id: 0,
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);

  const { reports: allReports, loading: reportsLoading, error: reportsError, refetch } = useClubTowerReports(clubId);

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    fetchData();
  }, [clubId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const [clubData, towersData, userData] = await Promise.all([
        apiClient.getClubById(clubId, token),
        apiClient.getTowersByClubId(clubId, token),
        apiClient.getCurrentUser(token),
      ]);

      setClub(clubData);
      setTowers(towersData);
      if (userData) {
        setCurrentUserId(userData.id);
      }

      // Fetch club users
      try {
        const clubUsers = await apiClient.getClubUsers(clubId, token);
        const clubUsersList: User[] = [];
        for (const item of clubUsers) {
          const userItem = (item as any).user;
          if (userItem) {
            clubUsersList.push(userItem);
          }
        }
        setUsers(clubUsersList);
      } catch (err) {
        console.error("Failed to fetch club users:", err);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      console.error("Error fetching data:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-opening the modal from URL parameters
  useEffect(() => {
    const action = searchParams.get("action");
    const towerIdParam = searchParams.get("towerId");

    if (action === "new" && towerIdParam && towers.length > 0) {
      const towerId = parseInt(towerIdParam);
      const tower = towers.find((t) => t.id === towerId);

      if (tower) {
        const now = new Date();

        // Get month and year from query params, or default to current date
        const monthParam = searchParams.get("month");
        const yearParam = searchParams.get("year");

        // Convert month from 1-indexed (URL parameter) to 0-indexed (JavaScript Date)
        const month = monthParam ? parseInt(monthParam) - 1 : now.getMonth();
        const year = yearParam ? parseInt(yearParam) : now.getFullYear();

        // Open the add modal with the specified tower pre-selected
        setModalFormData({
          description: "",
          tower_id: towerId,
          month: month,
          year: year,
        });
        setIsAddModalOpen(true);

        // Clean up the URL parameters
        const newUrl = `/club/${clubId}/reports`;
        router.replace(newUrl);
      }
    }
  }, [searchParams, towers, clubId, router]);

  // Filter reports by selected month and year
  const filteredReports = allReports.filter((report) => {
    const reportDate = new Date(report.report_at || report.created_at || "");
    return (
      reportDate.getMonth() === selectedMonth &&
      reportDate.getFullYear() === selectedYear
    );
  });

  // Sort by date, most recent first
  const sortedReports = [...filteredReports].sort((a, b) => {
    const dateA = new Date(a.report_at || a.created_at || "").getTime();
    const dateB = new Date(b.report_at || b.created_at || "").getTime();
    return dateB - dateA;
  });

  const handleSetCurrentMonth = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const handleSetNextMonth = () => {
    if (selectedMonth === 11) {
      // December -> January of next year
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const openAddModal = () => {
    const now = new Date();
    setModalFormData({
      description: "",
      tower_id: towers.length > 0 ? towers[0].id : 0,
      month: now.getMonth(),
      year: now.getFullYear(),
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (report: TowerReport) => {
    setEditingReport(report);

    // Extract month and year from the report date
    const reportDate = new Date(report.report_at || report.created_at || new Date());

    setModalFormData({
      description: report.description || "",
      tower_id: report.tower_id,
      month: reportDate.getMonth(),
      year: reportDate.getFullYear(),
    });
    setIsEditModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingReport(null);
    const now = new Date();
    setModalFormData({
      description: "",
      tower_id: 0,
      month: now.getMonth(),
      year: now.getFullYear(),
    });
  };

  const handleCreateReport = async () => {
    try {
      if (!modalFormData.description.trim()) {
        setError("Report description is required");
        return;
      }

      if (!modalFormData.tower_id) {
        setError("Please select a tower");
        return;
      }

      if (!currentUserId) {
        setError("User information not available");
        return;
      }

      // Check if a report already exists for this tower and month/year combination
      const duplicateReport = allReports.find((report) => {
        const reportDate = new Date(report.report_at || report.created_at || "");
        return (
          report.tower_id === modalFormData.tower_id &&
          reportDate.getMonth() === modalFormData.month &&
          reportDate.getFullYear() === modalFormData.year
        );
      });

      if (duplicateReport) {
        const towerName = getTowerName(modalFormData.tower_id);
        const monthName = months[modalFormData.month];
        setError(
          `A report for ${towerName} already exists for ${monthName} ${modalFormData.year}. Please select a different month/year or edit the existing report.`
        );
        return;
      }

      setSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Create a date from the selected month and year (set to the 1st day)
      const reportDate = new Date(modalFormData.year, modalFormData.month, 1);

      const reportPayload = {
        description: modalFormData.description,
        tower_id: modalFormData.tower_id,
        user_id: currentUserId,
        report_at: reportDate.toISOString(),
      };

      const result = await apiClient.createTowerReport(
        clubId,
        modalFormData.tower_id,
        reportPayload,
        token
      );

      if (result.created) {
        closeModals();
        await refetch();
      } else {
        setError("Failed to create report");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create report";
      console.error("Error creating report:", err);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateReport = async () => {
    if (!editingReport) return;

    try {
      if (!modalFormData.description.trim()) {
        setError("Report description is required");
        return;
      }

      setSubmitting(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const updatePayload = {
        description: modalFormData.description,
      };

      const result = await apiClient.updateTowerReport(
        clubId,
        editingReport.tower_id,
        editingReport.id,
        updatePayload,
        token
      );

      if (result.updated) {
        closeModals();
        await refetch();
      } else {
        setError("Failed to update report");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update report";
      console.error("Error updating report:", err);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async (towerId: number, reportId: number) => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      setDeletingReportId(reportId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
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
        setError("Failed to delete report");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete report";
      console.error("Error deleting report:", err);
      setError(errorMsg);
    } finally {
      setDeletingReportId(null);
    }
  };

  const getTowerName = (towerId: number): string => {
    const tower = towers.find((t) => t.id === towerId);
    return tower ? tower.name : `Tower ${towerId}`;
  };

  const getUserName = (userId?: number): string => {
    if (!userId) return "-";
    const user = users.find((u) => u.id === userId);
    if (!user) return `User ${userId}`;

    // Try to build a full name from available fields
    const nameParts = [];
    if (user.first_name) nameParts.push(user.first_name);
    if (user.last_name) nameParts.push(user.last_name);

    if (nameParts.length > 0) {
      return nameParts.join(" ");
    }

    // Fallback to email or ID
    return user.email || `User ${userId}`;
  };

  const formatDate = (dateValue?: string | Date) => {
    if (!dateValue) return "N/A";
    try {
      const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateValue);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate year options (2 years forward and 5 years back from current year)
  const currentYear = currentDate.getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear + 2 - i);

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

  if (error && !club) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.push(`/club/${clubId}`)}
            className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Club
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
        <button
          onClick={() => router.push(`/club/${clubId}`)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Club
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tower Reports</h1>
          <p className="text-gray-600">{club?.name}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Filters and Actions */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSetCurrentMonth}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Current Month
              </button>

              <button
                onClick={handleSetNextMonth}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next Month
              </button>

              <div className="ml-auto">
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center gap-2"
                >
                  <span>+</span> Add Report
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Showing {sortedReports.length} report{sortedReports.length !== 1 ? "s" : ""} for {months[selectedMonth]} {selectedYear}
            </div>
          </div>

          {/* Reports Table */}
          {reportsLoading ? (
            <div className="p-8 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            </div>
          ) : sortedReports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                No reports found for {months[selectedMonth]} {selectedYear}.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tower
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{report.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTowerName(report.tower_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(report.report_at || report.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-md">
                        <div className="line-clamp-2">
                          {report.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getUserName(report.user_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openEditModal(report)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.tower_id, report.id)}
                          disabled={deletingReportId === report.id}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingReportId === report.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Report Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Add Tower Report</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tower <span className="text-red-600">*</span>
                </label>
                <select
                  value={modalFormData.tower_id}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, tower_id: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>Select a tower</option>
                  {towers.map((tower) => (
                    <option key={tower.id} value={tower.id}>
                      {tower.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={modalFormData.month}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, month: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={modalFormData.year}
                    onChange={(e) =>
                      setModalFormData({ ...modalFormData, year: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={modalFormData.description}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, description: e.target.value })
                  }
                  placeholder="Enter report description"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModals}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating..." : "Create Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {isEditModalOpen && editingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Tower Report</h2>
              <p className="text-sm text-gray-600 mt-1">
                Report #{editingReport.id} - {getTowerName(editingReport.tower_id)}
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tower
                </label>
                <input
                  type="text"
                  value={getTowerName(editingReport.tower_id)}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-500 bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Tower cannot be changed when editing</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={modalFormData.description}
                  onChange={(e) =>
                    setModalFormData({ ...modalFormData, description: e.target.value })
                  }
                  placeholder="Enter report description"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModals}
                disabled={submitting}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReport}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Updating..." : "Update Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubReportsPage() {
  return (
    <ClubGuard>
      <ClubReportsPageContent />
    </ClubGuard>
  );
}

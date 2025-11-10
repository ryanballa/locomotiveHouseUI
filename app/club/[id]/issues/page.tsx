"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { apiClient, type Issue, type IssueStatus, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { IssueTable } from "@/components/IssueTable";

interface EnrichedIssue extends Issue {
  clubId?: number;
  clubName?: string;
  towerName?: string;
}

export default function ClubIssuesPage() {
  const params = useParams();
  const clubId = Number(params.id);

  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [club, setClub] = useState<{ id: number; name: string } | null>(null);
  const [allIssues, setAllIssues] = useState<EnrichedIssue[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editingIssue, setEditingIssue] = useState<EnrichedIssue | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "",
    description: "",
    status: "Open" as IssueStatus,
  });

  /**
   * Fetch club details and all issues for this club
   */
  const fetchClubAndIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // Fetch club, issues for this club, and current user in parallel
      const [clubs, allClubIssues, usersData] = await Promise.all([
        apiClient.getClubs(token),
        apiClient.getIssuesByClubId(clubId, token),
        apiClient.getUsers(token),
      ]);

      const clubData = clubs.find((c) => c.id === clubId);
      if (!clubData) {
        setError("Club not found");
        return;
      }

      setClub(clubData);
      setAllIssues(allClubIssues);

      // Find current user by matching Clerk ID
      if (clerkUser?.id && usersData.length > 0) {
        const matchedUser = usersData.find((u) => u.token === clerkUser.id);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load issues";
      console.error("Error fetching club issues:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an issue
   */
  const handleDeleteIssue = async (issue: EnrichedIssue) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }

    try {
      setDeletingIssueId(issue.id);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteIssue(
        clubId,
        issue.tower_id,
        issue.id,
        token
      );

      if (result.deleted) {
        await fetchClubAndIssues();
      } else {
        setError("Failed to delete issue");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete issue";
      console.error("Error deleting issue:", err);
      setError(errorMsg);
    } finally {
      setDeletingIssueId(null);
    }
  };

  /**
   * Start editing an issue
   */
  const handleEditIssue = (issue: EnrichedIssue) => {
    setEditingIssue(issue);
    setEditingIssueId(issue.id);
    setEditFormData({
      title: issue.title,
      type: issue.type,
      description: issue.description || "",
      status: issue.status,
    });
    setShowEditForm(true);
  };

  /**
   * Save issue changes
   */
  const handleSaveIssue = async () => {
    try {
      if (!editingIssue) {
        setError("Issue information missing");
        return;
      }

      if (!editFormData.title.trim() || !editFormData.type.trim()) {
        setError("Title and type are required");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateIssue(
        clubId,
        editingIssue.tower_id,
        editingIssue.id,
        editFormData,
        token
      );

      if (result.updated) {
        await fetchClubAndIssues();
        setShowEditForm(false);
        setEditingIssue(null);
      } else {
        setError("Failed to update issue");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update issue";
      console.error("Error updating issue:", err);
      setError(errorMsg);
    } finally {
      setEditingIssueId(null);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchClubAndIssues();
    }
  }, [isSignedIn, clubId]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Issues {club && `for ${club.name}`}
          </h1>
          <p className="text-gray-600">
            View and manage issues for {club?.name}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Issues Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Issues ({allIssues.length})
            </h2>
          </div>

          {/* Edit Form Modal */}
          {showEditForm && editingIssue && (
            <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, title: e.target.value })
                      }
                      placeholder="Enter issue title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <input
                      type="text"
                      value={editFormData.type}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, type: e.target.value })
                      }
                      placeholder="e.g., Maintenance, Bug, Feature"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter issue description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        status: e.target.value as IssueStatus,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveIssue}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingIssue(null);
                    }}
                    className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Issues Table */}
          {allIssues.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No issues found.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tower
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {issue.towerName || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {issue.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {issue.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-white font-medium ${
                          issue.status === "Open"
                            ? "bg-blue-500"
                            : issue.status === "In Progress"
                            ? "bg-yellow-500"
                            : issue.status === "Done"
                            ? "bg-green-500"
                            : "bg-gray-500"
                        }`}
                      >
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {issue.description || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditIssue(issue)}
                        disabled={editingIssueId !== null}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteIssue(issue)}
                        disabled={deletingIssueId === issue.id}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingIssueId === issue.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { apiClient, type Issue, type IssueStatus, type User, type Tower } from "@/lib/api";
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
  const [towers, setTowers] = useState<Tower[]>([]);
  const [towerIssues, setTowerIssues] = useState<Record<number, Issue[]>>({});
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
   * Fetch club details, towers, and all issues for this club
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

      // Fetch club, towers, and current user in parallel
      const [clubs, towersData, usersData] = await Promise.all([
        apiClient.getClubs(token),
        apiClient.getTowersByClubId(clubId, token),
        apiClient.getUsers(token),
      ]);

      const clubData = clubs.find((c) => c.id === clubId);
      if (!clubData) {
        setError("Club not found");
        return;
      }

      setClub(clubData);
      setTowers(towersData);

      // Fetch issues for each tower
      const issuesByTower: Record<number, Issue[]> = {};
      for (const tower of towersData) {
        const issues = await apiClient.getIssuesByTowerId(clubId, tower.id, token);
        issuesByTower[tower.id] = issues;
      }
      setTowerIssues(issuesByTower);

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

        {/* Edit Form Modal - Shared across all towers */}
        {showEditForm && editingIssue && (
          <div className="mb-6 bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Issue</h3>
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

        {/* Issues by Tower */}
        {towers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">No towers found for this club.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {towers.map((tower) => {
              const issuesForTower = towerIssues[tower.id] || [];
              return (
                <div key={tower.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Tower Header */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900">
                      {tower.name} ({issuesForTower.length})
                    </h3>
                    {tower.description && (
                      <p className="text-gray-600 text-sm mt-1">{tower.description}</p>
                    )}
                  </div>

                  {/* Tower Issues Table */}
                  {issuesForTower.length === 0 ? (
                    <div className="px-6 py-8 text-center">
                      <p className="text-gray-500">No issues for this tower.</p>
                    </div>
                  ) : (
                    <IssueTable
                      issues={issuesForTower}
                      onEdit={(issue) =>
                        handleEditIssue({
                          ...issue,
                          towerName: tower.name,
                        } as EnrichedIssue)
                      }
                      onDelete={(issueId) => {
                        const issue = issuesForTower.find((i) => i.id === issueId);
                        if (issue) {
                          handleDeleteIssue({
                            ...issue,
                            towerName: tower.name,
                          } as EnrichedIssue);
                        }
                      }}
                      deletingIssueId={deletingIssueId}
                      editingIssueId={editingIssueId}
                      towerName={tower.name}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

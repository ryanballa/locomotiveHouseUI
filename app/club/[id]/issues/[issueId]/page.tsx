"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient, type Issue, type IssueStatus, type User, type Tower } from "@/lib/api";
import { Navbar } from "@/components/navbar";

interface IssueDetailsProps {
  id: number;
  tower_id: number;
  user_id: number;
  title: string;
  type: string;
  description?: string;
  status: IssueStatus;
  created_at?: string;
  updated_at?: string;
  towerName?: string;
}

export default function IssueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);
  const issueId = Number(params.issueId);

  const { getToken, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const [issue, setIssue] = useState<IssueDetailsProps | null>(null);
  const [tower, setTower] = useState<Tower | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "",
    description: "",
    status: "Open" as IssueStatus,
  });

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      // First, we need to find the tower that contains this issue
      // We'll iterate through towers to find the one with this issue
      const towers = await apiClient.getTowersByClubId(clubId, token);

      let foundIssue: Issue | null = null;
      let foundTower: Tower | null = null;

      for (const towerData of towers) {
        const towerIssues = await apiClient.getIssuesByTowerId(clubId, towerData.id, token);
        const matchedIssue = towerIssues.find((i) => i.id === issueId);
        if (matchedIssue) {
          foundIssue = matchedIssue;
          foundTower = towerData;
          break;
        }
      }

      if (!foundIssue || !foundTower) {
        setError("Issue not found");
        return;
      }

      setIssue({
        ...foundIssue,
        towerName: foundTower.name,
      });
      setTower(foundTower);

      // Fetch user details
      const users = await apiClient.getUsers(token);
      const issueUser = users.find((u) => u.id === foundIssue.user_id);
      if (issueUser) {
        setUser(issueUser);
      }

      // Initialize form data
      setEditFormData({
        title: foundIssue.title,
        type: foundIssue.type,
        description: foundIssue.description || "",
        status: foundIssue.status,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load issue details";
      console.error("Error fetching issue:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIssue = async () => {
    try {
      if (!issue) {
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
        issue.tower_id,
        issue.id,
        editFormData,
        token
      );

      if (result.updated) {
        await fetchIssueDetails();
        setIsEditing(false);
      } else {
        setError("Failed to update issue");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update issue";
      console.error("Error updating issue:", err);
      setError(errorMsg);
    }
  };

  const handleDeleteIssue = async () => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }

    try {
      if (!issue) {
        setError("Issue information missing");
        return;
      }

      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteIssue(clubId, issue.tower_id, issue.id, token);

      if (result.deleted) {
        router.push(`/club/${clubId}/issues`);
      } else {
        setError("Failed to delete issue");
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete issue";
      console.error("Error deleting issue:", err);
      setError(errorMsg);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchIssueDetails();
    }
  }, [isSignedIn, clubId, issueId]);

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

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600">{error || "Issue not found"}</p>
            <Link
              href={`/club/${clubId}/issues`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Issues
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusColors = {
    Open: "bg-blue-100 text-blue-800 border-blue-300",
    "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-300",
    Done: "bg-green-100 text-green-800 border-green-300",
    Closed: "bg-gray-100 text-gray-800 border-gray-300",
  };

  const statusBadgeColors = {
    Open: "bg-blue-500",
    "In Progress": "bg-yellow-500",
    Done: "bg-green-500",
    Closed: "bg-gray-500",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button and Header */}
        <div className="mb-6">
          <Link
            href={`/club/${clubId}/issues`}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Issues
          </Link>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, title: e.target.value })
                    }
                    className="w-full text-4xl font-bold text-gray-900 mb-2 border-2 border-blue-500 rounded px-3 py-2"
                  />
                ) : (
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{issue.title}</h1>
                )}
                <p className="text-gray-600">Issue #{issue.id}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-white font-semibold ${
                  statusBadgeColors[issue.status as keyof typeof statusBadgeColors]
                }`}
              >
                {issue.status}
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="col-span-2">
            {/* Description Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              {isEditing ? (
                <textarea
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap">
                  {issue.description || "No description provided"}
                </p>
              )}
            </div>

            {/* Type Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Type</h2>
              {isEditing ? (
                <input
                  type="text"
                  value={editFormData.type}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, type: e.target.value })
                  }
                  placeholder="e.g., Maintenance, Bug, Feature"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-700 font-semibold">{issue.type}</p>
              )}
            </div>

            {/* Status Section (when editing) */}
            {isEditing && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Status</h2>
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
            )}
          </div>

          {/* Right Column - Metadata */}
          <div>
            {/* Issue Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>

              {/* Status */}
              {!isEditing && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${
                      statusColors[issue.status as keyof typeof statusColors]
                    }`}
                  >
                    {issue.status}
                  </span>
                </div>
              )}

              {/* Tower */}
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Tower</p>
                <p className="text-gray-900 font-semibold">{issue.towerName || "-"}</p>
              </div>

              {/* Created By */}
              {user && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Created By</p>
                  <p className="text-gray-900 font-semibold">{user.name || user.email || "Unknown"}</p>
                </div>
              )}

              {/* Created Date */}
              {issue.created_at && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(issue.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Updated Date */}
              {issue.updated_at && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-500 mb-1">Updated</p>
                  <p className="text-gray-900 text-sm">
                    {new Date(issue.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveIssue}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="w-full px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteIssue}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

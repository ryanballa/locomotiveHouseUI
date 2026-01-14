"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Tower, type Issue, type IssueStatus, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { IssueTable } from "@/components/IssueTable";

function ClubTowersPageContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [towers, setTowers] = useState<Tower[]>([]);
  const [towerFormData, setTowerFormData] = useState({
    name: "",
    description: "",
    owner_id: undefined as number | undefined,
  });
  const [editingTowerId, setEditingTowerId] = useState<number | null>(null);
  const [clubUsers, setClubUsers] = useState<User[]>([]);
  const [creatingTower, setCreatingTower] = useState(false);
  const [deletingTowerId, setDeletingTowerId] = useState<number | null>(null);
  const [towerIssues, setTowerIssues] = useState<Record<number, Issue[]>>({});
  const [selectedTowerForIssues, setSelectedTowerForIssues] = useState<number | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueFormData, setIssueFormData] = useState({
    title: "",
    type: "",
    description: "",
    status: "Open" as IssueStatus,
    user_id: 0,
  });
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    if (isAdmin) {
      fetchTowers();
    }
  }, [clubId, isAdmin]);

  const fetchTowers = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = await getToken();
      if (!authToken) {
        setError("Authentication required");
        return;
      }

      const towersData = await apiClient.getTowersByClubId(clubId, authToken);
      setTowers(towersData);

      // Find current user and fetch club users
      if (clerkUser?.id) {
        try {
          const clubUsersData = await apiClient.getClubUsers(clubId, authToken);
          const clubUsersList: User[] = [];
          for (const item of clubUsersData) {
            const userItem = (item as any).user;
            if (userItem) {
              clubUsersList.push(userItem);
            }
          }
          setClubUsers(clubUsersList);

          const matchedUser = clubUsersList.find((u) => u.token === clerkUser.id);
          if (matchedUser) {
            setCurrentUser(matchedUser);
            setIssueFormData((prev) => ({
              ...prev,
              user_id: matchedUser.id,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch current user:", err);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load towers";
      console.error("Error fetching towers:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTower = async () => {
    try {
      if (!towerFormData.name.trim()) {
        setError("Tower name is required");
        return;
      }

      setCreatingTower(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createTower(clubId, towerFormData, token);

      if (result.created) {
        setTowerFormData({ name: "", description: "", owner_id: undefined });
        await fetchTowers();
      } else {
        setError("Failed to create tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create tower";
      console.error("Error creating tower:", err);
      setError(errorMsg);
    } finally {
      setCreatingTower(false);
    }
  };

  const handleUpdateTower = async (towerId: number) => {
    try {
      if (!towerFormData.name.trim()) {
        setError("Tower name is required");
        return;
      }

      setEditingTowerId(towerId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateTower(clubId, towerId, towerFormData, token);

      if (result.updated) {
        setTowerFormData({ name: "", description: "", owner_id: undefined });
        setEditingTowerId(null);
        await fetchTowers();
      } else {
        setError("Failed to update tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update tower";
      console.error("Error updating tower:", err);
      setError(errorMsg);
    } finally {
      setEditingTowerId(null);
    }
  };

  const handleDeleteTower = async (towerId: number) => {
    if (!confirm("Are you sure you want to delete this tower?")) {
      return;
    }

    try {
      setDeletingTowerId(towerId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteTower(clubId, towerId, token);

      if (result.deleted) {
        await fetchTowers();
      } else {
        setError("Failed to delete tower");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete tower";
      console.error("Error deleting tower:", err);
      setError(errorMsg);
    } finally {
      setDeletingTowerId(null);
    }
  };

  const startEditingTower = (tower: Tower) => {
    setTowerFormData({
      name: tower.name,
      description: tower.description || "",
      owner_id: tower.owner_id,
    });
    setEditingTowerId(tower.id);
  };

  const fetchTowerIssues = async (towerId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const issues = await apiClient.getIssuesByTowerId(clubId, towerId, token);
      setTowerIssues((prev) => ({
        ...prev,
        [towerId]: issues,
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to fetch tower issues";
      console.error("Error fetching tower issues:", err);
      setError(errorMsg);
    }
  };

  const handleCreateIssue = async () => {
    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      if (!issueFormData.title.trim() || !issueFormData.type.trim()) {
        setError("Title and type are required");
        return;
      }

      setCreatingIssue(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createIssue(
        clubId,
        selectedTowerForIssues,
        issueFormData,
        token
      );

      if (result.created) {
        await fetchTowerIssues(selectedTowerForIssues);
        setShowIssueForm(false);
        setIssueFormData({
          title: "",
          type: "",
          description: "",
          status: "Open",
          user_id: currentUser?.id || 0,
        });
      } else {
        setError("Failed to create issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create issue";
      console.error("Error creating issue:", err);
      setError(errorMsg);
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleUpdateIssue = async (issueId: number) => {
    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      if (!issueFormData.title.trim() || !issueFormData.type.trim()) {
        setError("Title and type are required");
        return;
      }

      setEditingIssueId(issueId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateIssue(
        clubId,
        selectedTowerForIssues,
        issueId,
        issueFormData,
        token
      );

      if (result.updated) {
        await fetchTowerIssues(selectedTowerForIssues);
        setShowIssueForm(false);
        setIssueFormData({
          title: "",
          type: "",
          description: "",
          status: "Open",
          user_id: currentUser?.id || 0,
        });
      } else {
        setError("Failed to update issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update issue";
      console.error("Error updating issue:", err);
      setError(errorMsg);
    } finally {
      setEditingIssueId(null);
    }
  };

  const handleDeleteIssue = async (issueId: number) => {
    if (!confirm("Are you sure you want to delete this issue?")) {
      return;
    }

    try {
      if (!selectedTowerForIssues) {
        setError("No tower selected");
        return;
      }

      setDeletingIssueId(issueId);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteIssue(
        clubId,
        selectedTowerForIssues,
        issueId,
        token
      );

      if (result.deleted) {
        await fetchTowerIssues(selectedTowerForIssues);
      } else {
        setError("Failed to delete issue");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete issue";
      console.error("Error deleting issue:", err);
      setError(errorMsg);
    } finally {
      setDeletingIssueId(null);
    }
  };

  const startEditingIssue = (issue: Issue) => {
    setEditingIssueId(issue.id);
    setIssueFormData({
      title: issue.title,
      type: issue.type,
      description: issue.description || "",
      status: issue.status,
      user_id: issue.user_id,
    });
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/admin/clubs/${clubId}`)}
          className="mb-6 px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
        >
          <span>&larr;</span> Back to Club Details
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Towers</h1>
          <p className="text-gray-600">Create and manage towers for this club</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Towers Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Towers ({towers.length})
            </h2>
          </div>

          {/* Create/Edit Tower Form */}
          <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tower Name
                </label>
                <input
                  type="text"
                  value={towerFormData.name}
                  onChange={(e) =>
                    setTowerFormData({ ...towerFormData, name: e.target.value })
                  }
                  placeholder="Enter tower name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={towerFormData.description}
                  onChange={(e) =>
                    setTowerFormData({
                      ...towerFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter tower description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner (Optional)
                </label>
                <select
                  value={towerFormData.owner_id || ""}
                  onChange={(e) =>
                    setTowerFormData({
                      ...towerFormData,
                      owner_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No Owner</option>
                  {clubUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.name || user.email || `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                {editingTowerId ? (
                  <>
                    <button
                      onClick={() => handleUpdateTower(editingTowerId)}
                      disabled={editingTowerId === null || creatingTower}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Tower
                    </button>
                    <button
                      onClick={() => {
                        setTowerFormData({ name: "", description: "", owner_id: undefined });
                        setEditingTowerId(null);
                      }}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleCreateTower}
                    disabled={creatingTower}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingTower ? "Creating..." : "Create Tower"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Towers List */}
          {towers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-lg">No towers created yet.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tower ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {towers.map((tower) => {
                  const owner = tower.owner_id
                    ? clubUsers.find((u) => u.id === tower.owner_id)
                    : null;
                  const ownerName = owner
                    ? owner.first_name && owner.last_name
                      ? `${owner.first_name} ${owner.last_name}`
                      : owner.name || owner.email || `User ${owner.id}`
                    : "-";

                  return (
                    <tr key={tower.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tower.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tower.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tower.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {ownerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTowerForIssues(tower.id);
                          if (!towerIssues[tower.id]) {
                            fetchTowerIssues(tower.id);
                          }
                        }}
                        className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        Issues ({towerIssues[tower.id]?.length || 0})
                      </button>
                      <button
                        onClick={() => startEditingTower(tower)}
                        disabled={editingTowerId !== null}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTower(tower.id)}
                        disabled={deletingTowerId === tower.id}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingTowerId === tower.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Issues Modal/Dropdown for Selected Tower */}
        {selectedTowerForIssues && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Tower Issues -{" "}
                {towers.find((t) => t.id === selectedTowerForIssues)?.name} (
                {towerIssues[selectedTowerForIssues]?.length || 0})
              </h2>
              <button
                onClick={() => setSelectedTowerForIssues(null)}
                className="text-gray-600 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Issue Creation/Edit Form */}
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={issueFormData.title}
                      onChange={(e) =>
                        setIssueFormData({ ...issueFormData, title: e.target.value })
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
                      value={issueFormData.type}
                      onChange={(e) =>
                        setIssueFormData({ ...issueFormData, type: e.target.value })
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
                    value={issueFormData.description}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
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
                    value={issueFormData.status}
                    onChange={(e) =>
                      setIssueFormData({
                        ...issueFormData,
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
                  {editingIssueId ? (
                    <>
                      <button
                        onClick={() => handleUpdateIssue(editingIssueId)}
                        disabled={creatingIssue}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Update Issue
                      </button>
                      <button
                        onClick={() => {
                          setEditingIssueId(null);
                          setIssueFormData({
                            title: "",
                            type: "",
                            description: "",
                            status: "Open",
                            user_id: currentUser?.id || 0,
                          });
                        }}
                        className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateIssue}
                      disabled={creatingIssue}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingIssue ? "Creating..." : "Create Issue"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Issues Table */}
            <div className="px-6 py-4">
              {towerIssues[selectedTowerForIssues]?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No issues for this tower yet.
                </div>
              ) : (
                <IssueTable
                  issues={towerIssues[selectedTowerForIssues] || []}
                  onEdit={startEditingIssue}
                  onDelete={handleDeleteIssue}
                  deletingIssueId={deletingIssueId}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClubTowersPage() {
  return (
    <AdminGuard>
      <ClubTowersPageContent />
    </AdminGuard>
  );
}

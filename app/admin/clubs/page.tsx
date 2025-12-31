"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { apiClient, type Club } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";

function AdminClubsPageContent() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hero_image: ""
  });

  const { isAdmin, isSuperAdmin } = useAdminCheck();

  useEffect(() => {
    if (isAdmin) {
      fetchClubs();
    }
  }, [isAdmin]);

  const fetchClubs = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const clubsData = await apiClient.getClubs(token);
      setClubs(clubsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load clubs";
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to manage clubs.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setPageLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!isSuperAdmin) {
      setError("Only Super Admins can create clubs");
      return;
    }

    if (!formData.name.trim()) {
      setError("Club name is required");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createClub({
        name: formData.name,
        description: formData.description || undefined,
        hero_image: formData.hero_image || undefined,
      }, token);
      if (result.created) {
        setFormData({ name: "", description: "", hero_image: "" });
        await fetchClubs();
      } else {
        setError("Failed to create club");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create club");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formData.name.trim()) {
      setError("Club name is required");
      return;
    }

    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateClub(
        id,
        {
          name: formData.name,
          description: formData.description || undefined,
          hero_image: formData.hero_image || undefined,
        },
        token
      );
      if (result.updated) {
        setEditingId(null);
        setFormData({ name: "", description: "", hero_image: "" });
        await fetchClubs();
      } else {
        setError("Failed to update club");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update club");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this club?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.deleteClub(id, token);
      if (result.deleted) {
        await fetchClubs();
      } else {
        setError("Failed to delete club");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete club");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (club: Club) => {
    setEditingId(club.id);
    setFormData({
      name: club.name,
      description: club.description || "",
      hero_image: club.hero_image || "",
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", hero_image: "" });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Club Management
          </h1>
          <p className="text-gray-600">Create, edit, and manage clubs</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Create Club Form */}
        {isSuperAdmin ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Create New Club
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Club Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter club name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating || editingId !== null}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter club description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating || editingId !== null}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  value={formData.hero_image}
                  onChange={(e) => setFormData({ ...formData, hero_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating || editingId !== null}
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={
                    isCreating || editingId !== null || !formData.name.trim()
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Club"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">
                  Super Admin Access Required
                </h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Only Super Admins can create new clubs. You have Admin permissions which allow you to manage existing clubs, but club creation is restricted to Super Admins.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Clubs List */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">No clubs created yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Club Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hero Image
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clubs.map((club) => (
                  <tr key={club.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {club.id}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === club.id ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {club.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {editingId === club.id ? (
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          rows={2}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-gray-600 truncate">
                          {club.description || "-"}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {editingId === club.id ? (
                        <input
                          type="url"
                          value={formData.hero_image}
                          onChange={(e) =>
                            setFormData({ ...formData, hero_image: e.target.value })
                          }
                          className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="https://example.com/image.jpg"
                        />
                      ) : club.hero_image ? (
                        <a
                          href={club.hero_image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline truncate block"
                        >
                          View Image
                        </a>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/clubs/${club.id}`)}
                        disabled={editingId !== null}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        View Club
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === club.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(club.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(club)}
                            disabled={editingId !== null}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(club.id)}
                            disabled={
                              deletingId === club.id || editingId !== null
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === club.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminClubsPage() {
  return (
    <AdminGuard>
      <AdminClubsPageContent />
    </AdminGuard>
  );
}

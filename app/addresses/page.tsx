"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient, type Address, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";

export default function AddressesPage() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<{id: number; name: string}[]>([]);
  const [userClubs, setUserClubs] = useState<{id: number; name: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    number: 3,
    description: "",
    in_use: false,
    user_id: 0,
    club_id: 0,
  });

  // Get current user's Clerk ID
  const clerkUserId = user?.id;

  // Get current user's name from Clerk
  const currentUserClerkName = user?.fullName || user?.firstName || "User";

  // Find current user by matching Clerk token with database users
  const currentUserLhId = currentUser?.id;

  // Check if current user is admin (permission level 1 or 3)
  // Note: permission can be null for regular users, 1 for Admin, 3 for Super Admin
  const isAdmin = currentUser && (currentUser.permission === 1 || currentUser.permission === 3);

  // Fetch data when signed in, metadata can load in the background
  useEffect(() => {
    if (isSignedIn) {
      console.log("Fetching data. currentUserLhId:", currentUserLhId);
      fetchData();
    }
  }, [isSignedIn]);

  // Update available clubs for the selected user
  useEffect(() => {
    if (formData.user_id && clubs.length > 0) {
      // Find the selected user
      const selectedUser = users.find((u) => u.id === formData.user_id);

      if (selectedUser && selectedUser.club_id) {
        // User has a club_id, so show that club
        const userClub = clubs.find((c) => c.id === selectedUser.club_id);
        if (userClub) {
          setUserClubs([userClub]);
        } else {
          setUserClubs([]);
        }
      } else {
        // User doesn't have a club assigned - they can't create addresses
        setUserClubs([]);
      }
    } else {
      setUserClubs([]);
    }
  }, [formData.user_id, users, clubs]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const [addressesData, usersData, clubsData] = await Promise.all([
        apiClient.getAddresses(token),
        apiClient.getUsers(token),
        apiClient.getClubs(token),
      ]);

      // Enrich users with Clerk data (email) and extract club_id
      const enrichedUsers = await Promise.all(
        usersData.map(async (user) => {
          const clerkInfo = await apiClient.getClerkUserInfo(user.token);

          // Extract club_id from clubs array - use the first club if multiple
          const clubId = (user as any).clubs && (user as any).clubs.length > 0
            ? (user as any).clubs[0].club_id
            : user.club_id;

          return {
            ...user,
            club_id: clubId,
            email: clerkInfo.email,
            name: user.name || clerkInfo.name,
          };
        })
      );

      setAddresses(addressesData);
      setUsers(enrichedUsers);
      setClubs(clubsData);

      // Find and set current user info by matching Clerk ID
      if (clerkUserId && enrichedUsers.length > 0) {
        const matchedUser = enrichedUsers.find((u) => u.token === clerkUserId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load data";
      if (
        errorMessage.includes("Unauthenticated") ||
        errorMessage.includes("401")
      ) {
        setError("Please sign in to manage addresses.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (formData.number < 3 || formData.number > 9999) {
      setError("Address number must be between 003 and 9999");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    if (formData.user_id === 0) {
      setError("User assignment is required");
      return false;
    }
    if (formData.club_id === 0) {
      setError("Club assignment is required");
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    // Permission check: Users can only create addresses for themselves, admins can create for anyone
    if (!isAdmin && formData.user_id !== currentUserLhId) {
      setError("You can only create addresses for your own account. Contact an admin to create addresses for others.");
      return;
    }

    // Debug: Check if currentUser is loaded
    if (!currentUser) {
      setError("User data is still loading. Please wait and try again. If this persists, please refresh the page.");
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

      const result = await apiClient.createAddress(formData, token);
      if (result.created) {
        setFormData({
          number: 3,
          description: "",
          in_use: false,
          user_id: 0,
          club_id: 0,
        });
        await fetchData();
      } else {
        setError("Failed to create address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create address");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!validateForm()) {
      return;
    }

    // Get the address being edited
    const addressBeingEdited = addresses.find((a) => a.id === id);
    if (!addressBeingEdited) {
      setError("Address not found");
      return;
    }

    // Permission check: Users can only edit their own addresses, admins can edit any
    if (!isAdmin && addressBeingEdited.user_id !== currentUserLhId) {
      setError("You can only edit your own addresses. Contact an admin for help.");
      return;
    }

    try {
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateAddress(id, formData, token);
      if (result.updated) {
        setEditingId(null);
        setFormData({
          number: 3,
          description: "",
          in_use: false,
          user_id: 0,
          club_id: 0,
        });
        await fetchData();
      } else {
        setError("Failed to update address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update address");
    }
  };

  const handleDelete = async (id: number) => {
    // Get the address being deleted
    const addressBeingDeleted = addresses.find((a) => a.id === id);
    if (!addressBeingDeleted) {
      setError("Address not found");
      return;
    }

    // Permission check: Users can only delete their own addresses, admins can delete any
    if (!isAdmin && addressBeingDeleted.user_id !== currentUserLhId) {
      setError("You can only delete your own addresses. Contact an admin for help.");
      return;
    }

    if (!confirm("Are you sure you want to delete this address?")) {
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

      const result = await apiClient.deleteAddress(id, token);
      if (result.deleted) {
        await fetchData();
      } else {
        setError("Failed to delete address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      number: address.number,
      description: address.description,
      in_use: address.in_use,
      user_id: address.user_id,
      club_id: address.club_id || 0,
    });
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({
      number: 3,
      description: "",
      in_use: false,
      user_id: 0,
      club_id: 0,
    });
    setError(null);
  };

  const getUserName = (userId: number) => {
    // If it's the current user, use their Clerk name
    if (userId === currentUserLhId) {
      return currentUserClerkName;
    }
    // Otherwise, use the name from the database
    const user = users.find((u) => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  const getUserDisplay = (user: User) => {
    // Show email if available, fallback to name, then user ID
    if (user.email) {
      return user.email;
    }
    if (user.name) {
      return user.name;
    }
    return `User ${user.id}`;
  };

  // Check if current user can edit/delete a specific address
  const canEditAddress = (address: Address) => {
    return isAdmin || address.user_id === currentUserLhId;
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            Please sign in to manage addresses.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Address Management
          </h1>
          <p className="text-gray-600">
            Create, edit, and manage addresses assigned to users (003-9999)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Create Address Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Create New Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Number (003-9999)
              </label>
              <input
                type="number"
                value={formData.number}
                onChange={(e) =>
                  setFormData({ ...formData, number: parseInt(e.target.value) })
                }
                min={3}
                max={9999}
                placeholder="e.g., 003"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating || editingId !== null}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned User
              </label>
              <select
                value={formData.user_id}
                onChange={(e) =>
                  setFormData({ ...formData, user_id: parseInt(e.target.value), club_id: 0 })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating || editingId !== null}
              >
                <option value={0}>Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {getUserDisplay(user)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Club
              </label>
              {formData.user_id === 0 ? (
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500 text-sm">
                  Select a user first
                </div>
              ) : userClubs.length === 0 ? (
                <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
                  Selected user has no club assigned
                </div>
              ) : (
                <select
                  value={formData.club_id}
                  onChange={(e) =>
                    setFormData({ ...formData, club_id: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating || editingId !== null}
                >
                  <option value={0}>Select a club...</option>
                  {userClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Main Entry"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating || editingId !== null}
              />
            </div>
            <div>
              <label className="flex items-center mt-8">
                <input
                  type="checkbox"
                  checked={formData.in_use}
                  onChange={(e) =>
                    setFormData({ ...formData, in_use: e.target.checked })
                  }
                  className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating || editingId !== null}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  In Use
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={isCreating || editingId !== null || !formData.description.trim() || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : loading ? "Loading..." : "Create Address"}
          </button>
        </div>

        {/* Addresses List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">No addresses created yet.</p>
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
                    Address #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned User
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    In Use
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {addresses.map((address) => (
                  <tr key={address.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {address.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === address.id ? (
                        <input
                          type="number"
                          value={formData.number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              number: parseInt(e.target.value),
                            })
                          }
                          min={3}
                          max={9999}
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                          autoFocus
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {String(address.number).padStart(3, "0")}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === address.id ? (
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">
                          {address.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === address.id ? (
                        <select
                          value={formData.user_id}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              user_id: parseInt(e.target.value),
                            })
                          }
                          className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>Select a user...</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {getUserDisplay(user)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {getUserName(address.user_id)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {editingId === address.id ? (
                        <input
                          type="checkbox"
                          checked={formData.in_use}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              in_use: e.target.checked,
                            })
                          }
                          className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            address.in_use
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {address.in_use ? "Yes" : "No"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === address.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdate(address.id)}
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
                      ) : canEditAddress(address) ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(address)}
                            disabled={editingId !== null}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(address.id)}
                            disabled={deletingId === address.id || editingId !== null}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deletingId === address.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">No access</div>
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

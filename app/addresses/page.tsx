"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, type Address, type User } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { Dialog } from "@/components/Dialog";

type AddressFilter = "addresses" | "consists";

export default function AddressesPage() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filter from URL, default to "addresses"
  const filterParam = searchParams.get("filter");
  const activeFilter: AddressFilter = filterParam === "consists" ? "consists" : "addresses";

  const setFilter = (filter: AddressFilter) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (filter === "addresses") {
      newParams.delete("filter");
    } else {
      newParams.set("filter", filter);
    }
    const queryString = newParams.toString();
    router.push(`/addresses${queryString ? `?${queryString}` : ""}`);
  };

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clubs, setClubs] = useState<{id: number; name: string}[]>([]);
  const [userClubs, setUserClubs] = useState<{id: number; name: string}[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    number: 3,
    description: "",
    in_use: false,
    user_id: 0,
    club_id: 0,
    road_number: "",
    manufacturer: "",
    road: "",
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

      if (selectedUser && selectedUser.clubs && selectedUser.clubs.length > 0) {
        // User has clubs assigned, map the club relations to full club objects
        const userClubIds = selectedUser.clubs.map((c) => c.club_id);
        const userClubObjects = clubs.filter((club) => userClubIds.includes(club.id));
        setUserClubs(userClubObjects);
      } else {
        // User doesn't have clubs assigned - they can't create addresses
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

      const [addressesData, usersData] = await Promise.all([
        apiClient.getAddresses(token),
        apiClient.getUsers(token),
      ]);

      // Use first_name, last_name, and email from backend (synced from Clerk during profile completion)
      const enrichedUsers = usersData.map((user) => ({
        ...user,
        clubs: user.clubs,
        // first_name and last_name are now stored in backend after profile completion
        // email is also stored in backend
        name: user.name || (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : undefined),
      }));

      setAddresses(addressesData);
      setUsers(enrichedUsers);

      // Find and set current user info by matching Clerk ID
      let currentUserData: User | null = null;
      if (clerkUserId && enrichedUsers.length > 0) {
        const matchedUser = enrichedUsers.find((u) => u.token === clerkUserId);
        if (matchedUser) {
          setCurrentUser(matchedUser);
          currentUserData = matchedUser;
        }
      }

      // Determine clubs based on user permission level
      let clubsData: {id: number; name: string}[];
      const userIsAdmin = currentUserData && (currentUserData.permission === 1 || currentUserData.permission === 3);

      if (userIsAdmin) {
        // Admins can see all clubs - always fetch fresh
        clubsData = await apiClient.getClubs(token);
      } else {
        // Non-admins get clubs from localStorage (assigned clubs)
        try {
          const storedClubs = localStorage.getItem("assignedClubs");
          clubsData = storedClubs ? JSON.parse(storedClubs) : [];
          // If localStorage is empty or invalid, fetch from API as fallback
          if (!Array.isArray(clubsData) || clubsData.length === 0) {
            clubsData = await apiClient.getClubs(token);
          }
        } catch (e) {
          // Fallback to fetching if localStorage fails
          clubsData = await apiClient.getClubs(token);
        }
      }

      setClubs(clubsData);
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
    console.log("handleCreate called with formData:", formData);

    if (!validateForm()) {
      console.log("Validation failed");
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

      console.log("Sending create request with data:", formData);
      const result = await apiClient.createAddress(formData, token);
      console.log("Create result:", result);

      if (result.created) {
        // Keep user_id and club_id so user can quickly create another address
        setFormData({
          number: 3,
          description: "",
          in_use: false,
          user_id: formData.user_id,
          club_id: formData.club_id,
          road_number: "",
          manufacturer: "",
          road: "",
        });
        await fetchData();
      } else {
        setError("Failed to create address");
      }
    } catch (err) {
      console.error("Create address error:", err);
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
      setIsUpdating(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.updateAddress(id, formData, token);
      if (result.updated) {
        setEditingId(null);
        setIsEditModalOpen(false);
        setFormData({
          number: 3,
          description: "",
          in_use: false,
          user_id: 0,
          club_id: 0,
          road_number: "",
          manufacturer: "",
          road: "",
        });
        await fetchData();
      } else {
        setError("Failed to update address");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update address");
    } finally {
      setIsUpdating(false);
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
      description: address.description || "",
      in_use: address.in_use,
      user_id: address.user_id,
      club_id: address.club_id || 0,
      road_number: (address as any).road_number || "",
      manufacturer: (address as any).manufacturer || "",
      road: (address as any).road || "",
    });
    setError(null);
    setIsEditModalOpen(true);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setIsEditModalOpen(false);
    setFormData({
      number: 3,
      description: "",
      in_use: false,
      user_id: 0,
      club_id: 0,
      road_number: "",
      manufacturer: "",
      road: "",
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

  // Filter addresses based on active filter
  // Consists are numbers 1-127, addresses are 128+
  const filteredAddresses = addresses.filter((address) => {
    if (activeFilter === "consists") {
      return address.number >= 1 && address.number <= 127;
    }
    return address.number > 127;
  });

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
            {activeFilter === "consists" ? "Consist" : "Address"} Management
          </h1>
          <p className="text-gray-600">
            {activeFilter === "consists"
              ? "Create, edit, and manage consists (001-127)"
              : "Create, edit, and manage addresses assigned to users (128-9999)"}
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
                disabled={isCreating}
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
                disabled={isCreating}
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
                  disabled={isCreating}
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
                Description (Optional)
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Main Entry"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
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
                  disabled={isCreating}
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  In Use
                </span>
              </label>
            </div>
          </div>

          {/* Additional fields for addresses only (number > 127) */}
          {formData.number > 127 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road (Optional)
                </label>
                <input
                  type="text"
                  value={formData.road}
                  onChange={(e) =>
                    setFormData({ ...formData, road: e.target.value })
                  }
                  placeholder="e.g., UP, BNSF, NS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Road Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.road_number}
                  onChange={(e) =>
                    setFormData({ ...formData, road_number: e.target.value })
                  }
                  placeholder="e.g., 1234"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer (Optional)
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  placeholder="e.g., Athearn, Kato"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={isCreating || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? "Creating..." : loading ? "Loading..." : "Create Address"}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setFilter("addresses")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeFilter === "addresses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Addresses
                <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                  {addresses.filter((a) => a.number > 127).length}
                </span>
              </button>
              <button
                onClick={() => setFilter("consists")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeFilter === "consists"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Consists
                <span className="ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                  {addresses.filter((a) => a.number >= 1 && a.number <= 127).length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Addresses List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAddresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">
              {addresses.length === 0
                ? "No addresses created yet."
                : `No ${activeFilter === "consists" ? "consists" : "addresses"} found.`}
            </p>
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
                {filteredAddresses.map((address) => (
                  <tr key={address.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {address.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {String(address.number).padStart(3, "0")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {address.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getUserName(address.user_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          address.in_use
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {address.in_use ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canEditAddress(address) ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEditing(address)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(address.id)}
                            disabled={deletingId === address.id}
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

      {/* Edit Address Modal */}
      <Dialog
        isOpen={isEditModalOpen}
        onClose={cancelEditing}
        title="Edit Address"
        size="lg"
        primaryAction={{
          label: "Save Changes",
          onClick: () => editingId && handleUpdate(editingId),
          isLoading: isUpdating,
          variant: "primary",
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: cancelEditing,
        }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
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
              disabled={isUpdating}
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
              disabled={isUpdating}
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
                disabled={isUpdating}
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
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Main Entry"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.in_use}
              onChange={(e) =>
                setFormData({ ...formData, in_use: e.target.checked })
              }
              className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              disabled={isUpdating}
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              In Use
            </span>
          </label>
        </div>

        {/* Additional fields for addresses only (number > 127) */}
        {formData.number > 127 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Road (Optional)
              </label>
              <input
                type="text"
                value={formData.road}
                onChange={(e) =>
                  setFormData({ ...formData, road: e.target.value })
                }
                placeholder="e.g., UP, BNSF, NS"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Road Number (Optional)
              </label>
              <input
                type="text"
                value={formData.road_number}
                onChange={(e) =>
                  setFormData({ ...formData, road_number: e.target.value })
                }
                placeholder="e.g., 1234"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer (Optional)
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="e.g., Athearn, Kato"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isUpdating}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

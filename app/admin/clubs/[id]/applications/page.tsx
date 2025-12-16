"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Application } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";

function ClubApplicationsPageContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthday: "",
    occupation: "",
    interested_scale: "",
    special_interests: "",
    has_home_layout: false,
    collection_size: "",
    has_other_model_railroad_associations: false,
    will_agree_to_club_rules: false,
  });

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId)) {
      setError("Invalid club ID");
      setLoading(false);
      return;
    }
    if (isAdmin) {
      fetchApplications();
    }
  }, [clubId, isAdmin]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const applicationsData = await apiClient.getApplicationsByClubId(
        clubId,
        token
      );
      setApplications(applicationsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load applications";
      console.error("Error fetching applications:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this application?")) {
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

      const result = await apiClient.deleteApplication(clubId, id, token);
      if (result.deleted) {
        await fetchApplications();
      } else {
        setError("Failed to delete application");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete application"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setError("Name is required");
        return;
      }
      if (!formData.email.trim()) {
        setError("Email is required");
        return;
      }
      if (!formData.birthday) {
        setError("Date of birth is required");
        return;
      }
      if (!formData.occupation.trim()) {
        setError("Occupation is required");
        return;
      }
      if (!formData.interested_scale.trim()) {
        setError("Scale of interest is required");
        return;
      }

      setIsCreating(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const result = await apiClient.createApplication(clubId, formData);
      if (result.created) {
        setFormData({
          name: "",
          email: "",
          birthday: "",
          occupation: "",
          interested_scale: "",
          special_interests: "",
          has_home_layout: false,
          collection_size: "",
          has_other_model_railroad_associations: false,
          will_agree_to_club_rules: false,
        });
        setShowCreateForm(false);
        await fetchApplications();
      } else {
        setError("Failed to create application");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create application"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Membership Applications
            </h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {showCreateForm ? "Cancel" : "+ Create Application"}
            </button>
          </div>
          <p className="text-gray-600">
            Review and manage membership applications for this club
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Create Application Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create New Application
            </h2>
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupation <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Model Railroad Interests */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Model Railroad Interests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scale of Interest <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="interested_scale"
                      value={formData.interested_scale}
                      onChange={handleChange}
                      placeholder="e.g., HO, N, O, G scale"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Collection Size
                    </label>
                    <input
                      type="text"
                      name="collection_size"
                      value={formData.collection_size}
                      onChange={handleChange}
                      placeholder="e.g., 10 locomotives, 50 cars"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Special Interests
                  </label>
                  <textarea
                    name="special_interests"
                    value={formData.special_interests}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about specific interests in model railroading..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has_home_layout"
                      name="has_home_layout"
                      checked={formData.has_home_layout}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="has_home_layout"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Has a home layout
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="has_other_model_railroad_associations"
                      name="has_other_model_railroad_associations"
                      checked={formData.has_other_model_railroad_associations}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="has_other_model_railroad_associations"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Member of other model railroad associations
                    </label>
                  </div>
                </div>
              </div>

              {/* Agreement */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Club Rules Agreement
                </h3>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="will_agree_to_club_rules"
                    name="will_agree_to_club_rules"
                    checked={formData.will_agree_to_club_rules}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="will_agree_to_club_rules"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Agrees to abide by the club rules and regulations
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={isCreating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Application"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg">
              No applications submitted yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                {/* Application Summary */}
                <div
                  className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => toggleExpanded(application.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.name || "No name provided"}
                      </h3>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        {application.email && (
                          <span>📧 {application.email}</span>
                        )}
                        {application.birthday && (
                          <span>
                            🎂{" "}
                            {new Date(application.birthday).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">
                        {expandedId === application.id ? "▼" : "▶"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === application.id && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Personal Information
                        </h4>
                        <dl className="space-y-1 text-sm">
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Occupation:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.occupation || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Date of Birth:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.birthday
                                ? new Date(
                                    application.birthday
                                  ).toLocaleDateString()
                                : "Not provided"}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Model Railroad Details
                        </h4>
                        <dl className="space-y-1 text-sm">
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Scale:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.interested_scale || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Collection Size:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.collection_size || "Not provided"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Has Home Layout:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.has_home_layout ? "Yes" : "No"}
                            </dd>
                          </div>
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Other Associations:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.has_other_model_railroad_associations
                                ? "Yes"
                                : "No"}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {application.special_interests && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Special Interests
                        </h4>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {application.special_interests}
                        </p>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Agreement
                      </h4>
                      <p className="text-sm text-gray-900">
                        Agrees to club rules:{" "}
                        <span
                          className={
                            application.will_agree_to_club_rules
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {application.will_agree_to_club_rules ? "Yes" : "No"}
                        </span>
                      </p>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Submission Details
                      </h4>
                      <dl className="space-y-1 text-sm">
                        {application.created_at && (
                          <div>
                            <dt className="inline font-medium text-gray-600">
                              Submitted:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {new Date(
                                application.created_at
                              ).toLocaleString()}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(application.id);
                        }}
                        disabled={deletingId === application.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === application.id
                          ? "Deleting..."
                          : "Delete Application"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ClubApplicationsPage() {
  return (
    <AdminGuard>
      <ClubApplicationsPageContent />
    </AdminGuard>
  );
}

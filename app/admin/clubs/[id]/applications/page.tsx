"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Application } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { ApplicationForm, type ApplicationFormData } from "@/components/ApplicationForm";

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

  const handleCreate = async (formData: ApplicationFormData) => {
    setIsCreating(true);
    setError(null);

    try {
      const result = await apiClient.createApplication(clubId, formData);
      if (result.created) {
        setShowCreateForm(false);
        await fetchApplications();
      } else {
        throw new Error("Failed to create application");
      }
    } finally {
      setIsCreating(false);
    }
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
            <ApplicationForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              submitLabel="Create Application"
              isSubmitting={isCreating}
            />
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
                        {application.phone && (
                          <span>📞 {application.phone}</span>
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
                              Phone:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.phone || "Not provided"}
                            </dd>
                          </div>
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
                              Length of Interest:
                            </dt>{" "}
                            <dd className="inline text-gray-900">
                              {application.interest_length || "Not provided"}
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

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/clubs/${clubId}/applications/${application.id}`);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        View Full Application
                      </button>
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

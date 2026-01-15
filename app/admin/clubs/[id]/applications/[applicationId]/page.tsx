"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { apiClient, type Application } from "@/lib/api";
import { Navbar } from "@/components/navbar";
import { AdminGuard } from "@/components/AdminGuard";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import "./print.scss";

function ApplicationViewContent() {
  const { getToken } = useAuth();
  const params = useParams();
  const router = useRouter();
  const clubId = Number(params.id);
  const applicationId = Number(params.applicationId);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAdmin } = useAdminCheck();

  useEffect(() => {
    if (isNaN(clubId) || isNaN(applicationId)) {
      setError("Invalid club or application ID");
      setLoading(false);
      return;
    }
    if (isAdmin) {
      fetchApplication();
    }
  }, [clubId, applicationId, isAdmin]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Authentication required");
        return;
      }

      const applicationData = await apiClient.getApplicationById(
        clubId,
        applicationId,
        token
      );

      if (!applicationData) {
        setError("Application not found");
        return;
      }

      setApplication(applicationData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load application";
      console.error("Error fetching application:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Application not found"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons - Hidden on Print */}
        <div className="no-print mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push(`/admin/clubs/${clubId}/applications`)}
            className="px-4 py-2 text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <span>&larr;</span> Back to Applications
          </button>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            🖨️ Print Application
          </button>
        </div>

        {/* Application Content */}
        <div className="application-view bg-white rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="application-header mb-8 pb-6 border-b-2 border-gray-300">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Membership Application
            </h1>
            <div className="text-sm text-gray-600">
              Application ID: {application.id}
              {application.created_at && (
                <span className="ml-4">
                  Submitted: {new Date(application.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Personal Information Section */}
          <section className="application-section mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Name
                </div>
                <div className="field-value text-gray-900">
                  {application.name || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Email
                </div>
                <div className="field-value text-gray-900">
                  {application.email || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Phone Number
                </div>
                <div className="field-value text-gray-900">
                  {application.phone || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Date of Birth
                </div>
                <div className="field-value text-gray-900">
                  {application.birthday
                    ? new Date(application.birthday).toLocaleDateString()
                    : "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Occupation
                </div>
                <div className="field-value text-gray-900">
                  {application.occupation || "Not provided"}
                </div>
              </div>
            </div>
          </section>

          {/* Model Railroad Information Section */}
          <section className="application-section mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Model Railroad Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Interested Scale
                </div>
                <div className="field-value text-gray-900">
                  {application.interested_scale || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Length of Interest
                </div>
                <div className="field-value text-gray-900">
                  {application.interest_length || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Collection Size
                </div>
                <div className="field-value text-gray-900">
                  {application.collection_size || "Not provided"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Has Home Layout
                </div>
                <div className="field-value text-gray-900">
                  {application.has_home_layout ? "Yes" : "No"}
                </div>
              </div>

              <div className="application-field">
                <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                  Member of Other Railroad Associations
                </div>
                <div className="field-value text-gray-900">
                  {application.has_other_model_railroad_associations ? "Yes" : "No"}
                </div>
              </div>
            </div>
          </section>

          {/* Special Interests Section */}
          {application.special_interests && (
            <section className="application-section mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Special Interests
              </h2>
              <div className="application-field">
                <div className="field-value text-gray-900 whitespace-pre-wrap">
                  {application.special_interests}
                </div>
              </div>
            </section>
          )}

          {/* Agreement Section */}
          <section className="application-section mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Agreement
            </h2>
            <div className="application-field">
              <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                Agrees to Club Rules
              </div>
              <div className="field-value">
                <span
                  className={
                    application.will_agree_to_club_rules
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  {application.will_agree_to_club_rules ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </section>

          {/* Submission Details Section */}
          <section className="application-section">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Submission Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {application.created_at && (
                <div className="application-field">
                  <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                    Submitted On
                  </div>
                  <div className="field-value text-gray-900">
                    {new Date(application.created_at).toLocaleString()}
                  </div>
                </div>
              )}

              {application.updated_at && (
                <div className="application-field">
                  <div className="field-label text-sm font-semibold text-gray-700 mb-1">
                    Last Updated
                  </div>
                  <div className="field-value text-gray-900">
                    {new Date(application.updated_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Print Footer - Only visible when printed */}
          <div className="print-only mt-12 pt-6 border-t-2 border-gray-300 text-sm text-gray-600">
            <p>Printed on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ApplicationViewPage() {
  return (
    <AdminGuard>
      <ApplicationViewContent />
    </AdminGuard>
  );
}

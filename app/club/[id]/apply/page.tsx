"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ApplicationForm, type ApplicationFormData } from "@/components/ApplicationForm";
import { apiClient } from "@/lib/api";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData: ApplicationFormData) => {
    setSubmitting(true);
    try {
      const result = await apiClient.createApplication(
        parseInt(clubId),
        formData
      );

      if (result.created) {
        setSuccess(true);
      } else {
        throw new Error("Failed to submit application. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/club/${clubId}/public`);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Application Submitted!
              </h2>
              <p className="text-gray-600 mb-6">
                Thank you for your interest in joining our club. We&apos;ll
                review your application and get back to you soon.
              </p>
              <button
                onClick={() => router.push(`/club/${clubId}/public`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Club Page
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Club Membership Application
          </h1>
          <p className="text-gray-600 mb-8">
            Please fill out the form below to apply for membership. Fields marked with <span className="text-red-600">*</span> are required.
          </p>

          <ApplicationForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Submit Application"
            isSubmitting={submitting}
          />
        </div>
      </main>
    </div>
  );
}

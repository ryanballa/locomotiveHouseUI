"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { apiClient } from "@/lib/api";

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const calculateAge = (birthday: string): number => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Name is required");
      setSubmitting(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      setSubmitting(false);
      return;
    }

    if (!formData.birthday) {
      setError("Date of birth is required");
      setSubmitting(false);
      return;
    }

    if (!formData.occupation.trim()) {
      setError("Occupation is required");
      setSubmitting(false);
      return;
    }

    if (!formData.interested_scale.trim()) {
      setError("Scale of interest is required");
      setSubmitting(false);
      return;
    }

    if (!formData.will_agree_to_club_rules) {
      setError("You must agree to the club rules to submit an application");
      setSubmitting(false);
      return;
    }

    // Validate age (must be 18 or older)
    const age = calculateAge(formData.birthday);
    if (age < 18) {
      setError("Applicants must be 18 years or older. A parent or guardian must apply on behalf of minors.");
      setSubmitting(false);
      return;
    }

    try {
      const result = await apiClient.createApplication(
        parseInt(clubId),
        formData
      );

      if (result.created) {
        setSuccess(true);
        // Clear form
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
      } else {
        setError("Failed to submit application. Please try again.");
      }
    } catch (err) {
      console.error("Failed to submit application:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
    } finally {
      setSubmitting(false);
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

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="birthday"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="birthday"
                    name="birthday"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Applicants must be 18 years or older
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="occupation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Occupation <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Railroad Interests */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Model Railroad Interests
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="interested_scale"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Scale of Interest <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="interested_scale"
                    name="interested_scale"
                    value={formData.interested_scale}
                    onChange={handleChange}
                    required
                    placeholder="e.g., HO, N, O, G scale"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="special_interests"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Special Interests
                  </label>
                  <textarea
                    id="special_interests"
                    name="special_interests"
                    value={formData.special_interests}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us about your specific interests in model railroading..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="collection_size"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Collection Size
                  </label>
                  <input
                    type="text"
                    id="collection_size"
                    name="collection_size"
                    value={formData.collection_size}
                    onChange={handleChange}
                    placeholder="e.g., 10 locomotives, 50 cars"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="has_home_layout"
                      name="has_home_layout"
                      type="checkbox"
                      checked={formData.has_home_layout}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="has_home_layout"
                      className="text-sm font-medium text-gray-700"
                    >
                      I have a home layout
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="has_other_model_railroad_associations"
                      name="has_other_model_railroad_associations"
                      type="checkbox"
                      checked={formData.has_other_model_railroad_associations}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3">
                    <label
                      htmlFor="has_other_model_railroad_associations"
                      className="text-sm font-medium text-gray-700"
                    >
                      I am a member of other model railroad associations
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Club Rules Agreement
              </h2>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="will_agree_to_club_rules"
                    name="will_agree_to_club_rules"
                    type="checkbox"
                    checked={formData.will_agree_to_club_rules}
                    onChange={handleChange}
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="will_agree_to_club_rules"
                    className="text-sm font-medium text-gray-700"
                  >
                    I agree to abide by the club rules and regulations <span className="text-red-600">*</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push(`/club/${clubId}/public`)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

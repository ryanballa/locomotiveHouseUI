"use client";

import { useState } from "react";

interface ApplicationFormData {
  name: string;
  email: string;
  birthday: string;
  occupation: string;
  interested_scale: string;
  special_interests: string;
  has_home_layout: boolean;
  collection_size: string;
  has_other_model_railroad_associations: boolean;
  will_agree_to_club_rules: boolean;
}

interface ApplicationFormProps {
  onSubmit: (formData: ApplicationFormData) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  showCancelButton?: boolean;
  isSubmitting?: boolean;
}

const initialFormData: ApplicationFormData = {
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
};

/**
 * Reusable membership application form component
 * Used in both public application submission and admin application creation
 */
export function ApplicationForm({
  onSubmit,
  onCancel,
  submitLabel = "Submit Application",
  cancelLabel = "Cancel",
  showCancelButton = true,
  isSubmitting = false,
}: ApplicationFormProps) {
  const [formData, setFormData] = useState<ApplicationFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

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

      if (!formData.will_agree_to_club_rules) {
        setError("You must agree to the club rules to submit an application");
        return;
      }

      // Validate age (must be 18 or older)
      const age = calculateAge(formData.birthday);
      if (age < 18) {
        setError("Applicants must be 18 years or older. A parent or guardian must apply on behalf of minors.");
        return;
      }

      await onSubmit(formData);

      // Reset form on successful submission
      setFormData(initialFormData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
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

  return (
    <div>
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
          {showCancelButton && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export type { ApplicationFormData };

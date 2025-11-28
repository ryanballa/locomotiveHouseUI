"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiClient } from "@/lib/api";
import { Dialog } from "./Dialog";

/**
 * Props for ProfileCompletionModal component
 *
 * @example
 * ```tsx
 * <ProfileCompletionModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   missingFields={["firstName", "lastName"]}
 *   userId={123}
 * />
 * ```
 */
interface ProfileCompletionModalProps {
  /**
   * Whether the modal is open and visible
   *
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Callback when modal should close
   *
   * Called after successful profile update
   *
   * @type {() => void}
   */
  onClose: () => void;

  /**
   * List of missing profile fields
   *
   * Determines which input fields to show
   *
   * @type {("firstName" | "lastName")[]}
   */
  missingFields: ("firstName" | "lastName")[];

  /**
   * Backend user ID for updating the database
   *
   * @type {number | null}
   */
  userId: number | null;
}

/**
 * Modal component for completing user profile information
 *
 * Prompts users to provide missing first name and/or last name
 * when they log in without this information in their backend user profile.
 *
 * ## Features
 *
 * - **Smart field display**: Only shows fields for missing data
 * - **Form validation**: Ensures fields are not empty
 * - **Loading state**: Shows loading indicator during update
 * - **Error handling**: Displays error messages to user
 * - **Prevents closing**: User must complete profile to continue
 * - **Backend integration**: Updates backend user database only
 *
 * ## Usage
 *
 * ```tsx
 * const { isComplete, missingFields, isLoading } = useProfileCompletion();
 * const { isOpen, open, close } = useDialog();
 *
 * useEffect(() => {
 *   if (!isLoading && !isComplete) {
 *     open();
 *   }
 * }, [isLoading, isComplete]);
 *
 * return (
 *   <ProfileCompletionModal
 *     isOpen={isOpen}
 *     onClose={close}
 *     missingFields={missingFields}
 *   />
 * );
 * ```
 *
 * ## Integration with Layout
 *
 * ```tsx
 * export default function RootLayout({ children }) {
 *   const { isComplete, isLoading, missingFields } = useProfileCompletion();
 *   const { isOpen, open, close } = useDialog();
 *
 *   useEffect(() => {
 *     if (!isLoading && !isComplete) {
 *       open();
 *     }
 *   }, [isLoading, isComplete]);
 *
 *   return (
 *     <>
 *       {children}
 *       <ProfileCompletionModal
 *         isOpen={isOpen}
 *         onClose={close}
 *         missingFields={missingFields}
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * @param props - Component props
 * @returns React element rendering the profile completion modal
 *
 * @see {@link useProfileCompletion} for checking profile completion status
 */
export function ProfileCompletionModal({
  isOpen,
  onClose,
  missingFields,
  userId,
}: ProfileCompletionModalProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
  });

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate required fields
      if (missingFields.includes("firstName") && !formData.firstName.trim()) {
        setError("First name is required");
        setIsLoading(false);
        return;
      }

      if (missingFields.includes("lastName") && !formData.lastName.trim()) {
        setError("Last name is required");
        setIsLoading(false);
        return;
      }

      if (!user) {
        setError("User not found");
        setIsLoading(false);
        return;
      }

      if (!userId) {
        setError("User ID not found");
        setIsLoading(false);
        return;
      }

      // Get token for backend API call
      const token = await getToken();
      if (!token) {
        setError("Authentication token not available");
        setIsLoading(false);
        return;
      }

      // Prepare update data
      const updateData: { firstName?: string; lastName?: string } = {};

      if (missingFields.includes("firstName")) {
        updateData.firstName = formData.firstName.trim();
      }

      if (missingFields.includes("lastName")) {
        updateData.lastName = formData.lastName.trim();
      }

      // Ensure we have data to update
      if (Object.keys(updateData).length === 0) {
        setError("No fields to update");
        setIsLoading(false);
        return;
      }

      // Update backend user database only
      await apiClient.updateUser(userId, updateData, token);

      // Close modal on success
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const isSubmitDisabled = () => {
    if (missingFields.includes("firstName") && !formData.firstName.trim()) return true;
    if (missingFields.includes("lastName") && !formData.lastName.trim()) return true;
    return false;
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing by clicking X or outside
      title="Complete Your Profile"
      size="md"
      closeOnBackdropClick={false}
      showCloseButton={false}
      primaryAction={{
        label: "Continue",
        onClick: handleSubmit,
        isLoading,
        isDisabled: isSubmitDisabled(),
      }}
    >
      <div className="space-y-4">
        <p className="text-gray-600 text-sm">
          We need a few more details to get you started. Please fill in the following
          information:
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {missingFields.includes("firstName") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter your first name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        )}

        {missingFields.includes("lastName") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter your last name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
        )}

        <p className="text-xs text-gray-500 mt-4">
          * Required fields to complete your profile
        </p>
      </div>
    </Dialog>
  );
}

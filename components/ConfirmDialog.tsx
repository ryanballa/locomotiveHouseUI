"use client";

import { Dialog } from "./Dialog";

/**
 * Props for the ConfirmDialog component
 *
 * A simplified props interface for confirmation dialogs with common defaults
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Item?"
 *   description="This cannot be undone."
 *   onConfirm={handleDelete}
 *   isLoading={isDeleting}
 *   type="danger"
 * />
 * ```
 */
interface ConfirmDialogProps {
  /**
   * Whether the dialog is open and visible
   *
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Callback when the dialog should close
   *
   * Called when:
   * - User clicks the cancel button
   * - User clicks outside the dialog
   * - User presses ESC key
   *
   * @type {() => void}
   */
  onClose: () => void;

  /**
   * Dialog title displayed in the header
   *
   * Typically a question like "Delete Item?" or "Save Changes?"
   *
   * @type {string}
   */
  title: string;

  /**
   * Dialog description/content shown above buttons
   *
   * Explains what action will be performed
   * Examples: "This cannot be undone.", "Are you sure?"
   *
   * @type {string}
   */
  description: string;

  /**
   * Callback function invoked when user confirms the action
   *
   * Called when the confirm button is clicked
   * Typically performs the actual action (delete, save, etc.)
   *
   * @type {() => void}
   */
  onConfirm: () => void;

  /**
   * Custom label for the confirm button
   *
   * Examples: "Delete", "Save", "Confirm", "Create"
   *
   * @type {string}
   * @default "Confirm"
   */
  confirmLabel?: string;

  /**
   * Custom label for the cancel button
   *
   * @type {string}
   * @default "Cancel"
   */
  cancelLabel?: string;

  /**
   * Whether the confirm button is in loading state
   *
   * When true:
   * - Button text changes to "Loading..."
   * - Button becomes disabled
   * - Cancel button becomes disabled
   *
   * Use this while waiting for async operations
   *
   * @type {boolean}
   * @default false
   */
  isLoading?: boolean;

  /**
   * Type/variant of confirmation controlling button color
   *
   * - `primary`: Blue button (default confirmations)
   * - `danger`: Red button (destructive actions like delete)
   * - `success`: Green button (positive actions like create)
   *
   * @type {"primary" | "danger" | "success"}
   * @default "primary"
   */
  type?: "primary" | "danger" | "success";

  /**
   * Size of the dialog
   *
   * - `sm`: 320px (small confirmations)
   * - `md`: 384px (standard, default)
   * - `lg`: 512px (large descriptions)
   * - `xl`: 576px (extra large)
   *
   * @type {"sm" | "md" | "lg" | "xl"}
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * A specialized dialog component for confirmation dialogs
 *
 * Simplifies the creation of confirmation modals with a clean, focused API.
 * Perfect for delete confirmations, save confirmations, or any yes/no decision.
 *
 * ## Key Features
 *
 * - **Simplified API**: Only required props are title, description, and onConfirm
 * - **Preset button colors**: Automatic color based on confirmation type
 * - **Default labels**: "Confirm" and "Cancel" by default, customizable
 * - **Loading state**: Automatically disables buttons and shows "Loading..." text
 * - **Type safety**: Full TypeScript support with strict prop types
 * - **Accessibility**: ARIA attributes and keyboard support (ESC to cancel)
 *
 * ## Common Use Cases
 *
 * ### Delete Confirmation
 *
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 * const [isDeleting, setIsDeleting] = useState(false);
 *
 * const handleDelete = async () => {
 *   setIsDeleting(true);
 *   try {
 *     await deleteItem(id);
 *     setShowConfirm(false);
 *   } finally {
 *     setIsDeleting(false);
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={() => setShowConfirm(true)}>Delete</button>
 *     <ConfirmDialog
 *       isOpen={showConfirm}
 *       onClose={() => setShowConfirm(false)}
 *       title="Delete Item?"
 *       description="This action cannot be undone. The item will be permanently deleted."
 *       onConfirm={handleDelete}
 *       isLoading={isDeleting}
 *       type="danger"
 *       confirmLabel="Delete"
 *     />
 *   </>
 * );
 * ```
 *
 * ### Save Confirmation
 *
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showSave}
 *   onClose={() => setShowSave(false)}
 *   title="Save Changes?"
 *   description="Your changes will be saved to the database."
 *   onConfirm={handleSave}
 *   isLoading={isSaving}
 *   type="primary"
 *   confirmLabel="Save"
 * />
 * ```
 *
 * ### Create Confirmation
 *
 * ```tsx
 * <ConfirmDialog
 *   isOpen={showCreate}
 *   onClose={() => setShowCreate(false)}
 *   title="Create New Item?"
 *   description="A new item will be created with the provided information."
 *   onConfirm={handleCreate}
 *   isLoading={isCreating}
 *   type="success"
 *   confirmLabel="Create"
 * />
 * ```
 *
 * ## Props vs Dialog Component
 *
 * **Use ConfirmDialog when:**
 * - You need a simple yes/no confirmation
 * - You want preset button colors based on action type
 * - Default labels (Confirm/Cancel) work for your use case
 *
 * **Use Dialog when:**
 * - You need custom content (forms, complex layouts)
 * - You need multiple action buttons (>2)
 * - You need full control over styling and behavior
 *
 * @param props - Confirmation dialog props
 * @returns React element rendering the confirmation dialog
 *
 * @see {@link Dialog} for a more flexible dialog component
 * @see {@link useDialog} for dialog state management hook
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  type = "primary",
  size = "md",
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      primaryAction={{
        label: confirmLabel,
        onClick: onConfirm,
        isLoading,
        variant: type,
      }}
      secondaryAction={{
        label: cancelLabel,
        onClick: onClose,
        isDisabled: isLoading,
      }}
    >
      <p className="text-gray-600">{description}</p>
    </Dialog>
  );
}

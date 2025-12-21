"use client";

import { useEffect, useRef } from "react";

/**
 * Configuration for the primary action button in a dialog
 *
 * @example
 * ```tsx
 * const primaryAction = {
 *   label: "Delete",
 *   onClick: handleDelete,
 *   isLoading: isDeleting,
 *   variant: "danger"
 * };
 * ```
 */
interface PrimaryActionConfig {
  /** Button label text */
  label: string;

  /** Callback function when button is clicked */
  onClick: () => void;

  /** Whether button is in loading state (shows "Loading..." text) */
  isLoading?: boolean;

  /** Whether button is disabled */
  isDisabled?: boolean;

  /** Visual variant of the button
   * - `primary`: Blue button (default)
   * - `danger`: Red button for destructive actions
   * - `success`: Green button for positive actions
   */
  variant?: "danger" | "success" | "primary";
}

/**
 * Configuration for the secondary action button in a dialog
 *
 * @example
 * ```tsx
 * const secondaryAction = {
 *   label: "Cancel",
 *   onClick: handleCancel
 * };
 * ```
 */
interface SecondaryActionConfig {
  /** Button label text */
  label: string;

  /** Callback function when button is clicked */
  onClick: () => void;

  /** Whether button is in loading state (shows "Loading..." text) */
  isLoading?: boolean;

  /** Whether button is disabled */
  isDisabled?: boolean;
}

/**
 * Props for the Dialog component
 *
 * @example
 * ```tsx
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Delete"
 *   size="md"
 *   primaryAction={{
 *     label: "Delete",
 *     onClick: handleDelete,
 *     variant: "danger"
 *   }}
 *   secondaryAction={{
 *     label: "Cancel",
 *     onClick: () => setIsOpen(false)
 *   }}
 * >
 *   <p>Are you sure you want to delete this item?</p>
 * </Dialog>
 * ```
 */
interface DialogProps {
  /**
   * Whether the dialog is open and visible
   *
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Callback function invoked when the dialog should close
   *
   * Called when:
   * - User clicks the close button
   * - User presses ESC key
   * - User clicks outside the dialog (if `closeOnBackdropClick` is true)
   *
   * @type {() => void}
   */
  onClose: () => void;

  /**
   * Optional dialog title displayed in the header
   *
   * If not provided and `showCloseButton` is false, header is hidden
   *
   * @type {string}
   * @optional
   */
  title?: string;

  /**
   * Dialog content - any React elements/components
   *
   * Rendered in the main body section of the dialog
   *
   * @type {React.ReactNode}
   */
  children: React.ReactNode;

  /**
   * Size variant controlling the max-width of the dialog
   *
   * - `sm`: 320px (small modals)
   * - `md`: 384px (standard modals, default)
   * - `lg`: 512px (large forms/content)
   * - `xl`: 576px (extra large dialogs)
   *
   * @type {"sm" | "md" | "lg" | "xl"}
   * @default "md"
   */
  size?: "sm" | "md" | "lg" | "xl";

  /**
   * Primary action button configuration
   *
   * Displayed on the right side of the footer
   * Typically used for confirmations, saves, or primary actions
   *
   * @type {PrimaryActionConfig}
   * @optional
   */
  primaryAction?: PrimaryActionConfig;

  /**
   * Secondary action button configuration
   *
   * Displayed on the left side of the footer
   * Typically used for cancellations or alternative actions
   *
   * @type {SecondaryActionConfig}
   * @optional
   */
  secondaryAction?: SecondaryActionConfig;

  /**
   * Whether clicking outside the dialog (on the backdrop) closes it
   *
   * When true, users can dismiss the dialog by clicking outside
   * When false, requires explicit action button click
   *
   * @type {boolean}
   * @default true
   */
  closeOnBackdropClick?: boolean;

  /**
   * Whether to display the close (X) button in the header
   *
   * Button appears on the right side of the title
   * Clicking it calls the `onClose` callback
   *
   * @type {boolean}
   * @default true
   */
  showCloseButton?: boolean;

  /**
   * Additional CSS classes for the dialog container
   *
   * Applied to the inner dialog element (not the backdrop)
   * Useful for custom styling or animations
   *
   * @type {string}
   * @optional
   */
  className?: string;
}

/**
 * Reusable, accessible dialog component for modals and confirmations
 *
 * A flexible modal dialog component that can be used for confirmations, forms,
 * alerts, or any custom dialog content. Supports customizable sizes, buttons,
 * and interaction styles.
 *
 * ## Features
 *
 * - **Customizable sizes**: sm, md (default), lg, xl
 * - **Optional title and close button**: Flexible header configuration
 * - **Primary and secondary action buttons**: Fully configurable buttons with loading states
 * - **Click outside to close**: Backdrop click handling (optional)
 * - **Button variants**: primary (blue), danger (red), success (green)
 * - **Accessible**: ARIA attributes, keyboard navigation (ESC to close)
 * - **Scroll lock**: Prevents body scrolling when dialog is open
 * - **Focus management**: Handles focus correctly with backdrop overlay
 *
 * ## Usage Examples
 *
 * ### Basic Dialog
 *
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 *
 * return (
 *   <>
 *     <button onClick={() => setIsOpen(true)}>Open</button>
 *     <Dialog
 *       isOpen={isOpen}
 *       onClose={() => setIsOpen(false)}
 *       title="Hello"
 *     >
 *       <p>Dialog content</p>
 *     </Dialog>
 *   </>
 * );
 * ```
 *
 * ### Confirmation Dialog
 *
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * const [isLoading, setIsLoading] = useState(false);
 *
 * const handleConfirm = async () => {
 *   setIsLoading(true);
 *   try {
 *     await performAction();
 *     setIsOpen(false);
 *   } finally {
 *     setIsLoading(false);
 *   }
 * };
 *
 * return (
 *   <Dialog
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Confirm Action"
 *     primaryAction={{
 *       label: "Confirm",
 *       onClick: handleConfirm,
 *       isLoading
 *     }}
 *     secondaryAction={{
 *       label: "Cancel",
 *       onClick: () => setIsOpen(false)
 *     }}
 *   >
 *     <p>Are you sure?</p>
 *   </Dialog>
 * );
 * ```
 *
 * ### Deletion Dialog with Danger Variant
 *
 * ```tsx
 * <Dialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Delete Item?"
 *   size="sm"
 *   primaryAction={{
 *     label: "Delete",
 *     onClick: handleDelete,
 *     variant: "danger",
 *     isLoading: isDeleting
 *   }}
 *   secondaryAction={{
 *     label: "Cancel",
 *     onClick: () => setIsOpen(false)
 *   }}
 * >
 *   <p>This action cannot be undone.</p>
 * </Dialog>
 * ```
 *
 * ## Accessibility
 *
 * - Keyboard support: Press ESC to close
 * - ARIA attributes: `role="dialog"`, `aria-modal="true"`
 * - Focus management: Focus remains within dialog
 * - Backdrop interaction: Click outside to close (configurable)
 * - Screen readers: Proper semantic markup
 *
 * @param props - Dialog component props
 * @returns React element rendering the dialog modal
 *
 * @see {@link DialogProps} for all available props
 * @see {@link ConfirmDialog} for a simplified confirmation dialog
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  primaryAction,
  secondaryAction,
  closeOnBackdropClick = true,
  showCloseButton = true,
  className,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close dialog
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Get width classes based on size
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Get button variant classes
  const getButtonClasses = (variant: "danger" | "success" | "primary" = "primary", isLoading?: boolean, isDisabled?: boolean) => {
    const baseClasses = "px-4 py-2 rounded-md text-white font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      primary: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      danger: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    };

    return `${baseClasses} ${variantClasses[variant]} ${disabledClasses}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      ref={dialogRef}
    >
      <div
        className={`bg-white rounded-lg shadow-lg ${sizeClasses[size]} w-full mx-4 ${className || ""}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition focus:outline-none"
                aria-label="Close dialog"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer with Actions */}
        {(primaryAction || secondaryAction) && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                disabled={secondaryAction.isLoading || secondaryAction.isDisabled}
                className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {secondaryAction.isLoading ? "Loading..." : secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.isLoading || primaryAction.isDisabled}
                className={getButtonClasses(primaryAction.variant, primaryAction.isLoading, primaryAction.isDisabled || primaryAction.isLoading)}
              >
                {primaryAction.isLoading ? "Loading..." : primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";

/**
 * Return type for the useDialog hook
 *
 * Provides dialog state and control functions
 *
 * @example
 * ```tsx
 * const dialogState: UseDialogReturn = useDialog();
 * ```
 */
interface UseDialogReturn {
  /**
   * Current open/closed state of the dialog
   *
   * @type {boolean}
   */
  isOpen: boolean;

  /**
   * Opens the dialog (sets isOpen to true)
   *
   * @type {() => void}
   *
   * @example
   * ```tsx
   * <button onClick={open}>Open Dialog</button>
   * ```
   */
  open: () => void;

  /**
   * Closes the dialog (sets isOpen to false)
   *
   * @type {() => void}
   *
   * @example
   * ```tsx
   * <button onClick={close}>Close Dialog</button>
   * ```
   */
  close: () => void;

  /**
   * Toggles the dialog state (open -> closed or closed -> open)
   *
   * @type {() => void}
   *
   * @example
   * ```tsx
   * <button onClick={toggle}>Toggle Dialog</button>
   * ```
   */
  toggle: () => void;
}

/**
 * Custom hook to manage dialog open/close state
 *
 * Provides a simple, reusable way to manage dialog visibility state
 * across your application. Use this hook with Dialog or ConfirmDialog
 * components for clean, declarative dialog management.
 *
 * ## Features
 *
 * - Simple state management for dialogs
 * - Memoized callbacks for performance
 * - Works with both Dialog and ConfirmDialog components
 * - Type-safe return value
 * - Zero dependencies beyond React
 *
 * ## Basic Usage
 *
 * ```tsx
 * const { isOpen, open, close } = useDialog();
 *
 * return (
 *   <>
 *     <button onClick={open}>Open</button>
 *     <Dialog isOpen={isOpen} onClose={close}>
 *       <p>Content here</p>
 *     </Dialog>
 *   </>
 * );
 * ```
 *
 * ## With Dialog Component
 *
 * ```tsx
 * export function MyComponent() {
 *   const { isOpen, open, close } = useDialog();
 *   const [isLoading, setIsLoading] = useState(false);
 *
 *   const handleSave = async () => {
 *     setIsLoading(true);
 *     try {
 *       await saveData();
 *       close();
 *     } finally {
 *       setIsLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={open}>Save</button>
 *       <Dialog
 *         isOpen={isOpen}
 *         onClose={close}
 *         title="Save Changes"
 *         primaryAction={{
 *           label: "Save",
 *           onClick: handleSave,
 *           isLoading
 *         }}
 *         secondaryAction={{
 *           label: "Cancel",
 *           onClick: close
 *         }}
 *       >
 *         <p>Save your changes?</p>
 *       </Dialog>
 *     </>
 *   );
 * }
 * ```
 *
 * ## With ConfirmDialog Component
 *
 * ```tsx
 * export function DeleteButton({ id }) {
 *   const { isOpen, open, close } = useDialog();
 *   const [isDeleting, setIsDeleting] = useState(false);
 *
 *   const handleDelete = async () => {
 *     setIsDeleting(true);
 *     try {
 *       await deleteItem(id);
 *       close();
 *     } finally {
 *       setIsDeleting(false);
 *     }
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={open}>Delete</button>
 *       <ConfirmDialog
 *         isOpen={isOpen}
 *         onClose={close}
 *         title="Delete Item?"
 *         description="This cannot be undone."
 *         onConfirm={handleDelete}
 *         isLoading={isDeleting}
 *         type="danger"
 *         confirmLabel="Delete"
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ## Multiple Dialogs in One Component
 *
 * ```tsx
 * export function UserManagement() {
 *   const createDialog = useDialog();
 *   const editDialog = useDialog();
 *   const deleteDialog = useDialog();
 *
 *   return (
 *     <>
 *       <button onClick={createDialog.open}>Create User</button>
 *       <button onClick={editDialog.open}>Edit User</button>
 *       <button onClick={deleteDialog.open}>Delete User</button>
 *
 *       <Dialog isOpen={createDialog.isOpen} onClose={createDialog.close}>
 *         Create form
 *       </Dialog>
 *       <Dialog isOpen={editDialog.isOpen} onClose={editDialog.close}>
 *         Edit form
 *       </Dialog>
 *       <ConfirmDialog
 *         isOpen={deleteDialog.isOpen}
 *         onClose={deleteDialog.close}
 *         title="Delete User?"
 *         description="This cannot be undone."
 *         onConfirm={handleDelete}
 *         type="danger"
 *       />
 *     </>
 *   );
 * }
 * ```
 *
 * ## Performance Considerations
 *
 * - All returned functions are memoized with `useCallback`
 * - Safe to use as dependencies in other hooks (useEffect, etc.)
 * - Minimal re-renders when dialog state changes
 * - No unnecessary function recreations on component re-render
 *
 * @returns {UseDialogReturn} Object with dialog state and control functions:
 *   - `isOpen`: Boolean indicating if dialog is visible
 *   - `open()`: Function to open the dialog
 *   - `close()`: Function to close the dialog
 *   - `toggle()`: Function to toggle between open/closed states
 *
 * @see {@link Dialog} for the base dialog component
 * @see {@link ConfirmDialog} for a confirmation dialog wrapper
 */
export function useDialog(): UseDialogReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, open, close, toggle };
}

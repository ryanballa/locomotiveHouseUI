/**
 * User role and permission level constants
 *
 * This module defines the available user roles and their corresponding
 * permission levels used throughout the application.
 */

/**
 * Permission levels and their meanings:
 * - 1: Admin - Can manage clubs and users within their scope
 * - 2: Regular - Can view and modify within their scope
 * - 3: Super Admin - Can access everything and bypass all restrictions
 * - 4: Limited - Can access assigned club with limited features (assigned via invite token)
 * - null: Guest/Unauthenticated - No permissions
 */

export enum PermissionLevel {
  ADMIN = 1,
  REGULAR = 2,
  LIMITED = 4,
  SUPER_ADMIN = 3,
}

export const PERMISSION_LABELS: Record<PermissionLevel | "GUEST", string> = {
  [PermissionLevel.ADMIN]: "Admin",
  [PermissionLevel.LIMITED]: "Limited",
  [PermissionLevel.REGULAR]: "Regular",
  [PermissionLevel.SUPER_ADMIN]: "Super Admin",
  GUEST: "Guest",
};

/**
 * Get the display name for a permission level
 * @param permission - Permission level (1, 2, 3, or null)
 * @returns Human-readable permission name
 */
export function getPermissionLabel(permission: number | null): string {
  if (permission === null) {
    return PERMISSION_LABELS.GUEST;
  }
  return PERMISSION_LABELS[permission as PermissionLevel] || "Unknown";
}

/**
 * Check if a permission level represents an admin role
 * @param permission - Permission level to check
 * @returns true if the permission is admin (1) or super admin (3)
 */
export function isAdminRole(permission: number | null): boolean {
  return (
    permission === PermissionLevel.ADMIN ||
    permission === PermissionLevel.SUPER_ADMIN
  );
}

/**
 * Check if a permission level represents a super admin
 * @param permission - Permission level to check
 * @returns true if the permission is super admin (3)
 */
export function isSuperAdminRole(permission: number | null): boolean {
  return permission === PermissionLevel.SUPER_ADMIN;
}

/**
 * Check if a permission level represents a limited user
 * @param permission - Permission level to check
 * @returns true if the permission is limited (2)
 */
export function isLimitedRole(permission: number | null): boolean {
  return permission === PermissionLevel.LIMITED;
}

import { PERMISSIONS, hasPermission } from "../constants/permissions";

export function usePermissions(role: string) {
  return {
    can: (permission: string) => hasPermission(role, permission),
    permissions: PERMISSIONS[role] ?? [],
  };
}

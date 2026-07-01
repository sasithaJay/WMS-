import { ROLES } from "./roles";

export const PERMISSIONS: Record<string, string[]> = {
  [ROLES.COMMISSIONER]: [
    "view_both_stores",
    "view_ss_store",
    "view_pc_store",
    "approve_requests",
    "recommend_requests",
    "manage_users",
    "view_all_reports",
    "register_items",
    "receive_stock",
    "issue_stock",
    "submit_request",
    "view_own_requests",
    "view_section_requests",
    "barcode_lookup",
  ],
  [ROLES.ASSISTANT_COMMISSIONER]: [
    "view_pc_store",
    "approve_requests",
    "view_pc_reports",
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.ASSISTANT_DIRECTOR]: [
    "view_ss_store",
    "approve_requests",
    "view_ss_reports",
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.ACCOUNTANT]: [
    "approve_requests",
    "view_all_reports",
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.ADMINISTRATIVE_OFFICER]: [
    "recommend_requests",
    "view_ss_store",
    "view_all_reports",
    "submit_request",
    "view_own_requests",
    "view_section_requests",
    "create_section_request",
  ],
  [ROLES.SECTION_HEAD]: [
    "recommend_requests",
    "view_ss_store",
    "submit_request",
    "view_own_requests",
    "view_section_requests",
    "create_section_request",
  ],
  [ROLES.STORE_KEEPER]: [
    "view_both_stores",
    "view_ss_store",
    "view_pc_store",
    "register_items",
    "receive_stock",
    "issue_stock",
    "view_all_reports",
    "barcode_lookup",
  ],
  [ROLES.DEVELOPMENT_OFFICER]: [
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.OFFICER]: [
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.INSTITUTION]: [
    "submit_request",
    "view_own_requests",
  ],
  [ROLES.DIVISIONAL_SECRETARIAT]: [
    "submit_request",
    "view_own_requests",
  ],
};

export function hasPermission(role: string, permission: string): boolean {
  return (PERMISSIONS[role] ?? []).includes(permission);
}

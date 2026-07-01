import type { Role } from "../types";

export function useRoleRedirect(role: Role): string {
  const map: Record<Role, string> = {
    COMMISSIONER: "CommissionerDashboard",
    ASSISTANT_COMMISSIONER: "AssistantCommissionerDashboard",
    ASSISTANT_DIRECTOR: "AssistantDirectorDashboard",
    ACCOUNTANT: "AccountantDashboard",
    ADMINISTRATIVE_OFFICER: "AdministrativeOfficerDashboard",
    SECTION_HEAD: "SectionHeadDashboard",
    STORE_KEEPER: "StoreKeeperDashboard",
    DEVELOPMENT_OFFICER: "DevelopmentOfficerDashboard",
    OFFICER: "OfficerDashboard",
    INSTITUTION: "InstitutionDashboard",
    DIVISIONAL_SECRETARIAT: "DivisionalSecretariatDashboard",
  };
  return map[role];
}

import type { Role } from "../types";

export function getRoleDashboard(role: Role): string {
  const map: Record<Role, string> = {
    ADMIN: "AdminDashboard",
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

export function getRoleDisplayName(role: Role): string {
  const names: Record<Role, string> = {
    ADMIN: "System Admin",
    COMMISSIONER: "Commissioner",
    ASSISTANT_COMMISSIONER: "Assistant Commissioner",
    ASSISTANT_DIRECTOR: "Assistant Director",
    ACCOUNTANT: "Accountant",
    ADMINISTRATIVE_OFFICER: "Administrative Officer",
    SECTION_HEAD: "Section Head",
    STORE_KEEPER: "Store Keeper",
    DEVELOPMENT_OFFICER: "Development Officer",
    OFFICER: "Officer",
    INSTITUTION: "Institution",
    DIVISIONAL_SECRETARIAT: "Divisional Secretariat",
  };
  return names[role];
}

export function getRoleUserName(role: Role): string {
  const names: Record<Role, string> = {
    ADMIN: "System Admin",
    COMMISSIONER: "H.M. Bandara",
    ASSISTANT_COMMISSIONER: "K.L. Dissanayake",
    ASSISTANT_DIRECTOR: "S.P. Weerasekara",
    ACCOUNTANT: "N.K. Rajapaksa",
    ADMINISTRATIVE_OFFICER: "Kumari Silva",
    SECTION_HEAD: "P.K. Jayasena",
    STORE_KEEPER: "Ranjith Fernando",
    DEVELOPMENT_OFFICER: "Nimal Perera",
    OFFICER: "D.M. Perera",
    INSTITUTION: "Karandeniya Children's Home",
    DIVISIONAL_SECRETARIAT: "Galle DS Office",
  };
  return names[role];
}

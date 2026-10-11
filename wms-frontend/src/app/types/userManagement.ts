

export interface AdminUserRole {
  id: number;
  name_en: string;
  name_si: string;
  code: string;
}

export interface AdminUserDivision {
  id: number;
  name_en: string;
  name_si: string;
}

export interface AdminUserSection {
  id: number;
  name_en: string;
  name_si: string;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string | null;
  account_type: "STAFF" | "INSTITUTION" | "DS_OFFICE";
  account_status: "ACTIVE" | "SUSPENDED";
  staff_profile?: {
    full_name: string;
    nic_number?: string;
    phone?: string | null;
    role?: AdminUserRole;
    division?: AdminUserDivision;
    section?: AdminUserSection;
  };
  organization?: {
    name: string;
    organization_kind: "INSTITUTION" | "DS_OFFICE";
    division?: AdminUserDivision;
    contact_number?: string | null;
  };
}

export interface AdminUserListResponse {
  data: AdminUser[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface AdminStats {
  total_users: number;
  pending_users: number;
  active_roles: number;
  suspended_users: number;
}

export interface UpdateUserPayload {
  full_name?: string;
  nic_number?: string;
  email?: string | null;
  phone?: string | null;
  role_id?: number;
  division_id?: number;
  section_id?: number | null;
  account_status?: "ACTIVE" | "SUSPENDED";
}

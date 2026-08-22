

import api from "../api/axios";

export interface RoleSummary {
  id: number;
  name_en: string;
  name_si: string;
  code: string;
}

export interface DivisionSummary {
  id: number;
  name_en: string;
  name_si: string;
}


export interface StaffProfileSummary {
  id: number;
  full_name: string;
  role_id: number;
  division_id: number | null;
  section_id: number | null;
  nic_number: string;
  phone: string;
  employee_number: string;
  role?: RoleSummary;
  division?: DivisionSummary;
}

export interface OrganizationSummary {
  id: number;
  name: string;
  organization_kind: "INSTITUTION" | "DS_OFFICE";
  division_id: number;
  address?: string;
  contact_number?: string;
  division?: DivisionSummary;
  district?: string;
}

export interface PendingRegistration {
  id: number;
  username: string;
  email: string | null;
  account_type: "STAFF" | "INSTITUTION" | "DS_OFFICE";
  account_status: "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";
  created_at: string;
  staff_profile?: StaffProfileSummary;
  organization?: OrganizationSummary;
}

interface PendingRegistrationsResponse {
  message: string;
  count: number;
  registrations: PendingRegistration[];
}

export async function getPendingRegistrations(): Promise<PendingRegistrationsResponse> {
  const response = await api.get("/admin/registrations/pending");
  return response.data;
}

export async function approveRegistration(userId: number): Promise<void> {
  await api.patch(`/admin/registrations/${userId}/approve`);
}

export async function rejectRegistration(userId: number, rejectionReason: string): Promise<void> {
  await api.patch(`/admin/registrations/${userId}/reject`, {
    rejection_reason: rejectionReason,
  });
}
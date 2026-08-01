

import api from "../api/axios";
import type { AdminUser, AdminUserListResponse, AdminStats, UpdateUserPayload } from "../app/types/userManagement";

export async function getAdminStats(): Promise<{ data: AdminStats }> {
  const response = await api.get("/admin/stats");
  return response.data;
}

export async function getActiveUsers(params?: {
  type?: "staff" | "institution" | "ds_office";
  search?: string;
  per_page?: number;
}): Promise<AdminUserListResponse> {
  const response = await api.get("/admin/users", { params });
  return response.data;
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<AdminUser> {
  const response = await api.patch(`/admin/users/${id}`, payload);
  return response.data.data;
}
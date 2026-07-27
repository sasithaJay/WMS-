// src/services/organizationService.ts

import api from "../api/axios";

export interface Organization {
  id: number;
  name: string;
  organization_kind: "INSTITUTION" | "DS_OFFICE";
}

export async function getOrganizations(params?: {
  kind?: "INSTITUTION" | "DS_OFFICE";
}): Promise<{ data: Organization[] }> {
  const response = await api.get("/organizations", { params });
  return response.data;
}
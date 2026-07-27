

import api from "../api/axios";

export interface DsOffice {
  id: number;
  name_en: string;
  name_si: string;
  code: string;
  district: string;
}

export async function getDsOffices(): Promise<{ data: DsOffice[] }> {
  const response = await api.get("/ds-offices");
  return response.data;
}
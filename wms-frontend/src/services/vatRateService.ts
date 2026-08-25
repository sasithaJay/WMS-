

import api from "../api/axios";

export async function getCurrentVatRate(): Promise<{ data: { percentage: number } }> {
  const response = await api.get("/vat-rates/current");
  return response.data;
}

export async function getMyVatRequests(): Promise<{ data: any[] }> {
  const response = await api.get("/vat-rates/my-requests");
  return response.data;
}

export async function submitVatRateChange(percentage: number): Promise<void> {
  await api.post("/vat-rates", { percentage });
}

export async function getPendingVatRates(): Promise<{ data: any[] }> {
  const response = await api.get("/vat-rates/pending");
  return response.data;
}

export async function approveVatRate(id: number, comment?: string): Promise<void> {
  await api.patch(`/vat-rates/${id}/approve`, { review_comment: comment });
}

export async function rejectVatRate(id: number, comment: string): Promise<void> {
  await api.patch(`/vat-rates/${id}/reject`, { review_comment: comment });
}
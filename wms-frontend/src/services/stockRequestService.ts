// src/services/stockRequestService.ts

import api from "../api/axios";
import type {
  CreateStockRequestPayload,
  StockRequest,
  StockRequestListResponse,
} from "../app/types/stockRequests";

export async function getStockRequests(params?: {
  page?: number;
  per_page?: number;
}): Promise<StockRequestListResponse> {
  const response = await api.get("/stock-requests", { params });
  return response.data;
}

export async function getPendingRecommendation(params?: {
  page?: number;
  per_page?: number;
}): Promise<StockRequestListResponse> {
  const response = await api.get("/stock-requests/pending-recommendation", { params });
  return response.data;
}

export async function getPendingApproval(params?: {
  page?: number;
  per_page?: number;
}): Promise<StockRequestListResponse> {
  const response = await api.get("/stock-requests/pending-approval", { params });
  return response.data;
}

export async function createStockRequest(
  payload: CreateStockRequestPayload,
): Promise<StockRequest> {
  const response = await api.post("/stock-requests", payload);
  return response.data.data ?? response.data;
}

export async function getStockRequest(id: number): Promise<StockRequest> {
  const response = await api.get(`/stock-requests/${id}`);
  return response.data.data ?? response.data;
}

export async function recommendStockRequest(
  id: number,
  payload: { remarks?: string; items?: { item_id: number; quantity: number }[] },
): Promise<StockRequest> {
  const response = await api.post(`/stock-requests/${id}/recommend`, payload);
  return response.data.data ?? response.data;
}

export async function approveStockRequest(
  id: number,
  payload: { remarks?: string; items?: { item_id: number; quantity: number }[] },
): Promise<StockRequest> {
  const response = await api.post(`/stock-requests/${id}/approve`, payload);
  return response.data.data ?? response.data;
}

export async function rejectStockRequest(id: number, reason: string): Promise<StockRequest> {
  const response = await api.post(`/stock-requests/${id}/reject`, { reason });
  return response.data.data ?? response.data;
}

export async function returnStockRequest(id: number, reason: string): Promise<StockRequest> {
  const response = await api.post(`/stock-requests/${id}/return`, { reason });
  return response.data.data ?? response.data;
}
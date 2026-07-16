// src/services/stockReceiptService.ts

import api from "../api/axios";
import type {
  CreateStockReceiptPayload,
  StockReceipt,
} from "../app/types/stockReceipts";

interface StockReceiptListResponse {
  data: StockReceipt[];
  current_page: number;
  last_page: number;
  total: number;
}

export async function getStockReceipts(params?: {
  search?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}): Promise<StockReceiptListResponse> {
  const response = await api.get("/stock-receipts", { params });
  return response.data;
}

export async function createStockReceipt(
  payload: CreateStockReceiptPayload,
): Promise<StockReceipt> {
  const response = await api.post("/stock-receipts", payload);
  return response.data.data ?? response.data;
}

export async function getStockReceipt(
  id: number,
): Promise<StockReceipt> {
  const response = await api.get(`/stock-receipts/${id}`);
  return response.data.data ?? response.data;
}

export async function confirmStockReceipt(
  id: number,
): Promise<StockReceipt> {
  const response = await api.post(`/stock-receipts/${id}/confirm`);
  return response.data.data ?? response.data;
}

export async function cancelStockReceipt(
  id: number,
  reason: string
): Promise<StockReceipt> {
  const response = await api.post(`/stock-receipts/${id}/cancel`, { reason });
  return response.data.data ?? response.data;
}


export async function updateStockReceipt(
  id: number,
  payload: CreateStockReceiptPayload,
): Promise<StockReceipt> {
  const response = await api.put(`/stock-receipts/${id}`, payload);
  return response.data.data ?? response.data;
}


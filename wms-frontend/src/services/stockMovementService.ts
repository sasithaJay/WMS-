

import api from "../api/axios";
import type { StockMovementListResponse } from "../app/types/stockMovements";

export async function getStockMovements(params?: {
  item_id?: number;
  movement_type?: string;
  page?: number;
  per_page?: number;
}): Promise<StockMovementListResponse> {
  const response = await api.get("/stock-movements", { params });
  return response.data;
}
import axios from "../api/axios";
import type {
  InventoryItem,
  ItemCategory,
  PaginatedItems,
  Unit,
} from "../app/types/inventory";

export interface CreateItemPayload {
  division_id: number;
  category_id: number;
  unit_id: number;
  item_code: string;
  name_en: string;
  name_si?: string;
  description?: string;
  barcode?: string;
  reorder_level: number;
}

export interface ItemFilters {
  search?: string;
  category_id?: number;
  division_id?: number;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export async function getItems(
  filters: ItemFilters = {},
): Promise<PaginatedItems> {
  const response = await axios.get<PaginatedItems>("/items", {
    params: filters,
  });

  return response.data;
}

export async function createItem(
  payload: CreateItemPayload,
): Promise<InventoryItem> {
  const response = await axios.post<{
    message: string;
    data: InventoryItem;
  }>("/items", payload);

  return response.data.data;
}

export async function getItemCategories(): Promise<ItemCategory[]> {
  const response = await axios.get<{ data: ItemCategory[] }>(
    "/item-categories",
  );

  return response.data.data;
}

export async function getUnits(): Promise<Unit[]> {
  const response = await axios.get<{ data: Unit[] }>("/units");

  return response.data.data;
}
import api from "../api/axios";

import type {
  InventoryItem,
  ItemCategory,
  PaginatedItems,
  Unit,
} from "../app/types/inventory";

export interface CreateItemPayload {
  category_id: number;
  unit_id: number;
  item_code: string;
  name_en: string;
  description?: string;
  barcode?: string;
  reorder_level: number;
}

export type UpdateItemPayload = CreateItemPayload;

export interface ItemFilters {
  search?: string;
  category_id?: number;
  division_id?: number;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface ItemUpdateRequestPayload {
  category_id: number;
  unit_id: number;
  item_code: string;
  name_en: string;
  description?: string;
  barcode?: string;
  reorder_level: number;
  reason: string;
}

export async function requestItemUpdate(
  itemId: number,
  payload: ItemUpdateRequestPayload,
): Promise<void> {
  await api.post(
    `/items/${itemId}/update-requests`,
    payload,
  );
}

export async function getItems(
  filters: ItemFilters = {},
): Promise<PaginatedItems> {
  const response = await api.get<PaginatedItems>("/items", {
    params: filters,
  });

  return response.data;
}

export async function createItem(
  payload: CreateItemPayload,
): Promise<InventoryItem> {
  const response = await api.post<{
    message: string;
    data: InventoryItem;
  }>("/items", payload);

  return response.data.data;
}

export async function updateItem(
  itemId: number,
  payload: UpdateItemPayload,
): Promise<InventoryItem> {
  const response = await api.put<{
    message: string;
    data: InventoryItem;
  }>(`/items/${itemId}`, payload);

  return response.data.data;
}

export async function toggleItemStatus(
  itemId: number,
): Promise<InventoryItem> {
  const response = await api.patch<{
    message: string;
    data: InventoryItem;
  }>(`/items/${itemId}/status`);

  return response.data.data;
}

export async function getItemCategories(): Promise<ItemCategory[]> {
  const response = await api.get<{
    data: ItemCategory[];
  }>("/item-categories");

  return response.data.data;
}

export async function getUnits(): Promise<Unit[]> {
  const response = await api.get<{
    data: Unit[];
  }>("/units");

  return response.data.data;
}

export async function lookupItemByCode(code: string): Promise<InventoryItem> {
  const response = await api.get("/items/lookup", { params: { code } });
  return response.data.data;
}

export function getItemQrCodeUrl(itemId: number): string {
  return `${api.defaults.baseURL}/items/${itemId}/qr-code`;
}

export function getItemBarcodeUrl(itemId: number): string {
  return `${api.defaults.baseURL}/items/${itemId}/barcode`;
}

export async function fetchItemQrCodeBlob(itemId: number): Promise<string> {
  const response = await api.get(`/items/${itemId}/qr-code`, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}

export async function fetchItemBarcodeBlob(itemId: number): Promise<string> {
  const response = await api.get(`/items/${itemId}/barcode`, { responseType: "blob" });
  return URL.createObjectURL(response.data);
}
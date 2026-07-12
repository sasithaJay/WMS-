export interface ItemCategory {
  id: number;
  name_en: string;
  name_si: string | null;
  code: string;
  is_active?: boolean;
}

export interface Unit {
  id: number;
  name_en: string;
  name_si: string | null;
  symbol: string | null;
  is_active?: boolean;
}

export interface Division {
  id: number;
  name_en: string;
  name_si: string | null;
}

export interface InventoryBalance {
  item_id?: number;
  quantity_on_hand: number;
  reserved_quantity: number;
}

export interface InventoryItem {
  id: number;

  division_id: number;
  category_id: number;
  unit_id: number;

  item_code: string;
  name_en: string;
  description: string | null;
  barcode: string | null;
  reorder_level: number;
  is_active: boolean;

  division: Division;
  category: ItemCategory;
  unit: Unit;
  balance: InventoryBalance | null;

  created_at?: string;
  updated_at?: string;
}

export interface ItemSummary {
  total_items: number;
  low_stock: number;
  normal_stock: number;
  out_of_stock?: number;
}

export interface PaginatedItems {
  current_page: number;
  data: InventoryItem[];
  first_page_url?: string;
  from: number | null;
  last_page: number;
  last_page_url?: string;
  next_page_url: string | null;
  path?: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

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
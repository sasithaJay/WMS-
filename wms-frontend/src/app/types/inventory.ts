export interface ItemCategory {
  id: number;
  name_en: string;
  name_si: string | null;
  code: string;
}

export interface Unit {
  id: number;
  name_en: string;
  name_si: string | null;
  symbol: string | null;
}

export interface InventoryBalance {
  quantity_on_hand: number;
  reserved_quantity: number;
}

export interface InventoryItem {
  id: number;
  item_code: string;
  name_en: string;
  name_si: string | null;
  description: string | null;
  barcode: string | null;
  reorder_level: number;
  is_active: boolean;

  division: {
    id: number;
    name_en: string;
    name_si: string | null;
  };

  category: ItemCategory;
  unit: Unit;
  balance: InventoryBalance;
}

export interface PaginatedItems {
  current_page: number;
  data: InventoryItem[];
  last_page: number;
  per_page: number;
  total: number;
}
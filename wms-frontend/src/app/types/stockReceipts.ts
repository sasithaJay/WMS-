// src/types/stockReceipt.ts

import type { InventoryItem } from "./inventory";

export type StockReceiptStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "CANCELLED";

export interface StockReceiptItemForm {
  rowId: string;
  item_id: number | "";
  quantity_received: string;
  unit_cost: string;
  remarks: string;
}

export interface CreateStockReceiptPayload {
  //division_id: number;
  supplier_name: string;
  invoice_number?: string;
  received_date: string;
  notes?: string;
  items: {
    item_id: number;
    quantity_received: number;
    unit_cost?: number;
    remarks?: string;
  }[];
}

export interface StockReceiptItem {
  id: number;
  stock_receipt_id: number;
  item_id: number;
  quantity_received: number;
  unit_cost: number | null;
  remarks: string | null;
  item: InventoryItem;
}

export interface StockReceipt {
  id: number;
  division_id: number;
  grn_number: string;
  supplier_name: string;
  invoice_number: string | null;
  received_date: string;
  notes: string | null;
  status: StockReceiptStatus;
  created_by: number;
  confirmed_by: number | null;
  confirmed_at: string | null;
  items_count?: number;
  total_quantity?: number;
  items?: StockReceiptItem[];
  created_at: string;
  updated_at: string;
  vat_percentage: string;
  vat_amount: string;
  total_with_vat: string;
  subtotal: string;
}
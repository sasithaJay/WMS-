

import type { StockMovement } from "./stockMovements";

export interface LowStockItem {
  id: number;
  item_code: string;
  name_en: string;
  reorder_level: number;
  quantity_on_hand: number; // decimal cast -> string, coerce with Number()
}

export interface StockStatusBreakdown {
  out: number;
  low: number;
  normal: number;
}

export interface MonthlyChartPoint {
  month: string;
  received: number;
  issued: number;
}

export interface DivisionDashboardSummary {
  division_id: number;
  division_name_en: string;
  division_name_si: string;
  total_items: number;
  low_stock_count: number;
  low_stock_items: LowStockItem[];
  stock_status: StockStatusBreakdown;
  pending_recommendation_count: number;
  pending_approval_count: number;
  pending_issuance_count: number;
  issued_this_month_count: number;
  receipts_this_month_count: number;
  recent_movements: StockMovement[];
  monthly_chart: MonthlyChartPoint[];
}

export interface ActionRequiredItem {
  id: number;
  request_number: string;
  requester_name: string;
  request_context: string;
  stage: "RECOMMENDATION" | "APPROVAL" | "ISSUANCE" | "ITEM_UPDATE";
  submitted_at: string | null;
  item_summary: string;
}

export interface MyViewSummary {
  my_requests_this_month_count: number;
  my_pending_issuance_count: number;
  my_issued_this_month_count: number;
  action_required_count: number;
  action_required_items: ActionRequiredItem[];
}

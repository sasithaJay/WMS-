

export interface StockReportRow {
  division_name: string;
  item_code: string;
  name_en: string;
  category: string | null;
  unit: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  status: "OUT" | "LOW" | "NORMAL";
}

export interface IssueReportRow {
  date: string;
  item_code: string;
  item_name: string;
  quantity: number;
  reference_number: string | null;
  performed_by: string;
}

export interface ReceiptReportItem {
  item_code: string;
  name_en: string;
  quantity_received: number;
}

export interface ReceiptReportRow {
  grn_number: string;
  supplier_name: string;
  received_date: string;
  confirmed_at: string | null;
  item_count: number;
  total_quantity: number;
  items: ReceiptReportItem[];
}

export interface MonthlyReportRow {
  month: number;
  month_name: string;
  received: number;
  issued: number;
  pending: number;
  rejected: number;
}

export interface AnnualReportRow {
  year: number;
  total_received: number;
  total_issued: number;
  total_requests: number;
  fulfilled: number;
}

export interface OfficerReportRequest {
  request_number: string;
  request_context: string;
  status: string;
  submitted_at: string | null;
  item_count: number;
  items: {
    item_code: string;
    name_en: string;
    quantity_requested: number;
  }[];
}

export interface OfficerReportGroup {
  officer_name: string;
  division_name: string | null;
  requests: OfficerReportRequest[];
}

export interface ReportFilters {
  division_id?: number;
  date_from?: string;
  date_to?: string;
  year?: number;
  from_year?: number;
  to_year?: number;
  status?: string;
}
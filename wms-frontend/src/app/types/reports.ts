

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
  division_name: string;
  item_code: string;
  item_name: string;
  quantity: number;
  reference_number: string | null;
  performed_by: string;
  requester_name: string;
  requester_position: string;
}

export interface ReceiptReportItem {
  item_code: string;
  name_en: string;
  quantity_received: number;
}

export interface ReceiptReportRow {
  grn_number: string;
  division_name: string;
  supplier_name: string;
  received_date: string;
  confirmed_at: string | null;
  item_count: number;
  total_quantity: number;
  items: ReceiptReportItem[];
}

export interface MonthlyReportRow {
  division_id: number;
  division_name: string;
  received_items: MonthlyReceivedItem[];
  issued_items: MonthlyIssuedItem[];
  received_totals: MonthlyUnitTotal[];
  issued_totals: MonthlyUnitTotal[];
  receipt_subtotal: number;
  receipt_vat: number;
  receipt_total_with_vat: number;
}

export interface MonthlyReceivedItem {
  item_code: string;
  item_name: string;
  supplier_name: string;
  reference_number: string | null;
  date: string | null;
  quantity: number;
  unit: string;
  total_amount_with_vat: number | null;
}

export interface MonthlyIssuedItem {
  item_code: string;
  item_name: string;
  quantity: number;
  unit: string;
  date: string | null;
  reference_number: string | null;
}

export interface MonthlyUnitTotal {
  unit: string;
  quantity: number;
}

export type AnnualReportRow = MonthlyReportRow;

export interface OfficerReportRequest {
  request_number: string;
  division_name: string | null;
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
  month?: number;
  year?: number;
  status?: string;
  requester?: string;
}

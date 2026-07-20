// src/app/types/stockRequests.ts

export type StockRequestContext =
  | "PERSONAL"
  | "SECTION_COMMON"
  | "INSTITUTION"
  | "DS_OFFICE";

export type StockRequestStatus =
  | "PENDING_RECOMMENDATION"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED"
  | "ISSUED"
  | "CANCELLED";

export type StockRequestStage = "RECOMMENDATION" | "APPROVAL" | "ISSUANCE" | null;

export interface StockRequestItemPayload {
  item_id: number;
  quantity_requested: number;
  remarks?: string;
}

export interface CreateStockRequestPayload {
  request_context: StockRequestContext;
  division_id?: number; // only honored server-side for Commissioner
  notes?: string;
  items: StockRequestItemPayload[];
}

export interface StockRequestItemView {
  id: number;
  item_id: number;
  quantity_requested: string; // decimal cast -> string, coerce with Number()
  quantity_recommended: string | null;
  quantity_approved: string | null;
  quantity_issued: string | null;
  remarks: string | null;
  item: {
    id: number;
    item_code: string;
    name_en: string;
    name_si?: string;
  };
}

export interface StockRequestUser {
  id: number;
  name: string;
}

export interface StockRequest {
  id: number;
  request_number: string;
  requester_id: number;
  division_id: number;
  store_id: number;
  section_id: number | null;
  organization_id: number | null;
  request_context: StockRequestContext;
  status: StockRequestStatus;
  current_stage: StockRequestStage;
  recommender_id: number | null;
  approver_id: number | null;
  notes: string | null;
  submitted_at: string | null;
  items_count?: number;
  items?: StockRequestItemView[];
  requester?: StockRequestUser;
  recommender?: StockRequestUser;
  approver?: StockRequestUser;
  created_at: string;
  updated_at: string;
}

export interface StockRequestListResponse {
  data: StockRequest[];
  current_page: number;
  last_page: number;
  total: number;
}
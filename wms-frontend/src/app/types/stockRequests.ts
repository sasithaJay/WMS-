// src/app/types/stockRequests.ts

export type StockRequestContext =
  | "PERSONAL"
  | "SECTION_COMMON"
  | "INSTITUTION"
  | "DS_OFFICE";

export type StockRequestStatus =
  | "PENDING_RECOMMENDATION"
  | "PENDING_APPROVAL"
  | "PARTIALLY_PROCESSED"
  | "APPROVED"
  | "REJECTED"
  | "RETURNED"
  | "ISSUED"
  | "CANCELLED";

export type StockRequestStage = "RECOMMENDATION" | "APPROVAL" | "ISSUANCE" | null;

export interface StockRequestOrganization {
  id: number;
  name: string;
  organization_kind: "INSTITUTION" | "DS_OFFICE";
}

export interface StockRequestItemPayload {
  item_id: number;
  quantity_requested: number;
  remarks?: string;
}

export interface CreateStockRequestPayload {
  request_context: StockRequestContext;
  ds_office_id?: number;
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
  approval_status: "pending" | "approved" | "rejected";
  approval_remarks: string | null;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejected_by: number | null;
  rejected_at: string | null;
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
  role_label?: string;
}

export interface StockRequest {
  id: number;
  request_number: string;
  requester_id: number;
  division_id: number;
  store_id: number;
  section_id: number | null;
  organization_id: number | null;
  ds_office_id: number | null;
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
  organization?: StockRequestOrganization;
  ds_office?: { 
    id: number; 
    name_en: string; 
    name_si: string;
    district: string 
  };
}

export interface StockRequestListResponse {
  data: StockRequest[];
  current_page: number;
  last_page: number;
  total: number;
}

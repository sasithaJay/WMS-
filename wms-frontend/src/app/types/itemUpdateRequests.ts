

export type ItemUpdateRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

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

export interface ItemUpdateRequestValues {
  category_id: number;
  unit_id: number;
  item_code: string;
  name_en: string;
  description: string | null;
  barcode: string | null;
  reorder_level: number;
}

export interface ItemUpdateRequestItem {
  id: number;
  item_code: string;
  name_en: string;
}

export interface ItemUpdateRequestUser {
  id: number;
  username: string;
  name?: string;
}

export interface ItemUpdateRequest {
  id: number;
  item_id: number;
  requested_by: number;
  old_values: ItemUpdateRequestValues;
  new_values: ItemUpdateRequestValues;
  status: ItemUpdateRequestStatus;
  reason: string;
  reviewed_by: number | null;
  review_comment: string | null;
  reviewed_at: string | null;
  item?: ItemUpdateRequestItem;
  requester?: ItemUpdateRequestUser;
  reviewer?: ItemUpdateRequestUser;
  created_at: string;
  updated_at: string;
}

export interface ItemUpdateRequestListResponse {
  data: ItemUpdateRequest[];
  current_page: number;
  last_page: number;
  total: number;
}
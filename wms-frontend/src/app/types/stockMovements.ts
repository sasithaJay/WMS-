

export type MovementType =
  | "RECEIPT"
  | "ISSUE"
  | "RETURN"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT";

export interface StockMovementItem {
  id: number;
  item_code: string;
  name_en: string;
  name_si?: string;
}

export interface StockMovementPerformer {
  id: number;
  name: string;
}

export interface StockMovement {
  id: number;
  division_id: number;
  item_id: number;
  movement_type: MovementType;
  quantity: string;        // decimal cast -> string from API, coerce with Number()
  balance_before: string;
  balance_after: string;
  reference_type: string | null;
  reference_id: number | null;
  reference_number: string | null;
  performed_by: number;
  remarks: string | null;
  item: StockMovementItem;
  performer: StockMovementPerformer;
  created_at: string;
  updated_at: string;
}

export interface StockMovementListResponse {
  data: StockMovement[];
  current_page: number;
  last_page: number;
  total: number;
}

const INCOMING_TYPES: MovementType[] = ["RECEIPT", "RETURN", "ADJUSTMENT_IN"];
const OUTGOING_TYPES: MovementType[] = ["ISSUE", "ADJUSTMENT_OUT"];

export function isIncomingMovement(type: MovementType): boolean {
  return INCOMING_TYPES.includes(type);
}

export function isOutgoingMovement(type: MovementType): boolean {
  return OUTGOING_TYPES.includes(type);
}
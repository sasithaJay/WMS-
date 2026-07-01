export type Lang = "en" | "si";
export type Screen = "login" | "register" | "dashboard";
export type DashRole = "requester" | "approver" | "storekeeper";
export type Role =
  | "COMMISSIONER"
  | "ASSISTANT_COMMISSIONER"
  | "ASSISTANT_DIRECTOR"
  | "ACCOUNTANT"
  | "ADMINISTRATIVE_OFFICER"
  | "SECTION_HEAD"
  | "STORE_KEEPER"
  | "DEVELOPMENT_OFFICER"
  | "OFFICER"
  | "INSTITUTION"
  | "DIVISIONAL_SECRETARIAT";
export type DashTab = "personal" | "summary";
export type UserType = "all" | "staff" | "institution" | "ds";
export type StatusType = "pending" | "approved" | "issued" | "rejected";
export type RequestStatus = "pending" | "approved" | "issued" | "rejected";

export interface NavItem {
  icon: any;
  label: string;
  labelSi: string;
  id: string;
  badge?: number;
}

export interface InventoryItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  reorder: number;
  division: string;
}

export interface GRNRecord {
  grn: string;
  date: string;
  supplier: string;
  item: string;
  qty: number;
  unit: string;
  division: string;
}

export interface UserRecord {
  name: string;
  role: string;
  username: string;
  division: string;
  type: "staff" | "institution" | "ds";
}

export interface StockItem {
  code: string;
  name: string;
  category: string;
  unit: string;
  qty: number;
  reorder: number;
  division: string;
}

export interface GrnRecord {
  grn: string;
  date: string;
  supplier: string;
  item: string;
  qty: number;
  unit: string;
  division: string;
}

export interface RequestRecord {
  id: string;
  ref: string;
  date: string;
  section: string;
  items: string[];
  status: RequestStatus;
}

export interface PendingUser {
  name: string;
  role: string;
  username: string;
  division: string;
  type: "staff" | "institution" | "ds";
}

export interface ActiveUser {
  name: string;
  role: string;
  division: string;
  section: string;
  status: "active" | "inactive";
}

export interface RecommendItem {
  ref: string;
  requester: string;
  section: string;
  date: string;
  items: string[];
  division: string;
}

export interface ApproveItem {
  ref: string;
  requester: string;
  section: string;
  date: string;
  division: string;
  items: { name: string; requested: number; unit: string }[];
}

export interface IssueItem {
  ref: string;
  requester: string;
  role: string;
  approvalDate: string;
  division: string;
  items: string[];
}

export interface MovementRecord {
  item: string;
  qty: string;
  type: "in" | "out";
  date: string;
  by: string;
}

export type AccountType =
  | "STAFF"
  | "INSTITUTION"
  | "DS_OFFICE";

export type AccountStatus =
  | "PENDING"
  | "ACTIVE"
  | "REJECTED";

export interface User {
  id: number;
  username: string;
  email: string;
  account_type: AccountType;
  account_status: AccountStatus;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}
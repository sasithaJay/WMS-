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
  role: string | null;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegistrationDivision {
  id: number;
  code: string;
  name_en: string;
  name_si: string;
}

export interface RegistrationRole {
  id: number;
  code: string;
  name_en: string;
  name_si: string;
}

export interface RegistrationSection {
  id: number;
  division_id: number;
  code: string;
  name_en: string;
  name_si: string;
}

export interface InstitutionType {
  id: number;
  name_en: string;
  name_si: string;
}

export interface DsOffice {
  id: number;
  name_en: string;
  name_si: string;
  code: string;
  district: string;
}

export interface RegistrationOptionsResponse {
  divisions: RegistrationDivision[];
  roles: RegistrationRole[];
  institution_types: InstitutionType[];
  ds_offices: DsOffice[];
}

export interface RegistrationUser {
  id: number;
  username: string;
  email: string;
  account_type:
    | "STAFF"
    | "INSTITUTION"
    | "DS_OFFICE";
  account_status: string;
}

export interface RegistrationResponse {
  message: string;
  user: RegistrationUser;
}


export type BackupType = "DATABASE" | "UPLOADS";

export interface Backup {
  id: number;
  file_name: string;
  type: BackupType;
  file_size: number;
  created_at: string;
  creator?: { staff_profile?: { full_name: string } };
}
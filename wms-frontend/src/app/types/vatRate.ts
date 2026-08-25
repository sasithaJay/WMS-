

export type VatRateStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VatRate {
  id: number;
  percentage: string;
  status: VatRateStatus;
  requester?: { staff_profile?: { full_name: string } };
  reviewer?: { staff_profile?: { full_name: string } };
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}
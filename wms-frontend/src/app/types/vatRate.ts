

export type VatRateStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VatRate {
  id: number;
  percentage: string;
  status: VatRateStatus;
  requester?: {
    username?: string;
    staff_profile?: {
      full_name: string;
      role?: { name_en?: string; name_si?: string };
      division?: { name_en?: string; name_si?: string };
    };
  };
  reviewer?: { staff_profile?: { full_name: string } };
  review_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
}

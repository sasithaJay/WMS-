// src/services/badgeCountService.ts

import { getPendingApproval } from "./stockRequestService";
import { getPendingRecommendation } from "./stockRequestService";
import { getPendingIssuance } from "./stockRequestService";
import { getPendingRegistrations } from "./userService";
import { getPendingEquipmentReturns } from "./equipmentAssignmentService";
import { getPendingVatRates } from "./vatRateService";
import { getPendingItemUpdateRequests } from "./itemUpdateRequestService";

export async function getNavBadgeCounts(roleCode: string | null): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  try {
    const approval = await getPendingApproval({ per_page: 1 });
    counts.approve = approval.total;
  } catch {
    // silently skip — a failed badge fetch shouldn't break the sidebar
  }

  try {
    const recommendation = await getPendingRecommendation({ per_page: 1 });
    counts.recommend = recommendation.total;
  } catch {
    // silently skip
  }

  // Keep badge requests aligned with the backend role permission map. Avoid
  // sending requests that are guaranteed to receive a 403 for this role.
  if (["ADMIN", "COMMISSIONER", "ASSISTANT_COMMISSIONER", "ASSISTANT_DIRECTOR"].includes(roleCode ?? "")) {
    try {
      const registrations = await getPendingRegistrations();
      counts.users = registrations.count;
    } catch {
      // A failed badge fetch shouldn't break the sidebar.
    }
  }

  try {
    const issuance = await getPendingIssuance({ per_page: 1 });
    counts.issue = issuance.total;
  } catch {
    // Only Store Keepers can view the issuance queue.
  }

  try {
    const returns = await getPendingEquipmentReturns();
    counts["equipment-returns"] = returns.length;
  } catch {
    // Only Store Keepers can view equipment returns.
  }

  try {
    const vatRates = await getPendingVatRates();
    counts["vat-approve"] = vatRates.data.length;
  } catch {
    // Only authorized roles can view pending VAT rate approvals.
  }

  if (["ADMINISTRATIVE_OFFICER", "ACCOUNTANT"].includes(roleCode ?? "")) {
    try {
      const itemUpdates = await getPendingItemUpdateRequests({ per_page: 1 });
      counts["item-updates"] = itemUpdates.total;
    } catch {
      // A failed badge fetch shouldn't break the sidebar.
    }
  }

  return counts;
}

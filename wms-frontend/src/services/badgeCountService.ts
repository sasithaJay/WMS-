// src/services/badgeCountService.ts

import { getPendingApproval } from "./stockRequestService";
import { getPendingRecommendation } from "./stockRequestService";

export async function getNavBadgeCounts(): Promise<Record<string, number>> {
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

  return counts;
}
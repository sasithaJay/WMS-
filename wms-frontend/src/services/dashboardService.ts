

import api from "../api/axios";
import type { DivisionDashboardSummary, MyViewSummary } from "../app/types/dashboard";

export async function getDashboardOverview(
  divisionId?: number,
): Promise<{ data: DivisionDashboardSummary[] }> {
  const response = await api.get("/dashboard/overview", {
    params: divisionId ? { division_id: divisionId } : undefined,
  });
  return response.data;
}

export async function getDashboardMyView(): Promise<{ data: MyViewSummary }> {
  const response = await api.get("/dashboard/my-view");
  return response.data;
}
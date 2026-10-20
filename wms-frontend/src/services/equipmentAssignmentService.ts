import api from "../api/axios";

export interface EquipmentAssignment {
  id: number;
  item_id: number;
  assigned_to: number;
  issued_at: string;
  status: "ASSIGNED" | "RETURN_REQUIRED" | "RETURN_PENDING" | "RETURNED";
  return_reason: string | null;
  return_requested_at: string | null;
  returned_at: string | null;
  return_condition: "GOOD" | "DAMAGED" | "MALFUNCTIONED" | "BEYOND_REPAIR" | null;
  item: { id: number; item_code: string; name_en: string };
  assignedTo?: { id: number; name: string };
  assigned_to_user?: { id: number; name: string };
}

export async function getMyEquipmentAssignments(): Promise<EquipmentAssignment[]> {
  const response = await api.get("/equipment-assignments/mine");
  return response.data.data ?? [];
}

export async function requestEquipmentReturn(id: number, reason: string): Promise<EquipmentAssignment> {
  const response = await api.post(`/equipment-assignments/${id}/return-request`, { reason });
  return response.data.data;
}

export async function getPendingEquipmentReturns(): Promise<EquipmentAssignment[]> {
  const response = await api.get("/equipment-assignments/pending-returns");
  return response.data.data ?? [];
}

export async function confirmEquipmentReturn(
  id: number,
  payload: { condition: EquipmentAssignment["return_condition"]; remarks?: string },
): Promise<EquipmentAssignment> {
  const response = await api.post(`/equipment-assignments/${id}/confirm-return`, payload);
  return response.data.data;
}

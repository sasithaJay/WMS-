

import api from "../api/axios";
import type {
  ItemUpdateRequest,
  ItemUpdateRequestListResponse,
  ItemUpdateRequestPayload,
} from "../app/types/itemUpdateRequests";


export async function createItemUpdateRequest(
  itemId: number,
  payload: ItemUpdateRequestPayload,
): Promise<ItemUpdateRequest> {
  const response = await api.post(`/items/${itemId}/update-requests`, payload);
  return response.data.data ?? response.data;
}

export async function getMyItemUpdateRequests(params?: {
  page?: number;
  per_page?: number;
}): Promise<ItemUpdateRequestListResponse> {
  const response = await api.get("/my-item-update-requests", { params }); // ← corrected path
  return response.data;
}

export async function getPendingItemUpdateRequests(params?: {
  page?: number;
  per_page?: number;
}): Promise<ItemUpdateRequestListResponse> {
  const response = await api.get("/item-update-requests/pending", { params }); // ← this one was already correct
  return response.data;
}

export async function approveItemUpdateRequest(
  id: number,
  reviewComment?: string,
): Promise<void> {
  await api.patch(`/item-update-requests/${id}/approve`, {
    review_comment: reviewComment,
  });
}

export async function rejectItemUpdateRequest(
  id: number,
  reviewComment: string,
): Promise<void> {
  await api.patch(`/item-update-requests/${id}/reject`, {
    review_comment: reviewComment,
  });
}
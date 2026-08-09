

import api from "../api/axios";

export interface AppNotification {
  id: string;
  type: string;
  data: {
    type: string;
    request_id?: number;
    request_number?: string;
    action?: string;
    stage?: string;
    remarks?: string;
    request_context?: string;
    item_count?: number;
    requester_name?: string;
    actor_name?: string;
    actor_role?: string;
    update_request_id?: number;
    item_code?: string;
    item_name?: string;
    reason?: string;
    review_comment?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    status?: string;
    item_codes?: string[];
    applicant_name?: string;
    applicant_role?: string;
    username?: string;
    account_type?: string;
  };
  read_at: string | null;
  created_at: string;
}

interface NotificationListResponse {
  data: AppNotification[];
  current_page: number;
  last_page: number;
  total: number;
}

export async function getNotifications(params?: { per_page?: number }): Promise<NotificationListResponse> {
  const response = await api.get("/notifications", { params });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await api.get("/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
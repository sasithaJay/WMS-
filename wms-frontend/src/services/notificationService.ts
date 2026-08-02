

import api from "../api/axios";

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, any>;
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
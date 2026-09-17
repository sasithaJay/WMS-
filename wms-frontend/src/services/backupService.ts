

import api from "../api/axios";
import type { Backup } from "../app/types/backup";

export async function getBackups(): Promise<{ data: Backup[] }> {
  const response = await api.get("/admin/backups");
  return response.data;
}

export async function backupDatabase(): Promise<Backup> {
  const response = await api.post("/admin/backups/database");
  return response.data.data;
}

export async function backupUploads(): Promise<Backup> {
  const response = await api.post("/admin/backups/uploads");
  return response.data.data;
}

export async function downloadBackup(backup: Backup): Promise<void> {
  const response = await api.get(`/admin/backups/${backup.id}/download`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data]);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = backup.file_name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function deleteBackup(id: number): Promise<void> {
  await api.delete(`/admin/backups/${id}`);
}

export async function restoreBackup(id: number): Promise<void> {
  await api.post(`/admin/backups/${id}/restore`, { confirmation: "RESTORE" });
}

export async function getMaintenanceStatus(): Promise<{ data: { enabled: boolean } }> {
  const response = await api.get("/admin/backups/maintenance");
  return response.data;
}

export async function toggleMaintenance(enabled: boolean): Promise<void> {
  await api.patch("/admin/backups/maintenance", { enabled });
}
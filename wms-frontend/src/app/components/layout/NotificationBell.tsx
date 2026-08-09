
import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
  type AppNotification,
} from "../../../services/notificationService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { NotificationDetailModal } from "./NotificationDetailModal";

function describeNotification(n: AppNotification, lang: Lang): string {
  const d = n.data;
  switch (d.type) {
    case "request_status_changed":
      return t(lang, `Request ${d.request_number} was ${d.action?.toLowerCase()}`, `ඉල්ලීම ${d.request_number} ${d.action}`);
    case "request_needs_action":
      return t(lang, `Request ${d.request_number} needs your ${d.stage?.toLowerCase()}`, `ඉල්ලීම ${d.request_number} ඔබගේ ක්‍රියාව අපේක්ෂිතයි`);
    case "item_update_status_changed":
      return t(lang, `Item update request ${d.action?.toLowerCase()}`, `භාණ්ඩ යාවත්කාලීන ඉල්ලීම ${d.action}`);
    case "account_status_changed":
      return t(lang, `Your account was ${d.status?.toLowerCase()}`, `ඔබගේ ගිණුම ${d.status}`);
    case "low_stock_alert":
      return t(lang, `${d.item_count} item(s) are low on stock`, `භාණ්ඩ ${d.item_count}ක් අඩු තොගයේ ඇත`);
    case "new_account_pending":
      return t(lang, `New registration: ${d.applicant_name}`, `නව ලියාපදිංචිය: ${d.applicant_name}`);
    default:
      return t(lang, "New notification", "නව දැනුම්දීම");
  }
}

export function NotificationBell({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [viewingNotification, setViewingNotification] = useState<AppNotification | null>(null);

async function handleNotificationClick(n: AppNotification) {
  if (!n.read_at) {
    await handleMarkRead(n.id);
  }
  setViewingNotification(n);
  setOpen(false); // close the dropdown, modal takes over
}

  useEffect(() => {
    refreshCount();
    const interval = setInterval(refreshCount, 60000); // poll every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function refreshCount() {
    try {
      setUnreadCount(await getUnreadCount());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      try {
        const response = await getNotifications({ per_page: 10 });
        setNotifications(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      refreshCount();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) => current.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl border border-gray-100 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-900">{t(lang, "Notifications", "දැනුම්දීම්")}</h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-[#4295D9] hover:underline">
                {t(lang, "Mark all read", "සියල්ල කියවූ ලෙස සලකුණු කරන්න")}
              </button>
            )}
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>
          ) : notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">{t(lang, "No notifications yet.", "දැනුම්දීම් නොමැත.")}</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read_at ? "bg-blue-50/50" : ""}`}
                >
                  <p className="text-xs text-gray-800">{describeNotification(n, lang)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {viewingNotification && (
        <NotificationDetailModal
          lang={lang}
          notification={viewingNotification}
          onClose={() => setViewingNotification(null)}
        />
      )}
    </div>
  );
}
import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "../../../services/notificationService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { NotificationDetailModal } from "./NotificationDetailModal";

function describeNotification(n: AppNotification, lang: Lang): string {
  const d = n.data;
  switch (d.type) {
    case "request_status_changed":
      return t(
        lang,
        `Request ${d.request_number} was ${d.action?.toLowerCase()}`,
        `ඉල්ලීම ${d.request_number} ${d.action}`,
      );
    case "request_needs_action":
      return t(
        lang,
        `Request ${d.request_number} needs your ${d.stage?.toLowerCase()}`,
        `ඉල්ලීම ${d.request_number} ඔබගේ ක්‍රියාව අපේක්ෂිතයි`,
      );
    case "item_update_status_changed":
      return t(
        lang,
        `Item update request ${d.action?.toLowerCase()}`,
        `භාණ්ඩ යාවත්කාලීන ඉල්ලීම ${d.action}`,
      );
    case "account_status_changed":
      return t(
        lang,
        `Your account was ${d.status?.toLowerCase()}`,
        `ඔබගේ ගිණුම ${d.status}`,
      );
    case "low_stock_alert":
      return t(
        lang,
        `${d.item_count} item(s) are low on stock`,
        `භාණ්ඩ ${d.item_count}ක් අඩු තොගයේ ඇත`,
      );
    case "new_account_pending":
      return t(
        lang,
        `New registration: ${d.applicant_name}`,
        `නව ලියාපදිංචිය: ${d.applicant_name}`,
      );
    case "vat_rate_status_changed":
      return t(
        lang,
        `VAT rate ${d.percentage}% was ${d.action?.toLowerCase()}`,
        `VAT අනුපාතය ${d.percentage}% ${d.action}`,
      );
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
  const [viewingNotification, setViewingNotification] =
    useState<AppNotification | null>(null);

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
      setNotifications((current) =>
        current.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      refreshCount();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((current) =>
        current.map((n) => ({ ...n, read_at: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button Icon */}
      <button
        onClick={handleOpen}
        type="button"
        title={t(lang, "Notifications", "දැනුම්දීම්")}
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer ${
          open
            ? "border-blue-500/40 bg-blue-50 text-blue-600 shadow-sm"
            : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-90 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {t(lang, "Notifications", "දැනුම්දීම්")}
              </h4>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                type="button"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>
                  {t(lang, "Mark all read", "සියල්ල කියවූ ලෙස සලකුණු කරන්න")}
                </span>
              </button>
            )}
          </div>

          {/* List Content Area */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-xs font-medium">
                  {t(lang, "Loading…", "පූරණය වෙමින්…")}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-500">
                  {t(lang, "No notifications yet.", "දැනුම්දීම් නොමැත.")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/80">
                {notifications.map((n) => {
                  const isUnread = !n.read_at;

                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group ${
                        isUnread ? "bg-blue-50/40" : "bg-white"
                      }`}
                    >
                      {/* Active unread indicator dot */}
                      <div className="pt-1 shrink-0">
                        <span
                          className={`block w-2 h-2 rounded-full ${
                            isUnread ? "bg-blue-600 ring-4 ring-blue-100" : "bg-transparent"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-snug transition-colors ${
                            isUnread
                              ? "font-semibold text-slate-900"
                              : "font-normal text-slate-600 group-hover:text-slate-900"
                          }`}
                        >
                          {describeNotification(n, lang)}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal Overlay */}
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
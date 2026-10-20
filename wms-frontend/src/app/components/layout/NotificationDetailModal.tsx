import { X, Bell, Calendar, User, AlertTriangle, Percent } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { AppNotification } from "../../../services/notificationService";

const FIELD_LABELS: Record<string, { en: string; si: string }> = {
  category_id: { en: "Category", si: "වර්ගය" },
  unit_id: { en: "Unit", si: "ඒකකය" },
  item_code: { en: "Item Code", si: "භාණ්ඩ කේතය" },
  name_en: { en: "Name", si: "නාමය" },
  description: { en: "Description", si: "විස්තරය" },
  barcode: { en: "Barcode", si: "බාර්කේතය" },
  reorder_level: { en: "Reorder Level", si: "නැවත ඇණවුම් මට්ටම" },
};

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

function actionColor(action?: string): string {
  switch (action) {
    case "APPROVED":
    case "ISSUED":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    case "REJECTED":
      return "bg-rose-50 text-rose-700 border-rose-200/80";
    case "RETURNED":
    case "PARTIALLY_ISSUED":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "RECOMMENDED":
      return "bg-blue-50 text-blue-700 border-blue-200/80";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200/80";
  }
}

function actorLabel(action: string | undefined, lang: Lang): string {
  switch (action) {
    case "RECOMMENDED":
      return t(lang, "Recommended by", "නිර්දේශ කළේ");
    case "APPROVED":
      return t(lang, "Approved by", "අනුමත කළේ");
    case "REJECTED":
      return t(lang, "Rejected by", "ප්‍රතික්ෂේප කළේ");
    case "RETURNED":
      return t(lang, "Returned by", "ආපසු එවූයේ");
    case "ISSUED":
    case "PARTIALLY_ISSUED":
      return t(lang, "Issued by", "නිකුත් කළේ");
    default:
      return t(lang, "Actioned by", "ක්‍රියා කළේ");
  }
}

export function NotificationDetailModal({
  lang,
  notification,
  onClose,
}: {
  lang: Lang;
  notification: AppNotification;
  onClose: () => void;
}) {
  const d = notification.data;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
      />

      {/* Centered Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Notification Details", "දැනුම්දීම් විස්තර")}
              </h3>
              <p className="text-[10px] font-mono font-bold text-slate-400">
                #{notification.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {d.type === "new_account_pending" && (
            <div className="space-y-3">
              <StatusBadge
                label={t(lang, "Pending Approval", "අනුමැතිය අපේක්ෂිතයි")}
                color="bg-amber-50 text-amber-700 border-amber-200/80"
              />

              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t(lang, "Applicant", "අයදුම්කරු")}
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {d.applicant_name}
                  {d.applicant_role && (
                    <span className="text-slate-400 font-medium"> · {d.applicant_role}</span>
                  )}
                </p>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {t(lang, "Username", "පරිශීලක නාමය")}
                </span>
                <p className="font-mono font-bold text-slate-800">@{d.username}</p>
              </div>
            </div>
          )}

          {(d.type === "request_status_changed" || d.type === "request_needs_action") && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {d.request_number}
                </span>
                {d.action && <StatusBadge label={d.action} color={actionColor(d.action)} />}
                {d.stage && (
                  <StatusBadge
                    label={d.stage}
                    color="bg-amber-50 text-amber-700 border-amber-200/80"
                  />
                )}
                {d.request_context && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    {d.request_context}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {d.requester_name && (
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium text-[10px] block">
                      {t(lang, "Requester", "ඉල්ලූ පුද්ගලයා")}
                    </span>
                    <p className="font-bold text-slate-900 truncate">
                      {d.requester_name}
                      {d.requester_role && (
                        <span className="text-slate-400 font-normal"> · {d.requester_role}</span>
                      )}
                    </p>
                  </div>
                )}

                {d.actor_name && (
                  <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-medium text-[10px] block">
                      {actorLabel(d.action, lang)}
                    </span>
                    <p className="font-bold text-slate-900 truncate">
                      {d.actor_name}
                      {d.actor_role && (
                        <span className="text-slate-400 font-normal"> · {d.actor_role}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {d.item_count !== undefined && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium text-[10px] block">
                    {t(lang, "Items", "භාණ්ඩ")}
                  </span>
                  <p className="font-bold text-slate-800">
                    {d.item_count} {t(lang, "item(s)", "අයිතම")}
                  </p>
                </div>
              )}

              {d.remarks && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {d.action === "REJECTED" || d.action === "RETURNED"
                      ? t(lang, "Reason", "හේතුව")
                      : t(lang, "Remarks", "අදහස්")}
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{d.remarks}</p>
                </div>
              )}
            </div>
          )}

          {d.type === "item_update_status_changed" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {d.item_code}
                </span>
                {d.action && <StatusBadge label={d.action} color={actionColor(d.action)} />}
              </div>

              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t(lang, "Item", "භාණ්ඩය")}
                </span>
                <p className="text-sm font-bold text-slate-900">{d.item_name}</p>
              </div>

              {d.actor_name && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium text-[10px] block">
                    {d.action === "APPROVED"
                      ? t(lang, "Approved by", "අනුමත කළේ")
                      : t(lang, "Rejected by", "ප්‍රතික්ෂේප කළේ")}
                  </span>
                  <p className="font-bold text-slate-900">
                    {d.actor_name}
                    {d.actor_role && (
                      <span className="text-slate-400 font-normal"> · {d.actor_role}</span>
                    )}
                  </p>
                </div>
              )}

              {d.reason && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                    {t(lang, "Original Reason for Change", "වෙනස සඳහා මුල් හේතුව")}
                  </span>
                  <p className="text-blue-900 font-medium leading-relaxed">{d.reason}</p>
                </div>
              )}

              {d.review_comment && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{d.review_comment}</p>
                </div>
              )}

              {d.old_values && d.new_values && (
                <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <tr>
                        <th className="px-3 py-2">{t(lang, "Field", "ක්ෂේත්‍රය")}</th>
                        <th className="px-3 py-2">{t(lang, "Old", "පැරණි")}</th>
                        <th className="px-3 py-2">{t(lang, "New", "නව")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.keys(FIELD_LABELS)
                        .filter(
                          (k) =>
                            String(d.old_values?.[k] ?? "") !== String(d.new_values?.[k] ?? "")
                        )
                        .map((k) => (
                          <tr key={k}>
                            <td className="px-3 py-2 font-bold text-slate-600">
                              {t(lang, FIELD_LABELS[k].en, FIELD_LABELS[k].si)}
                            </td>
                            <td className="px-3 py-2 text-rose-600 font-mono line-through">
                              {String(d.old_values?.[k] ?? "—")}
                            </td>
                            <td className="px-3 py-2 text-emerald-700 font-mono font-bold">
                              {String(d.new_values?.[k] ?? "—")}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {d.type === "account_status_changed" && (
            <div className="space-y-3">
              <StatusBadge
                label={d.status === "ACTIVE" ? t(lang, "Approved", "අනුමත") : t(lang, "Rejected", "ප්‍රතික්ෂේප")}
                color={actionColor(d.status)}
              />

              {d.actor_name && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium text-[10px] block">
                    {t(lang, "Actioned by", "ක්‍රියා කළේ")}
                  </span>
                  <p className="font-bold text-slate-900">{d.actor_name}</p>
                </div>
              )}

              {d.reason && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t(lang, "Reason", "හේතුව")}
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{d.reason}</p>
                </div>
              )}
            </div>
          )}

          {d.type === "low_stock_alert" && (
            <div className="space-y-3">
              <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">
                  {t(
                    lang,
                    `${d.division_name ? `${d.division_name}: ` : ""}${d.item_count ?? d.item_codes?.length ?? 0} low or out-of-stock item(s):`,
                    `භාණ්ඩ ${d.item_codes?.length ?? 0}ක් නැවත ඇණවුම් මට්ටමට වඩා පහළින්:`
                  )}
                </p>
              </div>

              <div className="space-y-1.5">
                {d.items?.length ? d.items.map((item: any) => (
                  <div key={item.item_code} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs">
                    <span><strong className="font-mono">{item.item_code}</strong> · {item.name}</span>
                    <span className={item.status === "out_of_stock" ? "font-semibold text-rose-700" : "font-semibold text-amber-700"}>
                      {item.status === "out_of_stock" ? "Out of stock" : "Low stock"} · {item.quantity_on_hand} on hand / {item.reorder_level} reorder
                    </span>
                  </div>
                )) : d.item_codes?.map((code: string) => (
                  <span key={code} className="inline-flex mr-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">{code}</span>
                ))}
              </div>
            </div>
          )}

          {d.type === "vat_rate_status_changed" && (
            <div className="space-y-3">
              <StatusBadge label={d.action ?? ""} color={actionColor(d.action)} />

              <div className="flex items-center gap-3 bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center text-blue-700 shrink-0 font-bold">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t(lang, "Proposed Rate", "යෝජිත අනුපාතය")}
                  </span>
                  <p className="text-base font-extrabold font-mono text-slate-900">
                    {d.percentage}%
                  </p>
                </div>
              </div>

              {d.requester_name && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium text-[10px] block">
                    {t(lang, "Requested by", "ඉල්ලූයේ")}
                  </span>
                  <p className="font-bold text-slate-900">{d.requester_name}</p>
                </div>
              )}

              {d.review_comment && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}
                  </span>
                  <p className="text-slate-800 font-medium leading-relaxed">{d.review_comment}</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(notification.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            {t(lang, "Close", "වසා දමන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}

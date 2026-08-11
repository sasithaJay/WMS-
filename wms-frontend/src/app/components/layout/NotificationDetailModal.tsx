

import { X } from "lucide-react";
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
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function actionColor(action?: string): string {
  switch (action) {
    case "APPROVED":
    case "ISSUED":
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "RETURNED":
    case "PARTIALLY_ISSUED":
      return "bg-orange-100 text-orange-700";
    case "RECOMMENDED":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-600";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 pb-0">
          <h3 className="text-base font-semibold text-gray-900">
            {t(lang, "Notification Details", "දැනුම්දීම් විස්තර")}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {d.type === "new_account_pending" && (
            <>
                <StatusBadge label={t(lang, "Pending Approval", "අනුමැතිය අපේක්ෂිතයි")} color="bg-amber-100 text-amber-700"/>

                <div>
                <p className="text-xs text-gray-500 mt-3">{t(lang, "Applicant", "අයදුම්කරු")}</p>
                <p className="text-sm font-medium text-gray-900">
                    {d.applicant_name}
                    {d.applicant_role && <span className="text-gray-400 font-normal"> · {d.applicant_role}</span>}
                </p>
                </div>

                <div>
                <p className="text-xs text-gray-500">{t(lang, "Username", "පරිශීලක නාමය")}</p>
                <p className="text-sm text-gray-800">@{d.username}</p>
                </div>
            </>
            )}


          {/* Request-related notifications */}
          {(d.type === "request_status_changed" || d.type === "request_needs_action") && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-gray-600">{d.request_number}</span>
                {d.action && <StatusBadge label={d.action} color={actionColor(d.action)} />}
                {d.stage && <StatusBadge label={d.stage} color="bg-amber-100 text-amber-700" />}
                {d.request_context && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                    {d.request_context}
                  </span>
                )}
              </div>

              {d.requester_name && (
                <div>
                  <p className="text-xs text-gray-500">{t(lang, "Requester", "ඉල්ලූ පුද්ගලයා")}</p>
                  <p className="text-sm font-medium text-gray-900">{d.requester_name}
                  {d.requester_role && <span className="text-gray-400 font-normal"> · {d.requester_role}</span>}
                  </p>
                </div>
              )}

              {d.actor_name && (
                <div>
                  <p className="text-xs text-gray-500">
                    {actorLabel(d.action, lang)}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {d.actor_name}
                    {d.actor_role && <span className="text-gray-400 font-normal"> · {d.actor_role}</span>}
                  </p>
                </div>
              )}

              {d.item_count !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">{t(lang, "Items", "භාණ්ඩ")}</p>
                  <p className="text-sm text-gray-900">{d.item_count} {t(lang, "item(s)", "අයිතම")}</p>
                </div>
              )}

              {d.remarks && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">
                    {d.action === "REJECTED" || d.action === "RETURNED"
                      ? t(lang, "Reason", "හේතුව")
                      : t(lang, "Remarks", "අදහස්")}
                  </p>
                  <p className="text-sm text-gray-800">{d.remarks}</p>
                </div>
              )}
            </>
          )}

          {/* Item update request notifications */}
          {d.type === "item_update_status_changed" && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-gray-600">{d.item_code}</span>
                {d.action && <StatusBadge label={d.action} color={actionColor(d.action)} />}
              </div>

              <div>
                <p className="text-xs text-gray-500">{t(lang, "Item", "භාණ්ඩය")}</p>
                <p className="text-sm font-medium text-gray-900">{d.item_name}</p>
              </div>

              {d.actor_name && (
                <div>
                    <p className="text-xs text-gray-500">
                    {d.action === "APPROVED"
                        ? t(lang, "Approved by", "අනුමත කළේ")
                        : t(lang, "Rejected by", "ප්‍රතික්ෂේප කළේ")}
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                    {d.actor_name}
                    {d.actor_role && <span className="text-gray-400 font-normal"> · {d.actor_role}</span>}
                    </p>
                </div>
            )}

              {d.reason && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{t(lang, "Original Reason for Change", "වෙනස සඳහා මුල් හේතුව")}</p>
                  <p className="text-sm text-gray-800">{d.reason}</p>
                </div>
              )}

              {d.review_comment && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}</p>
                  <p className="text-sm text-gray-800">{d.review_comment}</p>
                </div>
              )}

              {d.old_values && d.new_values && (
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase">
                      <tr>
                        <th className="px-3 py-2">{t(lang, "Field", "ක්ෂේත්‍රය")}</th>
                        <th className="px-3 py-2">{t(lang, "Old", "පැරණි")}</th>
                        <th className="px-3 py-2">{t(lang, "New", "නව")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.keys(FIELD_LABELS)
                        .filter((k) => String(d.old_values?.[k] ?? "") !== String(d.new_values?.[k] ?? ""))
                        .map((k) => (
                          <tr key={k}>
                            <td className="px-3 py-2 text-gray-500">{t(lang, FIELD_LABELS[k].en, FIELD_LABELS[k].si)}</td>
                            <td className="px-3 py-2 text-red-500 line-through">{String(d.old_values?.[k] ?? "—")}</td>
                            <td className="px-3 py-2 text-green-600 font-medium">{String(d.new_values?.[k] ?? "—")}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Account status notifications */}
          {d.type === "account_status_changed" && (
            <>
              <StatusBadge
                label={d.status === "ACTIVE" ? t(lang, "Approved", "අනුමත") : t(lang, "Rejected", "ප්‍රතික්ෂේප")}
                color={actionColor(d.status)}
              />
              {d.actor_name && (
                <div>
                  <p className="text-xs text-gray-500">{t(lang, "Actioned by", "ක්‍රියා කළේ")}</p>
                  <p className="text-sm font-medium text-gray-900">{d.actor_name}</p>
                </div>
              )}
              {d.reason && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{t(lang, "Reason", "හේතුව")}</p>
                  <p className="text-sm text-gray-800">{d.reason}</p>
                </div>
              )}
            </>
          )}

          {/* Low stock alert */}
          {d.type === "low_stock_alert" && (
            <>
              <p className="text-sm text-gray-800">
                {t(lang, `${d.item_codes?.length ?? 0} item(s) are at or below reorder level:`, `භාණ්ඩ ${d.item_codes?.length ?? 0}ක් නැවත ඇණවුම් මට්ටමට වඩා පහළින්:`)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {d.item_codes?.map((code) => (
                  <span key={code} className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {code}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
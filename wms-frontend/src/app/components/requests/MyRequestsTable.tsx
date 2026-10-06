import { useEffect, useState, useCallback } from "react";
import {
  PlusCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Package,
  Inbox,
  Building2,
} from "lucide-react";
import { getStockRequests } from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import type {
  StockRequest,
  StockRequestItemView,
  StockRequestStatus,
} from "../../types/stockRequests";

function ItemChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border bg-blue-50/70 text-blue-700 border-blue-100">
      {label}
    </span>
  );
}

function itemStatusClass(status: StockRequestItemView["approval_status"]): string {
  if (status === "approved") return "text-emerald-700";
  if (status === "rejected") return "text-rose-700";
  return "text-amber-700";
}

const STATUS_STYLES: Record<StockRequestStatus, string> = {
  PENDING_RECOMMENDATION: "bg-amber-50 text-amber-700 border-amber-200/80",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200/80",
  PARTIALLY_PROCESSED: "bg-orange-50 text-orange-700 border-orange-200/80",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200/80",
  ISSUED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/80",
  RETURNED: "bg-orange-50 text-orange-700 border-orange-200/80",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<
  StockRequestStatus,
  { en: string; si: string }
> = {
  PENDING_RECOMMENDATION: {
    en: "Pending Recommendation",
    si: "නිර්දේශය අපේක්ෂිතයි",
  },
  PENDING_APPROVAL: { en: "Pending Approval", si: "අනුමැතිය අපේක්ෂිතයි" },
  PARTIALLY_PROCESSED: { en: "Partially Processed", si: "කොටසක් සකස් කර ඇත" },
  APPROVED: { en: "Approved", si: "අනුමත" },
  ISSUED: { en: "Issued", si: "නිකුත් කරන ලදී" },
  REJECTED: { en: "Rejected", si: "ප්‍රතික්ෂේප" },
  RETURNED: { en: "Returned", si: "ආපසු එවන ලදී" },
  CANCELLED: { en: "Cancelled", si: "අවලංගු" },
};

type RequestTab = "personal" | "section" | "ds_office" | "institution";

export function MyRequestsTable({
  lang,
  role,
  onNewRequest,
  refreshSignal = 0,
}: {
  lang: Lang;
  role: Role;
  onNewRequest?: () => void;
  refreshSignal?: number;
}) {
  const isFa = role === "SECTION_HEAD";
  const isAo = role === "ADMINISTRATIVE_OFFICER";
  const isInstitution = role === "INSTITUTION";

  const [tab, setTab] = useState<RequestTab>(
    isInstitution ? "institution" : "personal"
  );
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getStockRequests({ per_page: 50 });
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load your requests.",
          "ඔබගේ ඉල්ලීම් පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (refreshSignal > 0) {
      loadRequests();
    }
  }, [refreshSignal, loadRequests]);

  const availableTabs: RequestTab[] = isFa
    ? ["personal", "section"]
    : isAo
    ? ["personal", "ds_office"]
    : isInstitution
    ? ["institution"]
    : ["personal"];

  const visibleRequests = requests.filter((r) => {
    if (tab === "personal") return r.request_context === "PERSONAL";
    if (tab === "section") return r.request_context === "SECTION_COMMON";
    if (tab === "ds_office") return r.request_context === "DS_OFFICE";
    if (tab === "institution") return r.request_context === "INSTITUTION";
    return false;
  });

  const tabLabel = (tb: RequestTab) => {
    if (tb === "personal") return t(lang, "Personal", "පෞද්ගලික");
    if (tb === "section")
      return t(lang, "Section (Common Use)", "අංශ (පොදු)");
    if (tb === "ds_office")
      return t(lang, "DS Offices", "ප්‍රාදේශීය ලේකම් කාර්යාල");
    return t(lang, "My Requests", "මගේ ඉල්ලීම්");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Scrollable Tabs for Mobile */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {availableTabs.map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                tab === tb
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tabLabel(tb)}
            </button>
          ))}
        </div>

        {/* Action Button */}
        {onNewRequest && (
          <button
            type="button"
            onClick={onNewRequest}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t(lang, "New Request", "නව ඉල්ලීම")}</span>
          </button>
        )}
      </div>

      {/* CONTEXT INFORMATION ALERTS */}
      {tab === "personal" && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-3 text-xs text-blue-800 font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {t(
              lang,
              "You may submit one personal request per month.",
              "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය."
            )}
          </span>
        </div>
      )}

      {tab === "ds_office" && (
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-3 text-xs text-blue-800 font-medium flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {t(
              lang,
              "Each Divisional Secretary Office may submit one request per year.",
              "එක් එක් ප්‍රාදේශීය ලේකම් කාර්යාලයට වසරකට එක් ඉල්ලීමක් ඉදිරිපත් කළ හැක."
            )}
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TABLE / CARD VIEW WRAPPER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3">
                  {t(lang, "Date", "දිනය")}
                </th>
                <th className="px-5 py-3">
                  {t(lang, "Reference No.", "යොමු අංකය")}
                </th>
                {tab === "ds_office" && (
                  <th className="px-5 py-3">
                    {t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය")}
                  </th>
                )}
                <th className="px-5 py-3">
                  {t(lang, "Items", "භාණ්ඩ")}
                </th>
                <th className="px-5 py-3">
                  {t(lang, "Status", "තත්ත්වය")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && (
                <tr>
                  <td
                    colSpan={tab === "ds_office" ? 5 : 4}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-semibold">
                        {t(lang, "Loading…", "පූරණය වෙමින්…")}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && visibleRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={tab === "ds_office" ? 5 : 4}
                    className="px-5 py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-500">
                        {tab === "ds_office"
                          ? t(
                              lang,
                              "No DS Office requests yet.",
                              "ප්‍රාදේශීය ලේකම් කාර්යාල ඉල්ලීම් නොමැත."
                            )
                          : t(lang, "No requests yet.", "ඉල්ලීම් නොමැත.")}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                visibleRequests.map((r) => {
                  const label = STATUS_LABELS[r.status];
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {r.submitted_at
                          ? new Date(r.submitted_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {r.request_number}
                      </td>
                      {tab === "ds_office" && (
                        <td className="px-5 py-3.5 text-slate-800 font-semibold">
                          {r.ds_office
                            ? t(
                                lang,
                                r.ds_office.name_en,
                                r.ds_office.name_si
                              )
                            : r.organization?.name ?? "-"}
                        </td>
                      )}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {(r.items ?? []).map((it) => (
                            <div key={it.id} className="space-y-1">
                              <ItemChip label={it.item.name_en} />
                              <div className="text-[10px] text-slate-500">
                                {t(lang, "Requested", "ඉල්ලූ")}: {it.quantity_requested}
                                {it.quantity_approved !== null && ` | ${t(lang, "Approved", "අනුමත")}: ${it.quantity_approved}`}
                                  {it.approval_status && <span className={`font-bold ${itemStatusClass(it.approval_status)}`}> | {t(lang, it.approval_status, it.approval_status)}</span>}
                              </div>
                              {it.rejection_reason && <div className="text-[10px] font-semibold text-rose-600">{it.rejection_reason}</div>}
                            </div>
                          ))}
                          {r.items_count !== undefined && !r.items && (
                            <span className="text-xs text-slate-400 font-medium">
                              {r.items_count} items
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            STATUS_STYLES[r.status]
                          }`}
                        >
                          {t(lang, label.en, label.si)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (<md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">
                {t(lang, "Loading…", "පූරණය වෙමින්…")}
              </span>
            </div>
          )}

          {!loading && visibleRequests.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {tab === "ds_office"
                  ? t(
                      lang,
                      "No DS Office requests yet.",
                      "ප්‍රාදේශීය ලේකම් කාර්යාල ඉල්ලීම් නොමැත."
                    )
                  : t(lang, "No requests yet.", "ඉල්ලීම් නොමැත.")}
              </p>
            </div>
          )}

          {!loading &&
            visibleRequests.map((r) => {
              const label = STATUS_LABELS[r.status];

              return (
                <div key={r.id} className="p-4 space-y-3 bg-white">
                  {/* Top Bar: Ref & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {r.request_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        STATUS_STYLES[r.status]
                      }`}
                    >
                      {t(lang, label.en, label.si)}
                    </span>
                  </div>

                  {/* DS Office Info (If applicable) */}
                  {tab === "ds_office" && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {r.ds_office
                          ? t(
                              lang,
                              r.ds_office.name_en,
                              r.ds_office.name_si
                            )
                          : r.organization?.name ?? "-"}
                      </span>
                    </div>
                  )}

                  {/* Items Chip List */}
                  <div className="flex flex-wrap gap-1">
                    {(r.items ?? []).map((it) => (
                      <div key={it.id} className="space-y-1">
                        <ItemChip label={it.item.name_en} />
                        <div className="text-[10px] text-slate-500">
                          {t(lang, "Requested", "ඉල්ලූ")}: {it.quantity_requested}
                          {it.quantity_approved !== null && ` | ${t(lang, "Approved", "අනුමත")}: ${it.quantity_approved}`}
                          {it.approval_status && <span className={`font-bold ${itemStatusClass(it.approval_status)}`}> | {t(lang, it.approval_status, it.approval_status)}</span>}
                        </div>
                        {it.rejection_reason && <div className="text-[10px] font-semibold text-rose-600">{it.rejection_reason}</div>}
                      </div>
                    ))}
                    {r.items_count !== undefined && !r.items && (
                      <span className="text-xs text-slate-400 font-medium">
                        {r.items_count} items
                      </span>
                    )}
                  </div>

                  {/* Date Footer */}
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 pt-1 border-t border-slate-50">
                    <Calendar className="w-3.5 h-3.5 text-slate-300" />
                    <span>
                      {r.submitted_at
                        ? new Date(r.submitted_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
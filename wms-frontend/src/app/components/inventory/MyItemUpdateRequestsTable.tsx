import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Loader2, AlertCircle, Calendar, MessageSquare } from "lucide-react";
import { getMyItemUpdateRequests } from "../../../services/itemUpdateRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { ItemUpdateRequest, ItemUpdateRequestStatus } from "../../types/itemUpdateRequests";

const STATUS_STYLES: Record<ItemUpdateRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const STATUS_LABELS: Record<ItemUpdateRequestStatus, { en: string; si: string }> = {
  PENDING: { en: "Pending Review", si: "සමාලෝචනය අපේක්ෂිතයි" },
  APPROVED: { en: "Approved", si: "අනුමත" },
  REJECTED: { en: "Rejected", si: "ප්‍රතික්ෂේප" },
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

interface MyItemUpdateRequestsTableProps {
  lang: Lang;
  refreshSignal?: number;
}

export function MyItemUpdateRequestsTable({ lang, refreshSignal = 0 }: MyItemUpdateRequestsTableProps) {
  const [requests, setRequests] = useState<ItemUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getMyItemUpdateRequests({ per_page: 50 });
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load your update requests.", "ඔබගේ යාවත්කාලීන ඉල්ලීම් පූරණය කළ නොහැක."));
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

  if (loading && requests.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">{t(lang, "Loading requests…", "පූරණය වෙමින්…")}</p>
      </div>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <EmptyState
          icon={<ClipboardList className="w-10 h-10 text-slate-300" />}
          title={t(lang, "No update requests yet", "යාවත්කාලීන ඉල්ලීම් නොමැත")}
          subtitle={t(
            lang,
            "Item update requests you submit will appear here.",
            "ඔබ ඉදිරිපත් කරන භාණ්ඩ යාවත්කාලීන ඉල්ලීම් මෙහි දිස්වේ."
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONTAINER FOR DESKTOP TABLE & MOBILE CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 whitespace-nowrap">{t(lang, "Date", "දිනය")}</th>
                <th className="px-5 py-3 whitespace-nowrap">{t(lang, "Item", "භාණ්ඩය")}</th>
                <th className="px-5 py-3 whitespace-nowrap">{t(lang, "Reason", "හේතුව")}</th>
                <th className="px-5 py-3 whitespace-nowrap">{t(lang, "Status", "තත්ත්වය")}</th>
                <th className="px-5 py-3 whitespace-nowrap">{t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {requests.map((r) => {
                const label = STATUS_LABELS[r.status];
                return (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-bold text-slate-900">{r.item?.name_en ?? "-"}</div>
                      <div className="font-mono text-[10px] font-semibold text-slate-400 mt-0.5">
                        {r.item?.item_code ?? "-"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium max-w-xs truncate" title={r.reason}>
                      {r.reason}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLES[r.status]}`}
                      >
                        {t(lang, label.en, label.si)}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-slate-500 font-medium max-w-xs truncate"
                      title={r.review_comment ?? ""}
                    >
                      {r.review_comment ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (<md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {requests.map((r) => {
            const label = STATUS_LABELS[r.status];
            return (
              <div key={r.id} className="p-4 space-y-3 bg-white">
                {/* Header: Item & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                      {r.item?.item_code ?? "-"}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{r.item?.name_en ?? "-"}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[r.status]}`}
                  >
                    {t(lang, label.en, label.si)}
                  </span>
                </div>

                {/* Reason Section */}
                <div className="text-xs font-medium text-slate-600 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {t(lang, "Reason", "හේතුව")}
                  </span>
                  <p className="break-words">{r.reason}</p>
                </div>

                {/* Reviewer Comment if Present */}
                {r.review_comment && (
                  <div className="text-xs font-medium text-slate-600 bg-blue-50/40 p-2.5 rounded-xl border border-blue-100/60 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                        {t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}
                      </span>
                      <p className="text-slate-700 mt-0.5">{r.review_comment}</p>
                    </div>
                  </div>
                )}

                {/* Card Footer: Date */}
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 pt-1 border-t border-slate-50">
                  <Calendar className="w-3.5 h-3.5 text-slate-300" />
                  <span>{formatDate(r.created_at)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
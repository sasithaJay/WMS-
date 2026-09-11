import { useEffect, useState, useCallback } from "react";
import { Loader2, Percent, Inbox, Calendar, MessageSquare } from "lucide-react";
import { t } from "../../constants/translations";
import { getMyVatRequests } from "../../../services/vatRateService";
import type { Lang } from "../../types";
import type { VatRate, VatRateStatus } from "../../types/vatRate";

const STATUS_STYLES: Record<VatRateStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/80",
};

const STATUS_LABELS: Record<VatRateStatus, { en: string; si: string }> = {
  PENDING: { en: "Pending Review", si: "සමාලෝචනය අපේක්ෂිතයි" },
  APPROVED: { en: "Approved", si: "අනුමත" },
  REJECTED: { en: "Rejected", si: "ප්‍රතික්ෂේප" },
};

interface MyVatRequestsTableProps {
  lang: Lang;
  refreshSignal?: number;
}

export function MyVatRequestsTable({
  lang,
  refreshSignal = 0,
}: MyVatRequestsTableProps) {
  const [requests, setRequests] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      const response = await getMyVatRequests();
      setRequests(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [requests.length]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (refreshSignal > 0) loadRequests();
  }, [refreshSignal, loadRequests]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border border-slate-200/80">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
          <Inbox className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {t(
            lang,
            "No VAT rate change requests yet.",
            "VAT අනුපාත වෙනස් කිරීමේ ඉල්ලීම් නොමැත."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* DESKTOP TABLE VIEW (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="px-5 py-3.5 whitespace-nowrap">
                {t(lang, "Date", "දිනය")}
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                {t(lang, "Proposed Rate", "යෝජිත අනුපාතය")}
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                {t(lang, "Status", "තත්ත්වය")}
              </th>
              <th className="px-5 py-3.5 whitespace-nowrap">
                {t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {requests.map((r) => {
              const label = STATUS_LABELS[r.status];
              return (
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 text-slate-500 font-mono whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                    {Number(r.percentage)}%
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        STATUS_STYLES[r.status]
                      }`}
                    >
                      {t(lang, label.en, label.si)}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3.5 text-slate-500 max-w-xs truncate"
                    title={r.review_comment ?? ""}
                  >
                    {r.review_comment ?? "—"}
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
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t(lang, "Proposed Rate", "යෝජිත අනුපාතය")}
                    </span>
                    <h4 className="font-mono text-sm font-extrabold text-slate-900">
                      {Number(r.percentage)}%
                    </h4>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    STATUS_STYLES[r.status]
                  }`}
                >
                  {t(lang, label.en, label.si)}
                </span>
              </div>

              {/* Info Details */}
              <div className="grid grid-cols-1 gap-2 text-xs bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    {t(lang, "Requested Date", "ඉල්ලූ දිනය")}
                  </span>
                  <span className="font-mono font-bold text-slate-700">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                {r.review_comment && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස")}
                    </span>
                    <p className="text-slate-700 font-medium leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
                      {r.review_comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
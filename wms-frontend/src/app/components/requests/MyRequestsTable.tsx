import { useEffect, useState, useCallback } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";
import { getStockRequests } from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import type { StockRequest, StockRequestStatus } from "../../types/stockRequests";

function ItemChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#EBF4FD] text-[#4295D9] border-blue-100">
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<StockRequestStatus, string> = {
  PENDING_RECOMMENDATION: "bg-amber-100 text-amber-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  ISSUED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  RETURNED: "bg-orange-100 text-orange-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<StockRequestStatus, { en: string; si: string }> = {
  PENDING_RECOMMENDATION: { en: "Pending Recommendation", si: "නිර්දේශය අපේක්ෂිතයි" },
  PENDING_APPROVAL: { en: "Pending Approval", si: "අනුමැතිය අපේක්ෂිතයි" },
  APPROVED: { en: "Approved", si: "අනුමත" },
  ISSUED: { en: "Issued", si: "නිකුත් කරන ලදී" },
  REJECTED: { en: "Rejected", si: "ප්‍රතික්ෂේප" },
  RETURNED: { en: "Returned", si: "ආපසු එවන ලදී" },
  CANCELLED: { en: "Cancelled", si: "අවලංගු" },
};

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
  const [tab, setTab] = useState<"personal" | "section">("personal");
  const isFA = role === "SECTION_HEAD";

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
        t(lang, "Unable to load your requests.", "ඔබගේ ඉල්ලීම් පූරණය කළ නොහැක."),
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshSignal > 0) {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const visibleRequests = requests.filter((r) =>
    tab === "personal" ? r.request_context === "PERSONAL" : r.request_context === "SECTION_COMMON",
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(isFA ? (["personal", "section"] as const) : (["personal"] as const)).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === tb ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {tb === "personal"
                ? t(lang, "Personal", "පෞද්ගලික")
                : t(lang, "Section (Common Use)", "අංශ (පොදු)")}
            </button>
          ))}
        </div>
        {onNewRequest && (
          <button
            onClick={onNewRequest}
            className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t(lang, "New Request", "නව ඉල්ලීම")}
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t(lang, "You may submit one personal request per month.", "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය.")}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                t(lang, "Date", "දිනය"),
                t(lang, "Reference No.", "යොමු අංකය"),
                t(lang, "Items", "භාණ්ඩ"),
                t(lang, "Status", "තත්ත්වය"),
              ].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  {t(lang, "Loading…", "පූරණය වෙමින්…")}
                </td>
              </tr>
            )}

            {!loading && visibleRequests.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  {t(lang, "No requests yet.", "ඉල්ලීම් නොමැත.")}
                </td>
              </tr>
            )}

            {!loading &&
              visibleRequests.map((r) => {
                const label = STATUS_LABELS[r.status];
                return (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">
                      {r.request_number}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(r.items ?? []).map((it) => (
                          <ItemChip key={it.id} label={it.item.item_code} />
                        ))}
                        {r.items_count !== undefined && !r.items && (
                          <span className="text-xs text-gray-400">{r.items_count} items</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>
                        {t(lang, label.en, label.si)}
                      </span>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
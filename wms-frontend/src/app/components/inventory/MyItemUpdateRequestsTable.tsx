import { useEffect, useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";
import { getMyItemUpdateRequests } from "../../../services/itemUpdateRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { ItemUpdateRequest, ItemUpdateRequestStatus } from "../../types/itemUpdateRequests";

const STATUS_STYLES: Record<ItemUpdateRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

  if (loading) {
    return <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>;
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<ClipboardList className="w-9 h-9 text-gray-300" />}
        title={t(lang, "No update requests yet", "යාවත්කාලීන ඉල්ලීම් නොමැත")}
        subtitle={t(lang, "Item update requests you submit will appear here.", "ඔබ ඉදිරිපත් කරන භාණ්ඩ යාවත්කාලීන ඉල්ලීම් මෙහි දිස්වේ.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                t(lang, "Date", "දිනය"),
                t(lang, "Item", "භාණ්ඩය"),
                t(lang, "Reason", "හේතුව"),
                t(lang, "Status", "තත්ත්වය"),
                t(lang, "Reviewer Comment", "සමාලෝචකයාගේ අදහස"),
              ].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.map((r) => {
              const label = STATUS_LABELS[r.status];
              return (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-sm font-medium text-gray-900">{r.item?.name_en}</div>
                    <div className="font-mono text-xs text-gray-400">{r.item?.item_code}</div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs max-w-xs truncate" title={r.reason}>
                    {r.reason}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>
                      {t(lang, label.en, label.si)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs max-w-xs truncate" title={r.review_comment ?? ""}>
                    {r.review_comment ?? "-"}
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
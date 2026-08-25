import { useEffect, useState, useCallback } from "react";
import { t } from "../../constants/translations";
import { getMyVatRequests } from "../../../services/vatRateService";
import type { Lang } from "../../types";
import type { VatRate, VatRateStatus } from "../../types/vatRate";

const STATUS_STYLES: Record<VatRateStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

export function MyVatRequestsTable({ lang, refreshSignal = 0 }: MyVatRequestsTableProps) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshSignal > 0) loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  if (loading) {
    return <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>;
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6 text-center">
        {t(lang, "No VAT rate change requests yet.", "VAT අනුපාත වෙනස් කිරීමේ ඉල්ලීම් නොමැත.")}
      </p>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {[
              t(lang, "Date", "දිනය"),
              t(lang, "Proposed Rate", "යෝජිත අනුපාතය"),
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
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-900">{Number(r.percentage)}%</td>
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
  );
}
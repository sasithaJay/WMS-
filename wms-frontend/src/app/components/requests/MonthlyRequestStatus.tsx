import { useEffect, useState, useCallback } from "react";
import { PlusCircle, ClipboardList, Clock, CheckCircle, Package, ArrowRight, AlertCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import { getStockRequests, getPendingRecommendation } from "../../../services/stockRequestService";
import { PendingRequestTable } from "../dashboard/PendingRequestTable";
import type { Lang, Role } from "../../types";
import type { StockRequest, StockRequestStatus } from "../../types/stockRequests";
import type { ActionRequiredItem } from "../../types/dashboard";

function ItemSummary(request: StockRequest): string {
  const items = request.items ?? [];
  const codes = items.slice(0, 2).map((it) => it.item.item_code).join(", ");
  const extra = items.length > 2 ? ` +${items.length - 2}` : "";
  return codes;
}

function toActionItem(r: StockRequest): ActionRequiredItem {
  return {
    id: r.id,
    request_number: r.request_number,
    requester_name: r.requester?.name ?? `#${r.requester_id}`,
    request_context: r.request_context,
    stage: "RECOMMENDATION",
    submitted_at: r.submitted_at,
    item_summary: ItemSummary(r),
  };
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

export function MonthlyRequestStatus({
  lang,
  role,
  onNewRequest,
  onViewAll,
  onNavigate,
}: {
  lang: Lang;
  role: Role;
  onNewRequest?: () => void;
  onViewAll?: () => void;
  onNavigate?: (navId: string) => void;
}) {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionItems, setActionItems] = useState<ActionRequiredItem[]>([]);
  const [loadingActionItems, setLoadingActionItems] = useState(false);

  const isSectionHead = role === "SECTION_HEAD";

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getStockRequests({ per_page: 100 });
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load your requests.", "ඔබගේ ඉල්ලීම් පූරණය කළ නොහැක."));
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
    if (!isSectionHead) return;

    async function loadActionItems() {
      try {
        setLoadingActionItems(true);
        const response = await getPendingRecommendation({ per_page: 5 });
        setActionItems(response.data.map(toActionItem));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingActionItems(false);
      }
    }

    loadActionItems();
  }, [isSectionHead]);

  const now = new Date();
  const thisMonthRequests = requests.filter((r) => {
    const date = r.submitted_at ? new Date(r.submitted_at) : new Date(r.created_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const pendingCount = requests.filter(
    (r) => r.status === "PENDING_RECOMMENDATION" || r.status === "PENDING_APPROVAL",
  ).length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const issuedCount = requests.filter((r) => r.status === "ISSUED").length;

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const statusCounts = (Object.keys(STATUS_LABELS) as StockRequestStatus[]).map((status) => ({
    status,
    count: requests.filter((r) => r.status === status).length,
  }));

  if (loading) {
    return <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t(lang, "Requests This Month", "මාසේ ඉල්ලීම්")}
          value={String(thisMonthRequests.length)}
          color="blue"
          icon={<ClipboardList className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Pending", "අපේක්ෂිත")}
          value={String(pendingCount)}
          color="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Approved", "අනුමත")}
          value={String(approvedCount)}
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Issued", "ලබාදුන්")}
          value={String(issuedCount)}
          color="purple"
          icon={<Package className="w-5 h-5" />}
        />
      </div>

      {isSectionHead && !loadingActionItems && onNavigate && (
        <PendingRequestTable lang={lang} items={actionItems} onNavigate={onNavigate} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "My Requests", "මගේ ඉල්ලීම්")}</h3>
          </div>

          {recentRequests.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              {t(lang, "No requests yet.", "ඉල්ලීම් නොමැත.")}
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentRequests.map((r) => {
                const label = STATUS_LABELS[r.status];
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {ItemSummary(r) || r.request_number}
                      </div>
                      <div className="text-xs text-gray-400">
                        {r.request_number} · {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "-"}
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[r.status]}`}>
                      {t(lang, label.en, label.si)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {onViewAll && (
            <div className="px-5 py-3 border-t border-gray-100">
              <button
                onClick={onViewAll}
                className="text-xs text-[#4295D9] font-medium hover:underline flex items-center gap-1"
              >
                {t(lang, "View all requests", "සියලු ඉල්ලීම් බලන්න")} <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">{t(lang, "New Request", "නව ඉල්ලීම")}</h3>
            <p className="text-xs text-gray-500 mb-4">
              {t(
                lang,
                "You may submit one personal request per month.",
                "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය.",
              )}
            </p>
            <button
              onClick={onNewRequest}
              className="w-full py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">{t(lang, "Request Status", "ඉල්ලීම් තත්ත්වය")}</h3>
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="flex items-center justify-between py-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
                  {t(lang, STATUS_LABELS[status].en, STATUS_LABELS[status].si)}
                </span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
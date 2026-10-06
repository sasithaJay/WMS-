import { useEffect, useState, useCallback } from "react";
import {
  PlusCircle,
  ClipboardList,
  Clock,
  CheckCircle,
  Package,
  ArrowRight,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import {
  getStockRequests,
  getPendingRecommendation,
} from "../../../services/stockRequestService";
import { PendingRequestTable } from "../dashboard/PendingRequestTable";
import type { Lang, Role } from "../../types";
import type { StockRequest, StockRequestStatus } from "../../types/stockRequests";
import type { ActionRequiredItem } from "../../types/dashboard";

function ItemSummary(request: StockRequest): string {
  const items = request.items ?? [];
  const codes = items.slice(0, 2).map((it) => it.item.item_code).join(", ");
  const extra = items.length > 2 ? ` +${items.length - 2}` : "";
  return codes + extra;
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
  PENDING_RECOMMENDATION: "bg-amber-50 text-amber-700 border-amber-200/80",
  PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200/80",
  PARTIALLY_PROCESSED: "bg-orange-50 text-orange-700 border-orange-200/80",
  PARTIALLY_ISSUED: "bg-blue-50 text-blue-700 border-blue-200/80",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200/80",
  ISSUED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  REJECTED: "bg-rose-50 text-rose-700 border-rose-200/80",
  RETURNED: "bg-amber-50 text-amber-700 border-amber-200/80",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200/80",
};

const STATUS_LABELS: Record<StockRequestStatus, { en: string; si: string }> = {
  PENDING_RECOMMENDATION: { en: "Pending Recommendation", si: "නිර්දේශය අපේක්ෂිතයි" },
  PENDING_APPROVAL: { en: "Pending Approval", si: "අනුමැතිය අපේක්ෂිතයි" },
  PARTIALLY_PROCESSED: { en: "Partially Processed", si: "කොටසක් සකස් කර ඇත" },
  PARTIALLY_ISSUED: { en: "Partially Issued", si: "කොටසක් නිකුත් කර ඇත" },
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
      setError(
        t(lang, "Unable to load your requests.", "ඔබගේ ඉල්ලීම් පූරණය කළ නොහැක.")
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

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
    (r) => r.status === "PENDING_RECOMMENDATION" || r.status === "PENDING_APPROVAL"
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
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border border-slate-200/80">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label={t(lang, "Requests This Month", "මාසේ ඉල්ලීම්")}
          value={String(thisMonthRequests.length)}
          color="blue"
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          label={t(lang, "Pending", "අපේක්ෂිත")}
          value={String(pendingCount)}
          color="amber"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
        />
        <StatCard
          label={t(lang, "Approved", "අනුමත")}
          value={String(approvedCount)}
          color="green"
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
        />
        <StatCard
          label={t(lang, "Issued", "ලබාදුන්")}
          value={String(issuedCount)}
          color="purple"
          icon={<Package className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* SECTION HEAD ACTIONABLE TABLE */}
      {isSectionHead && !loadingActionItems && onNavigate && (
        <PendingRequestTable lang={lang} items={actionItems} onNavigate={onNavigate} />
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* RECENT REQUESTS LIST */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {t(lang, "My Requests", "මගේ ඉල්ලීම්")}
              </h3>
            </div>

            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400">
                {t(lang, "No requests yet.", "ඉල්ලීම් නොමැත.")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentRequests.map((r) => {
                  const label = STATUS_LABELS[r.status];
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-slate-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {ItemSummary(r) || r.request_number}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                          <span className="font-mono font-semibold text-slate-500">
                            {r.request_number}
                          </span>{" "}
                          ·{" "}
                          {r.submitted_at
                            ? new Date(r.submitted_at).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                          STATUS_STYLES[r.status]
                        }`}
                      >
                        {t(lang, label.en, label.si)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {onViewAll && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>{t(lang, "View all requests", "සියලු ඉල්ලීම් බලන්න")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR CALL-TO-ACTIONS & STATS */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* NEW REQUEST BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {t(lang, "New Request", "නව ඉල්ලීම")}
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5 leading-relaxed">
                {t(
                  lang,
                  "You may submit one personal request per month.",
                  "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය."
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={onNewRequest}
              className="w-full h-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}</span>
            </button>
          </div>

          {/* REQUEST STATUS SUMMARY BREAKDOWN */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2.5">
              {t(lang, "Request Status", "ඉල්ලීම් තත්ත්වය")}
            </h3>

            <div className="space-y-2">
              {statusCounts.map(({ status, count }) => (
                <div
                  key={status}
                  className="flex items-center justify-between py-1 border-b border-slate-100/60 last:border-b-0"
                >
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[status]}`}
                  >
                    {t(lang, STATUS_LABELS[status].en, STATUS_LABELS[status].si)}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
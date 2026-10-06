import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, User, X } from "lucide-react";
import {
  getPendingRecommendation,
  recommendStockRequest,
  rejectStockRequest,
} from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest, StockRequestUser } from "../../types/stockRequests";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";
import { getInventoryBalances, type InventoryBalanceInfo } from "../../../services/InventoryBalanceService";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

type QuantityDraft = Record<number, Record<number, string>>;

export function RecommendationQueue({ lang }: { lang: Lang }) {
  const { triggerBadgeRefresh } = useBadgeRefresh();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [drafts, setDrafts] = useState<QuantityDraft>({});

  const [balances, setBalances] = useState<Record<number, InventoryBalanceInfo>>({});
  const [sessionCommitted, setSessionCommitted] = useState<Record<number, number>>({});

  const loadQueue = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");
      const response = await getPendingRecommendation({ per_page: 50 });
      setRequests(response.data);

      setDrafts((current) => {
        const next = { ...current };
        response.data.forEach((r) => {
          if (!next[r.id]) {
            next[r.id] = {};
            (r.items ?? []).forEach((it) => {
              next[r.id][it.item_id] = String(Number(it.quantity_requested));
            });
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to load the recommendation queue.", "නිර්දේශ පෝලිම පූරණය කළ නොහැක."),
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [lang]);

  useEffect(() => {
    loadQueue(true);
  }, [loadQueue]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadQueue(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadQueue]);

  useEffect(() => {
    const allItemIds = Array.from(
      new Set(requests.flatMap((r) => (r.items ?? []).map((it) => it.item_id))),
    );
    if (allItemIds.length > 0) {
      getInventoryBalances(allItemIds).then(setBalances);
    }
  }, [requests]);

  function liveAvailable(itemId: number): number | null {
    const base = balances[itemId]?.available;
    if (base === undefined) return null;
    const committed = sessionCommitted[itemId] ?? 0;
    return Math.max(0, base - committed);
  }

  function setDraftQuantity(requestId: number, itemId: number, value: string) {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        ...current[requestId],
        [itemId]: value,
      },
    }));
  }

  function getRequesterName(requester: StockRequestUser | undefined, fallbackId: number): string {
    if (requester?.name) {
      return requester.name;
    }
    return `#${requester?.id ?? fallbackId}`;
  }

  function isDraftValid(request: StockRequest): boolean {
    const itemDrafts = drafts[request.id] ?? {};
    return (request.items ?? []).every((it) => {
      const qty = Number(itemDrafts[it.item_id]);
      return Number.isFinite(qty) && qty > 0;
    });
  }

  async function handleRecommend(request: StockRequest) {
    if (!isDraftValid(request)) {
      setError(
        t(lang, "Recommended quantities must be greater than zero.", "නිර්දේශිත ප්‍රමාණ ශුන්‍යයට වඩා වැඩි විය යුතුය."),
      );
      return;
    }

    const itemDrafts = drafts[request.id] ?? {};
    const items = (request.items ?? []).map((it) => ({
      item_id: it.item_id,
      quantity: Number(itemDrafts[it.item_id]),
    }));

    try {
      setBusyId(request.id);
      setError("");
      await recommendStockRequest(request.id, { items });
      setRequests((current) => current.filter((r) => r.id !== request.id));
      setSessionCommitted((current) => {
        const next = { ...current };
        items.forEach(({ item_id, quantity }) => {
          next[item_id] = (next[item_id] ?? 0) + quantity;
        });
        return next;
      });
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to recommend this request. Please try again.", "මෙම ඉල්ලීම නිර්දේශ කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) return;

    try {
      setBusyId(id);
      setError("");
      await rejectStockRequest(id, rejectReason);
      setRequests((current) => current.filter((r) => r.id !== id));
      setRejectingId(null);
      setRejectReason("");
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to reject this request. Please try again.", "මෙම ඉල්ලීම ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border border-slate-200/80">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">{t(lang, "Loading queue…", "පූරණය වෙමින්…")}</p>
      </div>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
        title={t(lang, "Queue is empty", "පෝලිම හිස්")}
        subtitle={t(lang, "All recommendation requests have been processed.", "සියලු නිර්දේශ ඉල්ලීම් සකස් කර ඇත.")}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-center justify-between">
        <p className="text-xs font-bold text-slate-700">
          {requests.length} {t(lang, "request(s) awaiting your recommendation", "ඉල්ලීමක් ඔබගේ නිර්දේශය බලා සිටී")}
        </p>
      </div>

      <div className="space-y-4">
        {requests.map((r) => {
          const requesterName = getRequesterName(r.requester, r.requester_id);
          const roleLabel = r.requester?.role_label;

          return (
            <section
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 text-slate-800">
                    {r.request_number}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-800 text-xs font-bold">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{requesterName}</span>
                    {roleLabel && (
                      <span className="text-[11px] font-semibold text-slate-500 border border-slate-300 bg-slate-100 px-2 py-0.5 rounded-md">
                        {roleLabel}
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                    {t(lang, "Pending Recommendation", "නිර්දේශ අපේක්ෂිත")}
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    {r.request_context}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-400">{formatDate(r.submitted_at)}</span>
              </div>

              {r.notes && (
                <p className="text-xs italic text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  "{r.notes}"
                </p>
              )}

              {/* Table Structure */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Stock Status", "තොග තත්වය")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Requested", "ඉල්ලූ")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Recommend Qty", "නිර්දේශිත ප්‍රමාණය")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(r.items ?? []).map((it) => {
                      const avail = liveAvailable(it.item_id);
                      const requestedQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                      const short = avail !== null && requestedQty > avail;
                      const isZeroStock = avail === 0;

                      return (
                        <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-mono text-[10px] font-bold text-slate-400 block">{it.item.item_code}</span>
                            <span className="font-bold text-slate-900">{it.item.name_en}</span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {avail !== null ? (
                              <span className={`inline-block font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                isZeroStock || short ? "bg-rose-100 text-rose-800 border border-rose-300" : "text-green-800 bg-green-200 border border-green-400/50"
                              }`}>
                                {isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${avail} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {Number(it.quantity_requested)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={drafts[r.id]?.[it.item_id] ?? ""}
                              onChange={(e) => setDraftQuantity(r.id, it.item_id, e.target.value)}
                              className="h-8 w-20 mx-auto rounded-lg border border-slate-200 bg-white text-center font-mono font-bold text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(r.id)}
                  disabled={busyId === r.id}
                  className="h-9 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold text-rose-600 transition-all cursor-pointer disabled:opacity-50"
                >
                  {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>
                <button
                  type="button"
                  onClick={() => handleRecommend(r)}
                  disabled={busyId === r.id || !isDraftValid(r)}
                  className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {busyId === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{t(lang, "Recommend", "නිර්දේශ")}</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>

      {/* Reject Modal Dialog */}
      {rejectingId !== null && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
          <div
            onClick={() => {
              setRejectingId(null);
              setRejectReason("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Reject this request?", "මෙම ඉල්ලීම ප්‍රතික්ෂේප කරන්නද?")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Reason", "හේතුව")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={t(lang, "Why is this being rejected?", "ප්‍රතික්ෂේප කිරීමට හේතුව?")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim() || busyId === rejectingId}
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {busyId === rejectingId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t(lang, "Confirm Rejection", "ප්‍රතික්ෂේපය තහවුරු කරන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
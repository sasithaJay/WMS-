import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Loader2, User, X, MessageSquare, Calendar } from "lucide-react";
import { approveStockRequestItem, getPendingApproval, rejectStockRequestItem } from "../../../services/stockRequestService";
import { getInventoryBalances, type InventoryBalanceInfo } from "../../../services/InventoryBalanceService";
import { t } from "../../constants/translations";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";
import type { Lang } from "../../types";
import type { StockRequest, StockRequestItemView } from "../../types/stockRequests";
import { EmptyState } from "../common/EmptyState";

function baselineQuantity(item: StockRequestItemView): number {
  return Number(item.quantity_recommended ?? item.quantity_requested);
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
    const errors = response?.data?.errors;
    const validationMessage = errors ? Object.values(errors).flat()[0] : undefined;
    return validationMessage ?? response?.data?.message ?? fallback;
  }
  return fallback;
}

export function ApprovalQueue({ lang }: { lang: Lang }) {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [comments, setComments] = useState<Record<number, string>>({});
  const [balances, setBalances] = useState<Record<number, InventoryBalanceInfo>>({});
  const [busyItemId, setBusyItemId] = useState<number | null>(null);
  const [rejectingItem, setRejectingItem] = useState<StockRequestItemView | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [validationError, setValidationError] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { triggerBadgeRefresh } = useBadgeRefresh();

  const loadQueue = useCallback(async () => {
    try {
      setLoading(requests.length === 0);
      setError("");
      const response = await getPendingApproval({ per_page: 50 });
      setRequests(response.data
        .map((request) => ({
          ...request,
          items: (request.items ?? []).filter((item) => item.approval_status === "pending"),
        }))
        .filter((request) => (request.items ?? []).length > 0));
      setDrafts((current) => {
        const next = { ...current };
        response.data.forEach((request) => (request.items ?? []).forEach((item) => {
          if (next[item.id] === undefined) next[item.id] = String(baselineQuantity(item));
        }));
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load the approval queue.", "අනුමැති පෝලිම පූරණය කළ නොහැක."));
    } finally {
      setLoading(false);
    }
  }, [lang, requests.length]);

  useEffect(() => { void loadQueue(); }, [loadQueue]);

  useEffect(() => {
    const byDivision = new Map<number, Set<number>>();
    requests.forEach((request) => {
      const itemIds = byDivision.get(request.division_id) ?? new Set<number>();
      (request.items ?? []).forEach((item) => itemIds.add(item.item_id));
      byDivision.set(request.division_id, itemIds);
    });
    byDivision.forEach((itemIds, divisionId) => {
      void getInventoryBalances([...itemIds], divisionId).then((result) => {
        setBalances((current) => ({ ...current, ...result }));
      });
    });
  }, [requests]);

  function updateDraft(itemId: number, value: string) {
    setDrafts((current) => ({ ...current, [itemId]: value }));
  }

  async function handleApprove(request: StockRequest, item: StockRequestItemView) {
    const quantity = Number(drafts[item.id]);
    const maximum = baselineQuantity(item);
    const changed = quantity !== maximum;
    const remarks = comments[item.id]?.trim() ?? "";
    if (!Number.isFinite(quantity) || quantity <= 0 || quantity > maximum) {
      setValidationError((current) => ({ ...current, [item.id]: t(lang, "Approved quantity must be greater than 0 and no more than the recommended quantity.", "අනුමත ප්‍රමාණය 0 ට වඩා වැඩි සහ නිර්දේශිත ප්‍රමාණයට වඩා වැඩි නොවිය යුතුය.") }));
      return;
    }
    if (changed && !remarks) {
      setValidationError((current) => ({ ...current, [item.id]: t(lang, "Please enter a reason for changing the quantity.", "ප්‍රමාණය වෙනස් කිරීමට හේතුවක් ඇතුළත් කරන්න.") }));
      return;
    }
    try {
      setBusyItemId(item.id);
      await approveStockRequestItem(item.id, { quantity, remarks: changed ? remarks : undefined });
      setRequests((current) => current.map((candidate) => candidate.id === request.id
        ? { ...candidate, items: (candidate.items ?? []).filter((candidateItem) => candidateItem.id !== item.id) }
        : candidate).filter((candidate) => (candidate.items ?? []).length > 0));
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, t(lang, "Unable to approve this item. Please try again.", "මෙම භාණ්ඩය අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න.")));
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleReject() {
    if (!rejectingItem || !rejectReason.trim()) return;
    const itemId = rejectingItem.id;
    try {
      setBusyItemId(itemId);
      await rejectStockRequestItem(itemId, rejectReason.trim());
      setRequests((current) => current.map((request) => ({
        ...request,
        items: (request.items ?? []).filter((item) => item.id !== itemId),
      })).filter((request) => (request.items ?? []).length > 0));
      setRejectingItem(null);
      setRejectReason("");
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, t(lang, "Unable to reject this item. Please try again.", "මෙම භාණ්ඩය ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න.")));
    } finally {
      setBusyItemId(null);
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

  if (requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
        title={t(lang, "No pending approvals", "අනුමත ඉල්ලීම් නැත")}
        subtitle={t(lang, "All items have been processed.", "සියලු භාණ්ඩ සකස් කර ඇත.")}
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
          {requests.length} {t(lang, "request(s) awaiting your approval", "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී")}
        </p>
      </div>

      {/* Single Master Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                <th className="py-3.5 px-4 text-center">{t(lang, "Stock Status", "තොග තත්වය")}</th>
                <th className="py-3.5 px-4 text-center">{t(lang, "Recommended", "නිර්දේශිත")}</th>
                <th className="py-3.5 px-4 text-center">{t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}</th>
                <th className="py-3.5 px-4 text-right">{t(lang, "Actions", "ක්‍රියා")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {requests.map((request) => {
                const requesterName = request.requester?.name ?? `#${request.requester_id}`;
                const roleLabel = request.requester?.role_label;

                return (
                  <>

                    <tr key={`req-${request.id}`} className="bg-slate-300 text-slate-800 border-t-4 border-slate-300">
                      <td colSpan={5} className="py-3 px-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-white px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200 tracking-wide shadow-2xs">
                              {request.request_number}
                            </span>
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold flex-wrap">
                              <span className="flex items-center gap-1 text-slate-900 font-bold">
                                <User className="h-3.5 w-3.5 text-blue-600" />
                                {requesterName}
                              </span>
                              {roleLabel && (
                                <span className="text-[11px] text-slate-600 border border-slate-300 bg-white/70 px-2 py-0.5 rounded-md">
                                  {roleLabel}
                                </span>
                              )}
                              <span className="rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 text-[11px] font-bold">
                                {request.request_context}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-mono">
                            <Calendar className="h-3.5 w-3.5 text-slate-500" />
                            <span>{formatDate(request.submitted_at)}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Request Items Rows */}
                    {(request.items ?? []).map((item) => {
                      const maximum = baselineQuantity(item);
                      const balance = balances[item.item_id];
                      const availableQty = balance?.available ?? 0;
                      const isZeroStock = availableQty === 0;
                      const quantity = Number(drafts[item.id]);
                      const changed = quantity !== maximum;

                      return (
                        <tr key={`item-${item.id}`} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono text-[10px] font-bold text-slate-400 block mb-0.5">{item.item.item_code}</span>
                            <span className="font-bold text-slate-900 text-sm">{item.item.name_en}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center align-top">
                            {balance ? (
                              <span className={`inline-block font-bold px-2.5 py-1 rounded-md text-[11px] ${
                                isZeroStock ? "bg-rose-100 text-rose-800 border border-rose-300" : "text-emerald-800 bg-emerald-100 border border-emerald-300"
                              }`}>
                                {isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${availableQty} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center align-top">
                            <span className="inline-block font-bold px-3 py-1 rounded-md text-xs bg-slate-100 text-slate-800 border border-slate-200">
                              {maximum}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center align-top">
                            <div className="flex flex-col items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                max={maximum}
                                value={drafts[item.id] ?? ""}
                                onChange={(event) => updateDraft(item.id, event.target.value)}
                                className="h-9 w-20 rounded-xl border border-slate-200 bg-white text-center font-mono font-bold text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              {changed && (
                                <div className="w-full max-w-[200px] animate-in fade-in flex items-center gap-1.5 bg-amber-50 border border-amber-200 p-1 rounded-lg">
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-1" />
                                  <input
                                    value={comments[item.id] ?? ""}
                                    onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))}
                                    placeholder={t(lang, "Reason for change", "වෙනස් කිරීමට හේතුව")}
                                    className="h-7 w-full bg-transparent px-1 text-[11px] font-medium text-slate-900 outline-none placeholder:text-amber-700/60"
                                  />
                                </div>
                              )}
                              {validationError[item.id] && (
                                <p className="text-[10px] font-bold text-rose-600 max-w-[180px]">{validationError[item.id]}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right align-top">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => { setRejectingItem(item); setRejectReason(""); }}
                                disabled={busyItemId === item.id}
                                className="h-9 px-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold text-rose-600 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleApprove(request, item)}
                                disabled={busyItemId === item.id}
                                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {busyItemId === item.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                <Check className="h-3.5 w-3.5" />
                                <span>{t(lang, "Approve", "අනුමත")}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECT MODAL DIALOG */}
      {rejectingItem && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
          <div
            onClick={() => setRejectingItem(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Reject Item", "භාණ්ඩය ප්‍රතික්ෂේප කරන්න")}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-2xl">
              <strong className="text-slate-900">{rejectingItem.item.name_en}</strong>
              <span className="block mt-1 font-mono text-[11px] text-slate-400">
                {t(lang, "Requested Quantity", "ඉල්ලූ ප්‍රමාණය")}: {rejectingItem.quantity_requested}
              </span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Rejection Reason", "ප්‍රතික්ෂේප කිරීමට හේතුව")}
              </label>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                placeholder={t(lang, "Enter rejection reason...", "ප්‍රතික්ෂේප හේතුව ඇතුළත් කරන්න...")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>
              <button
                type="button"
                onClick={() => void handleReject()}
                disabled={!rejectReason.trim() || busyItemId === rejectingItem.id}
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {busyItemId === rejectingItem.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t(lang, "Confirm Reject", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

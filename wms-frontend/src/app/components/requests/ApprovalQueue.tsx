import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, User } from "lucide-react";
import {
  getPendingApproval,
  approveStockRequest,
  rejectStockRequest,
} from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest } from "../../types/stockRequests";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";
import {
  getInventoryBalances,
  type InventoryBalanceInfo,
} from "../../../services/InventoryBalanceService";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

type QuantityDraft = Record<number, Record<number, string>>;

function baselineQuantity(item: {
  quantity_recommended: string | null;
  quantity_requested: string;
}): number {
  return item.quantity_recommended !== null
    ? Number(item.quantity_recommended)
    : Number(item.quantity_requested);
}

export function ApprovalQueue({ lang }: { lang: Lang }) {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const { triggerBadgeRefresh } = useBadgeRefresh();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [drafts, setDrafts] = useState<QuantityDraft>({});
  const [qtyChangeComments, setQtyChangeComments] = useState<
    Record<number, string>
  >({});
  const [validationError, setValidationError] = useState<
    Record<number, string>
  >({});

  const [balances, setBalances] = useState<
    Record<number, InventoryBalanceInfo>
  >({});

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingApproval({ per_page: 50 });
      setRequests(response.data);

      setDrafts((current) => {
        const next = { ...current };
        response.data.forEach((r) => {
          if (!next[r.id]) {
            next[r.id] = {};
            (r.items ?? []).forEach((it) => {
              next[r.id][it.item_id] = String(baselineQuantity(it));
            });
          }
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load the approval queue.",
          "අනුමැති පෝලිම පූරණය කළ නොහැක.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    const byDivision = new Map<number, Set<number>>();

    requests.forEach((r) => {
      if (!byDivision.has(r.division_id)) {
        byDivision.set(r.division_id, new Set());
      }
      (r.items ?? []).forEach((it) =>
        byDivision.get(r.division_id)!.add(it.item_id),
      );
    });

    byDivision.forEach((itemIdSet, divisionId) => {
      getInventoryBalances(Array.from(itemIdSet), divisionId).then(
        (result) => {
          setBalances((prev) => ({ ...prev, ...result }));
        },
      );
    });
  }, [requests]);

  function setDraftQuantity(
    requestId: number,
    itemId: number,
    value: string,
  ) {
    setDrafts((current) => ({
      ...current,
      [requestId]: {
        ...current[requestId],
        [itemId]: value,
      },
    }));
  }

  function hasQuantityChanges(request: StockRequest): boolean {
    const itemDrafts = drafts[request.id] ?? {};
    return (request.items ?? []).some((it) => {
      const draftQty = Number(itemDrafts[it.item_id]);
      return draftQty !== baselineQuantity(it);
    });
  }

  async function handleApprove(request: StockRequest) {
    const itemDrafts = drafts[request.id] ?? {};
    const items = (request.items ?? []).map((it) => ({
      item_id: it.item_id,
      quantity: Number(itemDrafts[it.item_id]),
    }));

    const invalid = (request.items ?? []).some((it) => {
      const qty = Number(itemDrafts[it.item_id]);
      return !Number.isFinite(qty) || qty < 0 || qty > baselineQuantity(it);
    });

    if (invalid) {
      setValidationError((v) => ({
        ...v,
        [request.id]: t(
          lang,
          "Approved quantity must be between 0 and the recommended quantity.",
          "අනුමත ප්‍රමාණය 0 සහ නිර්දේශිත ප්‍රමාණය අතර විය යුතුය.",
        ),
      }));
      return;
    }

    const changed = hasQuantityChanges(request);
    const comment = qtyChangeComments[request.id]?.trim() ?? "";

    if (changed && !comment) {
      setValidationError((v) => ({
        ...v,
        [request.id]: t(
          lang,
          "Please enter a reason for changing the quantity.",
          "ප්‍රමාණය වෙනස් කිරීමට හේතුවක් ඇතුළත් කරන්න.",
        ),
      }));
      return;
    }

    setValidationError((v) => ({ ...v, [request.id]: "" }));

    try {
      setBusyId(request.id);
      setError("");
      await approveStockRequest(request.id, {
        items,
        remarks: changed ? comment : undefined,
      });
      setRequests((current) => current.filter((r) => r.id !== request.id));
      const remainingSameDivision = requests.filter(
        (r) => r.id !== request.id && r.division_id === request.division_id,
      );
      const itemIds = Array.from(
        new Set(
          remainingSameDivision.flatMap((r) =>
            (r.items ?? []).map((it) => it.item_id),
          ),
        ),
      );
      if (itemIds.length > 0) {
        getInventoryBalances(itemIds, request.division_id).then((result) => {
          setBalances((prev) => ({ ...prev, ...result }));
        });
      }
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to approve this request. Please try again.",
          "මෙම ඉල්ලීම අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න.",
        ),
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
        t(
          lang,
          "Unable to reject this request. Please try again.",
          "මෙම ඉල්ලීම ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading queue…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
        title={t(lang, "No pending approvals", "අනුමත ඉල්ලීම් නැත")}
        subtitle={t(
          lang,
          "All requests have been processed.",
          "සියලු ඉල්ලීම් සකස් කර ඇත.",
        )}
      />
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {requests.length}{" "}
          {t(
            lang,
            "request(s) awaiting your approval",
            "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී",
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((r) => {
          const changed = hasQuantityChanges(r);

          return (
            <div
              key={r.id}
              className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300"
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    {r.request_number}
                  </span>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
                    {t(lang, "Pending Approval", "අනුමත අපේක්ෂිත")}
                  </span>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-bold">
                    {r.request_context}
                  </span>
                </div>

                {/* Requester Info */}
                <div className="flex items-center justify-between mt-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {r.requester?.name ?? `#${r.requester_id}`}
                      {r.requester?.role_label && (
                        <span className="ml-1.5 text-xs font-semibold text-slate-500">
                          ({r.requester.role_label})
                        </span>
                      )}
                    </p>
                  </div>

                  <span className="text-[11px] font-medium text-slate-400">
                    {formatDate(r.submitted_at)}
                  </span>
                </div>

                {r.notes && (
                  <p className="mt-2 mb-4 text-xs italic text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    "{r.notes}"
                  </p>
                )}

                {/* Items Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 my-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-3.5 py-2.5">
                          {t(lang, "Item", "භාණ්ඩය")}
                        </th>
                        <th className="px-3.5 py-2.5 text-center">
                          {t(lang, "Recommended", "නිර්දේශිත")}
                        </th>
                        <th className="px-3.5 py-2.5 text-center">
                          {t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}
                        </th>
                        <th className="px-3.5 py-2.5 text-center">
                          {t(lang, "Available", "ලබාගත හැකි")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(r.items ?? []).map((it) => {
                        const maxLimit = baselineQuantity(it);
                        const draftVal = Number(
                          drafts[r.id]?.[it.item_id] ?? 0,
                        );
                        const balance = balances[it.item_id];
                        const isOverLimit =
                          draftVal < 0 || draftVal > maxLimit;
                        const isShortStock =
                          balance && draftVal > balance.available;

                        return (
                          <tr
                            key={it.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-3.5 py-3 font-semibold text-slate-800">
                              {it.item.item_code} — {it.item.name_en}
                            </td>

                            <td className="px-3.5 py-3 text-center font-medium text-slate-500">
                              {maxLimit}
                            </td>

                            <td className="px-3.5 py-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxLimit}
                                value={drafts[r.id]?.[it.item_id] ?? ""}
                                onChange={(e) =>
                                  setDraftQuantity(
                                    r.id,
                                    it.item_id,
                                    e.target.value,
                                  )
                                }
                                className={`w-18 h-8 rounded-lg border text-center text-xs font-bold outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isOverLimit
                                    ? "border-rose-500 bg-rose-50/50 text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                    : "border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                                }`}
                              />
                            </td>

                            <td className="px-3.5 py-3 text-center">
                              {balance ? (
                                <span
                                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                    isShortStock
                                      ? "bg-rose-50 text-rose-600 font-bold border border-rose-100"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {t(
                                    lang,
                                    `${balance.available} in stock`,
                                    `තොගයේ ${balance.available}`,
                                  )}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-2.5 text-xs font-medium text-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    {t(
                      lang,
                      "You may reduce quantities before approving.",
                      "අනුමත කිරීමට පෙර ප්‍රමාණ අඩු කළ හැකිය.",
                    )}
                  </span>
                </div>

                {/* Animated Reason Input Box */}
                {changed && (
                  <div className="mb-4 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      {t(
                        lang,
                        "Reason for quantity change",
                        "ප්‍රමාණය වෙනස් කිරීමට හේතුව",
                      )}
                    </label>

                    <textarea
                      value={qtyChangeComments[r.id] ?? ""}
                      onChange={(e) =>
                        setQtyChangeComments((prev) => ({
                          ...prev,
                          [r.id]: e.target.value,
                        }))
                      }
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                      placeholder={t(
                        lang,
                        "Example: Only partial stock is available.",
                        "උදාහරණය: තොගයේ පවතින්නේ කොටස් ප්‍රමාණයක් පමණි.",
                      )}
                    />
                  </div>
                )}

                {validationError[r.id] && (
                  <p className="mb-3 text-xs font-semibold text-rose-600">
                    {validationError[r.id]}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(r.id);
                    setRejectReason("");
                  }}
                  disabled={busyId === r.id}
                  className="h-9 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(r)}
                  disabled={busyId === r.id}
                  className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-xs hover:shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {busyId === r.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t(lang, "Processing…", "සකසමින්…")}</span>
                    </>
                  ) : (
                    <span>{t(lang, "Approve", "අනුමත")}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectingId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">
                {t(lang, "Reject Request", "ඉල්ලීම ප්‍රතික්ෂේප කරන්න")}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              {t(
                lang,
                "Please enter the reason for rejecting this request.",
                "මෙම ඉල්ලීම ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න.",
              )}
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
              placeholder={t(
                lang,
                "Enter reject reason...",
                "ප්‍රතික්ෂේප හේතුව ඇතුළත් කරන්න...",
              )}
            />

            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                disabled={busyId === rejectingId}
                className="flex-1 h-9 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-50 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>

              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim() || busyId === rejectingId}
                className="flex-1 h-9 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {busyId === rejectingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>
                    {t(
                      lang,
                      "Confirm Reject",
                      "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න",
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
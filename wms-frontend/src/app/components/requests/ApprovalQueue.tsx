import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, X, CheckSquare, Square, Check, User } from "lucide-react";
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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
          "අනුමැති පෝලිම පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [lang, requests.length]);

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
        byDivision.get(r.division_id)!.add(it.item_id)
      );
    });

    byDivision.forEach((itemIdSet, divisionId) => {
      getInventoryBalances(Array.from(itemIdSet), divisionId).then(
        (result) => {
          setBalances((prev) => ({ ...prev, ...result }));
        }
      );
    });
  }, [requests]);

  function setDraftQuantity(
    requestId: number,
    itemId: number,
    value: string
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

  function toggleSelectAll() {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  }

  function toggleSelectRow(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
          "අනුමත ප්‍රමාණය 0 සහ නිර්දේශිත ප්‍රමාණය අතර විය යුතුය."
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
          "ප්‍රමාණය වෙනස් කිරීමට හේතුවක් ඇතුළත් කරන්න."
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
      setSelectedIds((prev) => prev.filter((i) => i !== request.id));
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to approve this request. Please try again.",
          "මෙම ඉල්ලීම අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleBulkApprove() {
    for (const id of selectedIds) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        await handleApprove(req);
      }
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) return;

    try {
      setBusyId(id);
      setError("");
      await rejectStockRequest(id, rejectReason);
      setRequests((current) => current.filter((r) => r.id !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      setRejectingId(null);
      setRejectReason("");
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to reject this request. Please try again.",
          "මෙම ඉල්ලීම ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border border-slate-200/80">
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
          "සියලු ඉල්ලීම් සකස් කර ඇත."
        )}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* HEADER BAR & BATCH ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <p className="text-xs font-bold text-slate-700">
          {requests.length}{" "}
          {t(
            lang,
            "request(s) awaiting your approval",
            "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී"
          )}
        </p>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 font-mono">
              {selectedIds.length} selected
            </span>
            <button
              type="button"
              onClick={handleBulkApprove}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t(lang, "Approve Selected", "තෝරාගත් අනුමත කරන්න")}</span>
            </button>
          </div>
        )}
      </div>

      {/* DESKTOP VIEW: MASTER DATA TABLE (md+) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {selectedIds.length === requests.length &&
                    requests.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap">
                  {t(lang, "Request / Requester", "ඉල්ලීම / ඉල්ලුම්කරු")}
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap">
                  {t(lang, "Items & Quantities", "භාණ්ඩ සහ ප්‍රමාණයන්")}
                </th>
                <th className="px-4 py-3.5 whitespace-nowrap">
                  {t(lang, "Notes / Justification", "සටහන්")}
                </th>
                <th className="px-4 py-3.5 text-right whitespace-nowrap">
                  {t(lang, "Actions", "ක්‍රියා")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {requests.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                const changed = hasQuantityChanges(r);

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isSelected ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4 text-center align-top">
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(r.id)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer mt-1"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* Request & Requester Info */}
                    <td className="px-4 py-4 align-top space-y-1.5 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                          {r.request_number}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                          {r.request_context}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 pt-0.5 text-slate-800 font-bold">
                        <span>{r.requester?.name ?? `#${r.requester_id}`}</span>
                        {r.requester?.role_label && (
                          <span className="text-slate-400 font-normal">
                            · {r.requester.role_label}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 font-mono">
                        {formatDate(r.submitted_at)}
                      </p>
                    </td>

                    {/* Multiple Items & Quantities Editor */}
                    <td className="px-4 py-4 align-top min-w-[320px]">
                      <div className="space-y-3">
                        {(r.items ?? []).map((it) => {
                          const maxLimit = baselineQuantity(it);
                          const draftVal = Number(
                            drafts[r.id]?.[it.item_id] ?? 0
                          );
                          const balance = balances[it.item_id];
                          const availableQty = balance?.available ?? 0;
                          const isZeroStock = availableQty === 0;
                          const isOverLimit =
                            draftVal < 0 || draftVal > maxLimit;
                          const isShortStock = draftVal > availableQty;

                          return (
                            <div
                              key={it.id}
                              className="bg-slate-100 p-2.5 rounded-xl border border-slate-100 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-800">
                                  {it.item.item_code} — {it.item.name_en}
                                </span>
                                {balance && (
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                      isZeroStock
                                        ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                                        : isShortStock
                                        ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {isZeroStock
                                      ? t(lang, "Out of stock (0)", "තොග නොමැත (0)")
                                      : `${availableQty} in stock`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span>
                                  {t(lang, "Recommended", "නිර්දේශිත")}:{" "}
                                  <strong className="text-slate-700 font-mono">
                                    {maxLimit}
                                  </strong>
                                </span>

                                <div className="flex items-center gap-1.5 ml-auto">
                                  <label className=" text-[12px] font-bold text-slate-600">
                                    {t(lang, "Approve Qty", "අනුමත")}
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxLimit}
                                    value={drafts[r.id]?.[it.item_id] ?? ""}
                                    onChange={(e) =>
                                      setDraftQuantity(
                                        r.id,
                                        it.item_id,
                                        e.target.value
                                      )
                                    }
                                    className={`w-16 h-7 rounded-lg border text-center text-sm font-mono font-bold outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                      isOverLimit
                                        ? "border-rose-500 bg-rose-50 text-rose-700"
                                        : "border-slate-200 bg-white text-slate-900 focus:border-blue-500"
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Quantity Change Reason Box */}
                      {changed && (
                        <div className="mt-3 space-y-1 animate-in fade-in">
                          <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            {t(
                              lang,
                              "Reason for quantity change required",
                              "ප්‍රමාණය වෙනස් කිරීමට හේතුව අවශ්‍යයි"
                            )}
                          </label>
                          <input
                            type="text"
                            value={qtyChangeComments[r.id] ?? ""}
                            onChange={(e) =>
                              setQtyChangeComments((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder={t(
                              lang,
                              "Enter reason...",
                              "හේතුව ඇතුළත් කරන්න..."
                            )}
                            className="w-full h-8 px-3 rounded-lg border border-amber-200 bg-amber-50/40 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-500"
                          />
                        </div>
                      )}

                      {validationError[r.id] && (
                        <p className="mt-1 text-[11px] font-bold text-rose-600">
                          {validationError[r.id]}
                        </p>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-4 align-top text-slate-500 italic text-[11px] max-w-[200px]">
                      {r.notes ? `"${r.notes}"` : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(r.id);
                            setRejectReason("");
                          }}
                          disabled={busyId === r.id}
                          className="h-8 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(r)}
                          disabled={busyId === r.id}
                          className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-xs"
                        >
                          {busyId === r.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{t(lang, "Approve", "අනුමත")}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE VIEW: CARD-LIKE LAYOUT WITH AVAILABLE STOCK COLUMN (<md) */}
      <div className="block md:hidden space-y-4">
        {requests.map((r) => {
          const changed = hasQuantityChanges(r);

          return (
            <div
              key={r.id}
              className="flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200"
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

                {/* Items Card Sub-list with Available Column */}
                <div className="overflow-hidden rounded-xl border border-slate-200/80 my-4">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="px-3 py-2.5">
                          {t(lang, "Item", "භාණ්ඩය")}
                        </th>
                        <th className="px-2 py-2.5 text-center">
                          {t(lang, "Recommeded Qty", "නිර්දේශිත")}
                        </th>
                        <th className="px-2 py-2.5 text-center">
                          {t(lang, "Approve Qty", "අනුමත")}
                        </th>
                        <th className="px-2 py-2.5 text-center">
                          {t(lang, "Available", "ලබාගත හැකි")}
                        </th>
                        
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(r.items ?? []).map((it) => {
                        const maxLimit = baselineQuantity(it);
                        const draftVal = Number(
                          drafts[r.id]?.[it.item_id] ?? 0
                        );
                        const balance = balances[it.item_id];
                        const availableQty = balance?.available ?? 0;
                        const isZeroStock = availableQty === 0;
                        const isOverLimit =
                          draftVal < 0 || draftVal > maxLimit;

                        return (
                          <tr
                            key={it.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-3 py-3 font-semibold text-slate-800">
                              <div>{it.item.name_en}</div>
                              <span className="font-mono text-[10px] text-slate-400">
                                {it.item.item_code}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-slate-800">
                              <div>{maxLimit}</div>
                            
                            </td>

                            <td className="px-2 py-3 text-center">
                              <input
                                type="number"
                                min={0}
                                max={maxLimit}
                                value={drafts[r.id]?.[it.item_id] ?? ""}
                                onChange={(e) =>
                                  setDraftQuantity(
                                    r.id,
                                    it.item_id,
                                    e.target.value
                                  )
                                }
                                className={`w-14 h-8 rounded-lg border text-center text-xs font-bold outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                  isOverLimit
                                    ? "border-rose-500 bg-rose-50/50 text-rose-700"
                                    : "border-slate-200 bg-slate-50 text-slate-900"
                                }`}
                              />
                            </td>

                            <td className="px-2 py-3 text-center">
                              {balance ? (
                                <span
                                  className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                    isZeroStock
                                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                                      : "text-slate-600"
                                  }`}
                                >
                                  {isZeroStock ? "0 (Out)" : availableQty}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Animated Reason Input Box */}
                {changed && (
                  <div className="mb-4 transition-all duration-300">
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">
                      {t(
                        lang,
                        "Reason for quantity change",
                        "ප්‍රමාණය වෙනස් කිරීමට හේතුව"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                      placeholder={t(
                        lang,
                        "Example: Only partial stock is available.",
                        "උදාහරණය: තොගයේ පවතින්නේ කොටස් ප්‍රමාණයක් පමණි."
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
                  className="h-9 px-4 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-xs font-bold text-rose-600 transition-all cursor-pointer"
                >
                  {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(r)}
                  disabled={busyId === r.id}
                  className="h-9 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {busyId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{t(lang, "Approve", "අනුමත")}</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* REJECT MODAL DIALOG */}
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
                {t(lang, "Reject Request", "ඉල්ලීම ප්‍රතික්ෂේප කරන්න")}
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

            <p className="text-xs font-medium text-slate-500">
              {t(
                lang,
                "Please enter the reason for rejecting this request.",
                "මෙම ඉල්ලීම ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න."
              )}
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
              placeholder={t(
                lang,
                "Enter reject reason...",
                "ප්‍රතික්ෂේප හේතුව ඇතුළත් කරන්න..."
              )}
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                disabled={busyId === rejectingId}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>

              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim() || busyId === rejectingId}
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {busyId === rejectingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {t(
                    lang,
                    "Confirm Reject",
                    "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න"
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from "react";
import { Calendar, Check, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Loader2, User, X } from "lucide-react";
import {
  getPendingRecommendation,
  recommendStockRequestItem,
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

  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [busyItemIds, setBusyItemIds] = useState<Set<number>>(() => new Set());
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [drafts, setDrafts] = useState<QuantityDraft>({});

  const [balances, setBalances] = useState<Record<number, InventoryBalanceInfo>>({});

  function markRequestBusy(requestId: number, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(requestId);
      else next.delete(requestId);
      return next;
    });
  }

  function markItemBusy(itemId: number, busy: boolean) {
    setBusyItemIds((current) => {
      const next = new Set(current);
      if (busy) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

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
    return base;
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

  function isItemDraftValid(request: StockRequest, itemId: number): boolean {
    const qty = Number(drafts[request.id]?.[itemId]);
    return Number.isFinite(qty) && qty > 0;
  }

  async function handleRecommend(request: StockRequest, item: NonNullable<StockRequest["items"]>[number]) {
    if (!isItemDraftValid(request, item.item_id)) {
      setError(
        t(lang, "Recommended quantities must be greater than zero.", "නිර්දේශිත ප්‍රමාණ ශුන්‍යයට වඩා වැඩි විය යුතුය."),
      );
      return;
    }

    const quantity = Number(drafts[request.id]?.[item.item_id]);

    try {
      markItemBusy(item.id, true);
      setError("");
      const updated = await recommendStockRequestItem(item.id, { quantity });
      const completedItem = updated.items?.find((updatedItem) => updatedItem.id === item.id);
      setRequests((current) => current.flatMap((r) => {
        if (r.id !== request.id) return [r];
        if (updated.current_stage !== "RECOMMENDATION") return [];
        return [{
          ...r,
          items: (r.items ?? []).map((existingItem) => existingItem.id === item.id
            ? { ...existingItem, quantity_recommended: completedItem?.quantity_recommended ?? quantity }
            : existingItem),
        }];
      }));
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to recommend this request. Please try again.", "මෙම ඉල්ලීම නිර්දේශ කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      markItemBusy(item.id, false);
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim()) return;

    try {
      markRequestBusy(id, true);
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
      markRequestBusy(id, false);
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

      <div className="space-y-3 md:hidden">
        {requests.flatMap((r) => (r.items ?? []).filter((it) => it.quantity_recommended === null).map((it) => {
          const requesterName = getRequesterName(r.requester, r.requester_id);
          const available = liveAvailable(it.item_id);
          const quantity = Number(drafts[r.id]?.[it.item_id] ?? 0);
          const isShort = available !== null && quantity > available;
          const busy = busyIds.has(r.id);
          const itemBusy = busyItemIds.has(it.id);
          return (
            <article key={`mobile-request-${r.id}-item-${it.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0"><p className="font-mono text-[11px] font-semibold text-slate-500">{r.request_number}</p><p className="mt-1 font-mono text-[10px] font-bold text-slate-400">{it.item.item_code}</p><h3 className="text-sm font-bold text-slate-900">{it.item.name_en}</h3></div>
                <span className="inline-flex shrink-0 flex-col rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-700">
                  {r.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : r.request_context}
                </span>
              </div>
              {r.notes && <p className="mt-3 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600">{r.notes}</p>}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 text-xs">
                <div><p className="text-[10px] text-slate-500">{t(lang, "Requester", "ඉල්ලුම්කරු")}</p><p className="truncate font-medium text-slate-800">{requesterName}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Position", "තනතුර")}</p><p className="truncate font-medium text-slate-800">{r.requester?.role_label || "-"}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</p><p className="font-medium text-slate-700">{formatDate(r.submitted_at)}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Stock Status", "තොග තත්ත්වය")}</p><span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${available !== null && (available === 0 || isShort) ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{available === null ? "-" : available === 0 ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${available} ${t(lang, "in stock", "තොගයේ ඇත")}`}</span></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Requested", "ඉල්ලූ ප්‍රමාණය")}</p><p className="font-mono font-semibold text-slate-800">{Number(it.quantity_requested)}</p></div>
                <div><label className="text-[10px] font-semibold text-slate-600">{t(lang, "Recommend Qty", "නිර්දේශිත ප්‍රමාණය")}</label><div className="mt-1 flex items-center gap-1"><input type="number" min={1} step={1} value={drafts[r.id]?.[it.item_id] ?? ""} onChange={(event) => setDraftQuantity(r.id, it.item_id, event.target.value)} aria-label={t(lang, "Recommended quantity", "නිර්දේශිත ප්‍රමාණය")} className="h-9 w-20 rounded-md border border-slate-300 bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /><div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white"><button type="button" aria-label={t(lang, "Increase recommended quantity", "නිර්දේශිත ප්‍රමාණය වැඩි කරන්න")} onClick={() => setDraftQuantity(r.id, it.item_id, String(quantity + 1))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700"><ChevronUp className="h-3 w-3" /></button><span className="h-px w-full bg-slate-200" /><button type="button" aria-label={t(lang, "Decrease recommended quantity", "නිර්දේශිත ප්‍රමාණය අඩු කරන්න")} disabled={quantity <= 1} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.max(1, quantity - 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronDown className="h-3 w-3" /></button></div></div></div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setRejectingId(r.id); setRejectReason(""); }} disabled={busy} className="h-9 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-700 disabled:opacity-50">{t(lang, "Reject", "ප්‍රතික්ෂේප")}</button>
                <button type="button" onClick={() => handleRecommend(r, it)} disabled={busy || itemBusy || !isItemDraftValid(r, it.item_id)} className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50">{itemBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t(lang, "Recommend", "නිර්දේශ")}</button>
              </div>
            </article>
          );
        }))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white pl-1 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[5%]" />
              <col className="w-[9%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
                <th className="whitespace-nowrap px-2 py-3 text-center">{t(lang, "Request No.", "ඉල්ලීම් අංකය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requester", "ඉල්ලුම්කරු")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requester Position", "ඉල්ලුම්කරුගේ තනතුර")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Type", "වර්ගය")}</th>
                <th className="whitespace-nowrap px-2 py-3 text-center">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Stock Status", "තොග තත්ත්වය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requested", "ඉල්ලූ ප්‍රමාණය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Recommend Qty", "නිර්දේශිත ප්‍රමාණය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Actions", "ක්‍රියා")}</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {requests.flatMap((r, requestIndex) =>
                (r.items ?? []).filter((it) => it.quantity_recommended === null).map((it, itemIndex) => {
                  const requesterName = getRequesterName(r.requester, r.requester_id);
                  const roleLabel = r.requester?.role_label;
                  const avail = liveAvailable(it.item_id);
                  const requestedQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                  const isShort = avail !== null && requestedQty > avail;
                  const isZeroStock = avail === 0;
                  const itemCount = r.items?.length ?? 0;

                  return (
                    <tr
                      key={`request-${r.id}-item-${it.id}`}
                      data-request-id={r.id}
                      className={`border-b transition-colors hover:bg-slate-100/70 ${
                        requestIndex > 0 && itemIndex === 0 ? "border-t border-t-slate-300" : ""
                      } ${
                        itemCount > 1
                          ? itemIndex === itemCount - 1
                            ? "border-b-slate-300 bg-slate-100/60"
                            : "border-b-slate-200 bg-slate-100/60"
                          : "border-b-slate-200"
                      }`}
                    >
                      <td className="px-2 py-3 align-middle font-mono text-[11px] font-semibold text-slate-700">
                        {r.request_number}
                        {r.notes && <p className="mt-1 line-clamp-2 font-sans text-[10px] font-normal text-slate-500" title={r.notes}>{r.notes}</p>}
                      </td>
                      <td className="min-w-0 px-2 py-3 align-middle">
                        <span className="mb-0.5 block font-mono text-[10px] font-bold text-slate-400">{it.item.item_code}</span>
                        <span className="block font-semibold text-slate-900">{it.item.name_en}</span>
                      </td>
                      <td className="min-w-0 px-2 py-3 align-middle">
                        <span className="flex items-center gap-1.5 font-medium text-slate-800">
                          <User className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <span className="truncate">{requesterName}</span>
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-slate-700">{roleLabel || "-"}</td>
                      <td className="px-2 py-3 align-middle">
                        <span className="inline-flex flex-col rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-700">
                          {r.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : r.request_context}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-slate-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {formatDate(r.submitted_at)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        {avail !== null ? (
                          <span className={`inline-block rounded-md border px-2 py-1 text-[10px] font-semibold ${
                            isZeroStock || isShort ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}>
                            {isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${avail} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                          </span>
                        ) : <span className="text-[11px] text-slate-400">-</span>}
                      </td>
                      <td className="px-2 py-3 text-center align-middle font-mono font-semibold text-slate-700">{Number(it.quantity_requested)}</td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={drafts[r.id]?.[it.item_id] ?? ""}
                            onChange={(event) => setDraftQuantity(r.id, it.item_id, event.target.value)}
                            aria-label={t(lang, "Recommended quantity", "නිර්දේශිත ප්‍රමාණය")}
                            className="h-9 w-16 rounded-md border border-slate-300 bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                          <div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
                            <button type="button" aria-label={t(lang, "Increase recommended quantity", "නිර්දේශිත ප්‍රමාණය වැඩි කරන්න")} onClick={() => setDraftQuantity(r.id, it.item_id, String(requestedQty + 1))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700">
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <span className="h-px w-full bg-slate-200" />
                            <button type="button" aria-label={t(lang, "Decrease recommended quantity", "නිර්දේශිත ප්‍රමාණය අඩු කරන්න")} disabled={requestedQty <= 1} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.max(1, requestedQty - 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title={t(lang, "Applies to every item in this request", "මෙම ඉල්ලීමේ සියලුම අයිතම සඳහා අදාළ වේ")}
                            aria-label={t(lang, `Reject request ${r.request_number}`, `ඉල්ලීම ${r.request_number} ප්‍රතික්ෂේප කරන්න`)}
                            onClick={() => { setRejectingId(r.id); setRejectReason(""); }}
                            disabled={busyIds.has(r.id)}
                            className="h-7 cursor-pointer rounded-lg border border-rose-300 bg-white px-2.5 text-[10px] font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                          >{t(lang, "Reject", "ප්‍රතික්ෂේප")}</button>
                          <button
                            type="button"
                            aria-label={t(lang, `Recommend request ${r.request_number}`, `ඉල්ලීම ${r.request_number} නිර්දේශ කරන්න`)}
                            onClick={() => handleRecommend(r, it)}
                            disabled={busyIds.has(r.id) || busyItemIds.has(it.id) || !isItemDraftValid(r, it.item_id)}
                            className="flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                          >
                            {busyItemIds.has(it.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3 w-3" />}
                            <span>{t(lang, "Recommend", "නිර්දේශ")}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
                disabled={!rejectReason.trim() || busyIds.has(rejectingId)}
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {busyIds.has(rejectingId) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t(lang, "Confirm Rejection", "ප්‍රතික්ෂේපය තහවුරු කරන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp, Loader2, User, X, MessageSquare, Calendar } from "lucide-react";
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
  const [busyItemIds, setBusyItemIds] = useState<Set<number>>(() => new Set());
  const [rejectingItem, setRejectingItem] = useState<StockRequestItemView | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [validationError, setValidationError] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { triggerBadgeRefresh } = useBadgeRefresh();

  function markItemBusy(itemId: number, busy: boolean) {
    setBusyItemIds((current) => {
      const next = new Set(current);
      if (busy) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

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
      markItemBusy(item.id, true);
      await approveStockRequestItem(item.id, { quantity, remarks: changed ? remarks : undefined });
      setRequests((current) => current.map((candidate) => candidate.id === request.id
        ? { ...candidate, items: (candidate.items ?? []).filter((candidateItem) => candidateItem.id !== item.id) }
        : candidate).filter((candidate) => (candidate.items ?? []).length > 0));
      triggerBadgeRefresh();
    } catch (err) {
      console.error(err);
      setError(apiErrorMessage(err, t(lang, "Unable to approve this item. Please try again.", "මෙම භාණ්ඩය අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න.")));
    } finally {
      markItemBusy(item.id, false);
    }
  }

  async function handleReject() {
    if (!rejectingItem || !rejectReason.trim()) return;
    const itemId = rejectingItem.id;
    try {
      markItemBusy(itemId, true);
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
      markItemBusy(itemId, false);
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

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          {requests.length} {t(lang, "request(s) awaiting your approval", "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී")}
        </p>
      </div>

      <div className="space-y-3 md:hidden">
        {requests.flatMap((request) => (request.items ?? []).map((item) => {
          const requesterName = request.requester?.name ?? `#${request.requester_id}`;
          const maximum = baselineQuantity(item);
          const quantity = Number(drafts[item.id]);
          const changed = quantity !== maximum;
          const balance = balances[item.item_id];
          const isBusy = busyItemIds.has(item.id);
          return (
            <article key={`mobile-item-${item.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold text-slate-500">{request.request_number}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold text-slate-400">{item.item.item_code}</p>
                  <h3 className="text-sm font-bold text-slate-900">{item.item.name_en}</h3>
                </div>
                <span className="inline-flex shrink-0 flex-col rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-700">
                  {request.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : request.request_context}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 text-xs">
                <div><p className="text-[10px] text-slate-500">{t(lang, "Requester", "ඉල්ලුම්කරු")}</p><p className="truncate font-medium text-slate-800">{requesterName}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Position", "තනතුර")}</p><p className="truncate font-medium text-slate-800">{request.requester?.role_label || "-"}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</p><p className="font-medium text-slate-700">{formatDate(request.submitted_at)}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Stock Status", "තොග තත්ත්වය")}</p><span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${balance ? balance.available <= 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{balance ? balance.available <= 0 ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${balance.available} ${t(lang, "in stock", "තොගයේ ඇත")}` : "-"}</span></div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <div><p className="text-[10px] text-slate-500">{t(lang, "Recommended", "නිර්දේශිත")}: <strong className="text-slate-700">{maximum}</strong></p><label className="mt-1 block text-[10px] font-semibold text-slate-600">{t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}</label><div className="mt-1 flex items-center gap-1"><input type="number" min={1} max={maximum} step={1} value={drafts[item.id] ?? ""} onChange={(event) => updateDraft(item.id, event.target.value)} aria-label={t(lang, "Approved quantity", "අනුමත ප්‍රමාණය")} className="h-9 w-20 rounded-md border border-slate-300 bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /><div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white"><button type="button" aria-label={t(lang, "Increase approved quantity", "අනුමත ප්‍රමාණය වැඩි කරන්න")} disabled={quantity >= maximum} onClick={() => updateDraft(item.id, String(Math.min(maximum, (Number.isFinite(quantity) ? quantity : 0) + 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><ChevronUp className="h-3 w-3" /></button><span className="h-px w-full bg-slate-200" /><button type="button" aria-label={t(lang, "Decrease approved quantity", "අනුමත ප්‍රමාණය අඩු කරන්න")} disabled={quantity <= 1} onClick={() => updateDraft(item.id, String(Math.max(1, (Number.isFinite(quantity) ? quantity : 1) - 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><ChevronDown className="h-3 w-3" /></button></div></div></div>
                {changed && <div className="min-w-0 flex-1"><label className="block text-[10px] font-semibold text-amber-700">{t(lang, "Reason for change", "වෙනස් කිරීමට හේතුව")}</label><input value={comments[item.id] ?? ""} onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-amber-200 bg-amber-50 px-2 text-xs text-slate-900 outline-none focus:border-amber-400" /></div>}
              </div>
              {validationError[item.id] && <p className="mt-2 text-[10px] font-bold text-rose-600">{validationError[item.id]}</p>}
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setRejectingItem(item); setRejectReason(""); }} disabled={isBusy} className="h-9 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-700 disabled:opacity-50">{t(lang, "Reject", "ප්‍රතික්ෂේප")}</button>
                <button type="button" onClick={() => void handleApprove(request, item)} disabled={isBusy} className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50">{isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t(lang, "Approve", "අනුමත")}</button>
              </div>
            </article>
          );
        }))}
      </div>

      {/* Single Master Table Container */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white pl-1 pr-0.5 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[9%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[6%]" />
              <col className="w-[10%]" />
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[12%]" />
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
                <th className="px-2 py-3 text-center">{t(lang, "Recommended", "නිර්දේශිත")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Actions", "ක්‍රියා")}</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {requests.flatMap((request, requestIndex) =>
                (request.items ?? []).map((item, itemIndex) => {
                  const requesterName = request.requester?.name ?? `#${request.requester_id}`;
                  const roleLabel = request.requester?.role_label;
                  const requestItems = request.items ?? [];
                  const isMultiItemRequest = requestItems.length > 1;
                  const isLastItemInRequest = itemIndex === requestItems.length - 1;
                  const maximum = baselineQuantity(item);
                  const balance = balances[item.item_id];
                  const availableQty = balance?.available ?? 0;
                  const isZeroStock = availableQty === 0;
                  const quantity = Number(drafts[item.id]);
                  const changed = quantity !== maximum;

                  return (
                    <tr
                      key={`item-${item.id}`}
                      data-request-id={request.id}
                      className={`border-b transition-colors hover:bg-slate-100/70 ${
                        requestIndex > 0 && itemIndex === 0 ? "border-t-1 border-t-slate-200" : ""
                      } ${
                        isMultiItemRequest
                          ? isLastItemInRequest
                            ? "border-b-slate-200 bg-slate-100/60"
                            : "border-b-slate-100 bg-slate-100/60"
                          : "border-b-slate-200"
                      }`}
                    >
                      <td className="px-2 py-3 align-middle font-mono text-[11px] font-semibold text-slate-700">{request.request_number}</td>
                      <td className="min-w-0 px-2 py-3 align-middle">
                        <span className="mb-0.5 block font-mono text-[10px] font-bold text-slate-400">{item.item.item_code}</span>
                        <span className="block font-semibold text-slate-900">{item.item.name_en}</span>
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
                          {request.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : request.request_context}
                        </span>
                      </td>
                      <td className="px-2 py-3 align-middle text-slate-600">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          {formatDate(request.submitted_at)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        {balance ? (
                          <span className={`inline-block rounded-md border px-2 py-1 text-[10px] font-semibold ${
                            isZeroStock ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}>
                            {isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${availableQty} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <span className="inline-block rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">{maximum}</span>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={maximum}
                            step={1}
                            value={drafts[item.id] ?? ""}
                            onChange={(event) => updateDraft(item.id, event.target.value)}
                            aria-label={t(lang, "Approved quantity", "අනුමත ප්‍රමාණය")}
                            className="h-9 w-16 rounded-md border border-slate-300 bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                          />
                            <div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
                              <button
                                type="button"
                                aria-label={t(lang, "Increase approved quantity", "අනුමත ප්‍රමාණය වැඩි කරන්න")}
                                disabled={quantity >= maximum}
                                onClick={() => updateDraft(item.id, String(Math.min(maximum, (Number.isFinite(quantity) ? quantity : 0) + 1)))}
                                className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <span className="h-px w-full bg-slate-200" />
                              <button
                                type="button"
                                aria-label={t(lang, "Decrease approved quantity", "අනුමත ප්‍රමාණය අඩු කරන්න")}
                                disabled={quantity <= 1}
                                onClick={() => updateDraft(item.id, String(Math.max(1, (Number.isFinite(quantity) ? quantity : 1) - 1)))}
                                className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          {changed && (
                            <div className="flex w-full max-w-[150px] items-center gap-1 rounded-md border border-amber-200 bg-amber-50 p-1">
                              <MessageSquare className="ml-1 h-3.5 w-3.5 shrink-0 text-amber-600" />
                              <input
                                value={comments[item.id] ?? ""}
                                onChange={(event) => setComments((current) => ({ ...current, [item.id]: event.target.value }))}
                                placeholder={t(lang, "Reason for change", "වෙනස් කිරීමට හේතුව")}
                                aria-label={t(lang, "Reason for quantity change", "ප්‍රමාණය වෙනස් කිරීමට හේතුව")}
                                className="h-7 w-full min-w-0 bg-transparent px-1 text-[10px] font-medium text-slate-900 outline-none placeholder:text-amber-700/60"
                              />
                            </div>
                          )}
                          {validationError[item.id] && <p className="max-w-[160px] text-[10px] font-bold text-rose-600">{validationError[item.id]}</p>}
                        </div>
                      </td>
                      <td className="px-2 py-3 text-center align-middle">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setRejectingItem(item); setRejectReason(""); }}
                            disabled={busyItemIds.has(item.id)}
                            className="h-7 rounded-lg cursor-pointer border border-rose-300 bg-white px-2.5 text-[10px] font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                          >
                            {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleApprove(request, item)}
                            disabled={busyItemIds.has(item.id)}
                            className="flex h-7 cursor-pointer items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                          >
                            {busyItemIds.has(item.id)
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Check className="h-3.5 w-3.5" />}
                            <span>{t(lang, "Approve", "අනුමත")}</span>
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
                disabled={!rejectReason.trim() || busyItemIds.has(rejectingItem.id)}
                className="h-9 px-5 rounded-xl border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyItemIds.has(rejectingItem.id) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{t(lang, "Confirm Reject", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

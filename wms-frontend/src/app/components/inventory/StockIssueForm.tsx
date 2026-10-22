import { useEffect, useState, useCallback, useRef } from "react";
import { Package, AlertCircle, Loader2, CheckCircle2, User, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import {
  getPendingIssuance,
  issueStockRequest,
} from "../../../services/stockRequestService";
import {
  getInventoryBalances,
  type InventoryBalanceInfo,
} from "../../../services/InventoryBalanceService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest } from "../../types/stockRequests";
import { lookupItemByCode } from "../../../services/ItemService";
import { BarcodeScannerInput } from "../ui/BarcodeScannerInput";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

type IssueDraft = Record<number, Record<number, string>>;

function remainingApproved(item: {
  quantity_approved: number | string | null;
  quantity_issued: number | string | null;
}): number {
  const approved = Number(item.quantity_approved ?? 0);
  const issued = Number(item.quantity_issued ?? 0);
  return Math.max(0, approved - issued);
}

function issueableItems(request: StockRequest): NonNullable<StockRequest["items"]> {
  return (request.items ?? []).filter(
    (item) => item.approval_status === "approved" && remainingApproved(item) > 0
  );
}

export function StockIssueForm({ lang }: { lang: Lang }) {
  const { triggerBadgeRefresh } = useBadgeRefresh();
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());
  const [busyItemKeys, setBusyItemKeys] = useState<Set<string>>(() => new Set());
  const [drafts, setDrafts] = useState<IssueDraft>({});
  const [balances, setBalances] = useState<Record<number, InventoryBalanceInfo>>({});
  const [scanError, setScanError] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const issueInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mobileIssueInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function markRequestBusy(requestId: number, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(requestId);
      else next.delete(requestId);
      return next;
    });
  }

  function markItemBusy(key: string, busy: boolean) {
    setBusyItemKeys((current) => {
      const next = new Set(current);
      if (busy) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function rowKey(requestId: number, itemId: number): string {
    return `${requestId}-${itemId}`;
  }

  async function handleScan(code: string) {
    setScanError("");

    try {
      const item = await lookupItemByCode(code);

      const matches = requests.flatMap((r) =>
        (r.items ?? [])
          .filter((it) => it.item_id === item.id && remainingApproved(it) > 0)
          .map((it) => ({ requestId: r.id, itemId: it.item_id }))
      );

      if (matches.length === 0) {
        setScanError(
          t(
            lang,
            `"${item.item_code}" is not part of any pending issuance.`,
            `"${item.item_code}" කිසිදු නිකුත් කිරීමකට අදාළ නොවේ.`
          )
        );
        return;
      }

      const key = rowKey(matches[0].requestId, matches[0].itemId);
      setHighlightedKey(key);
      const input = window.matchMedia("(min-width: 768px)").matches
        ? issueInputRefs.current[key]
        : mobileIssueInputRefs.current[key];
      input?.focus();
      input?.select();

      if (matches.length > 1) {
        setScanError(
          t(
            lang,
            `This item appears in ${matches.length} pending requests — jumped to the first one.`,
            `මෙම භාණ්ඩය අපේක්ෂිත ඉල්ලීම් ${matches.length}ක ඇත — පළමුවැන්නට යොමු විය.`
          )
        );
      }
    } catch (err) {
      console.error(err);
      setScanError(
        t(
          lang,
          `No item found for code "${code}".`,
          `"${code}" සඳහා භාණ්ඩයක් හමු නොවීය.`
        )
      );
    }
  }

  useEffect(() => {
    if (!highlightedKey) return;
    const timeout = setTimeout(() => setHighlightedKey(null), 3000);
    return () => clearTimeout(timeout);
  }, [highlightedKey]);

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingIssuance({ per_page: 50 });
      setRequests(response.data);

      setDrafts((current) => {
        const next = { ...current };
        response.data.forEach((r) => {
          next[r.id] = {};
          (r.items ?? []).forEach((it) => {
            next[r.id][it.item_id] = String(remainingApproved(it));
          });
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load the issuance queue.",
          "නිකුත් කිරීමේ පෝලිම පූරණය කළ නොහැක."
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
    if (requests.length === 0) return;

    const itemIds = Array.from(
      new Set(requests.flatMap((r) => (r.items ?? []).map((it) => it.item_id)))
    );
    const divisionId = requests[0].division_id;

    getInventoryBalances(itemIds, divisionId).then(setBalances);
  }, [requests]);

  function setDraftQuantity(requestId: number, itemId: number, value: string) {
    setDrafts((current) => ({
      ...current,
      [requestId]: { ...current[requestId], [itemId]: value },
    }));
  }

  async function refreshBalances(divisionId: number) {
    const itemIds = Array.from(
      new Set(requests.flatMap((r) => (r.items ?? []).map((it) => it.item_id)))
    );
    if (itemIds.length > 0) {
      const result = await getInventoryBalances(itemIds, divisionId);
      setBalances(result);
    }
  }

  async function handleIssue(request: StockRequest, itemId?: number, requestItemId?: number) {
    const itemDrafts = drafts[request.id] ?? {};
    const items = (request.items ?? [])
      .filter((it) => remainingApproved(it) > 0 && (requestItemId !== undefined ? it.id === requestItemId : itemId === undefined || it.item_id === itemId))
      .map((it) => ({
        request_item_id: it.id,
        item_id: it.item_id,
        quantity: Number(itemDrafts[it.item_id] ?? 0),
      }))
      .filter((it) => it.quantity > 0);

    if (items.length === 0) {
      setError(
        t(
          lang,
          "Enter a quantity to issue for at least one item.",
          "අවම වශයෙන් එක් භාණ්ඩයකට නිකුත් කළ ප්‍රමාණයක් ඇතුළත් කරන්න."
        )
      );
      return;
    }

    try {
      markRequestBusy(request.id, true);
      if (requestItemId !== undefined) markItemBusy(rowKey(request.id, requestItemId), true);
      setError("");
      const updated = await issueStockRequest(request.id, { items });
      triggerBadgeRefresh();

      if (updated.status === "ISSUED") {
        setRequests((current) => current.filter((r) => r.id !== request.id));
      } else {
        const updatedItems = issueableItems(updated);
        setRequests((current) =>
          updatedItems.length === 0
            ? current.filter((r) => r.id !== request.id)
            : current.map((r) =>
                r.id === request.id ? { ...updated, items: updatedItems } : r
              )
        );
        setDrafts((current) => ({
          ...current,
          [request.id]: Object.fromEntries(
            updatedItems.map((it) => [
              it.item_id,
              String(remainingApproved(it)),
            ])
          ),
        }));
      }

      await refreshBalances(request.division_id);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to issue this request. Please try again.",
          "මෙම ඉල්ලීම නිකුත් කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
    } finally {
      markRequestBusy(request.id, false);
      if (requestItemId !== undefined) markItemBusy(rowKey(request.id, requestItemId), false);
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
        icon={<Package className="w-10 h-10 text-emerald-500" />}
        title={t(lang, "All goods issued", "සියලු භාණ්ඩ නිකුත් කර ඇත")}
        subtitle={t(
          lang,
          "No approved requests pending issuance.",
          "නිකුත් කිරීමට අනුමත ඉල්ලීම් නොමැත."
        )}
      />
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

      {/* HEADER BAR & BARCODE VERIFICATION */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {requests.length}{" "}
            {t(
              lang,
              "approved request(s) ready to issue",
              "අනුමත ඉල්ලීම් නිකුත් කිරීමට සූදානම්"
            )}
          </span>
        </p>

        <div className="w-full sm:max-w-xs">
          <BarcodeScannerInput
            lang={lang}
            onScan={handleScan}
            placeholder={t(
              lang,
              "Scan item to verify…",
              "සත්‍යාපනය සඳහා භාණ්ඩය ස්කෑන් කරන්න…"
            )}
            autoFocus
          />
          {scanError && (
            <p className="mt-1.5 text-[11px] font-semibold text-amber-600">
              {scanError}
            </p>
          )}
        </div>
      </div>

      {/* FLAT REQUEST AND ITEM TABLE */}
      <div className="space-y-3 md:hidden">
        {requests.flatMap((r) => (r.items ?? []).map((it) => {
          const remaining = remainingApproved(it);
          const balance = balances[it.item_id];
          const quantity = Number(drafts[r.id]?.[it.item_id] ?? 0);
          const available = balance?.available ?? 0;
          const short = balance !== undefined && quantity > available;
          const key = rowKey(r.id, it.item_id);
          const busyKey = rowKey(r.id, it.id);
          const partiallyIssued = Number(it.quantity_issued ?? 0) > 0 && remaining > 0;
          return (
            <article key={`mobile-issue-${r.id}-${it.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0"><p className="font-mono text-[11px] font-semibold text-slate-500">{r.request_number}</p><p className="mt-1 font-mono text-[10px] font-bold text-slate-400">{it.item.item_code}</p><h3 className="text-sm font-bold text-slate-900">{it.item.name_en}</h3></div>
                <span className="inline-flex shrink-0 flex-col rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-700">
                  {r.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : r.request_context}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-3 text-xs">
                <div><p className="text-[10px] text-slate-500">{t(lang, "Requester", "ඉල්ලුම්කරු")}</p><p className="truncate font-medium text-slate-800">{r.requester?.name ?? `#${r.requester_id}`}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Position", "තනතුර")}</p><p className="truncate font-medium text-slate-800">{r.requester?.role_label || "-"}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</p><p className="font-medium text-slate-700">{formatDate(r.submitted_at)}</p></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Status", "තත්ත්වය")}</p><span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${partiallyIssued ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{partiallyIssued ? t(lang, "Partially Issued", "අර්ධ වශයෙන් නිකුත් කර ඇත") : t(lang, "Approved", "අනුමත")}</span></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Available to Issue", "නිකුත් කිරීමට ලබාගත හැකි")}</p><span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold ${balance !== undefined && (available === 0 || short) ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{balance === undefined ? "-" : available === 0 ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${available} ${t(lang, "in stock", "තොගයේ ඇත")}`}</span></div>
                <div><p className="text-[10px] text-slate-500">{t(lang, "Approved / Issued", "අනුමත / නිකුත් කළ")}</p><p className="font-mono font-semibold text-slate-800">{Number(it.quantity_approved)} / {Number(it.quantity_issued ?? 0)}</p></div>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                <div>{remaining > 0 ? <><label className="block text-[10px] font-semibold text-slate-600">{t(lang, "Issue Now", "දැන් නිකුත් කරන්න")}</label><div className="mt-1 flex items-center gap-1"><input ref={(el) => { mobileIssueInputRefs.current[key] = el; }} type="number" min={1} max={remaining} value={drafts[r.id]?.[it.item_id] ?? ""} onChange={(e) => { const value = e.target.value; setDraftQuantity(r.id, it.item_id, value === "" ? "" : String(Math.max(1, Math.min(remaining, Number(value))))); }} aria-label={t(lang, "Quantity to issue", "නිකුත් කළ යුතු ප්‍රමාණය")} className={`h-9 w-20 rounded-md border bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none ${highlightedKey === key ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`} /><div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white"><button type="button" aria-label={t(lang, "Increase issue quantity", "නිකුත් ප්‍රමාණය වැඩි කරන්න")} disabled={quantity >= remaining} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.min(remaining, Math.max(1, quantity) + 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><ChevronUp className="h-3 w-3" /></button><span className="h-px w-full bg-slate-200" /><button type="button" aria-label={t(lang, "Decrease issue quantity", "නිකුත් ප්‍රමාණය අඩු කරන්න")} disabled={quantity <= 1} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.max(1, quantity - 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-40"><ChevronDown className="h-3 w-3" /></button></div></div></> : <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />{t(lang, "Complete", "සම්පූර්ණයි")}</span>}</div>
                <button type="button" onClick={() => handleIssue(r, it.item_id, it.id)} disabled={busyIds.has(r.id) || remaining === 0} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50">{busyItemKeys.has(busyKey) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}{t(lang, "Issue", "නිකුත්")}</button>
              </div>
            </article>
          );
        }))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white pr-1 pl-1 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[7%]" /><col className="w-[12%]" /><col className="w-[8%]" />
              <col className="w-[7%]" /><col className="w-[6%]" /><col className="w-[6%]" />
              <col className="w-[7%]" /><col className="w-[4%]" /><col className="w-[4%]" />
              <col className="w-[7%]" /><col className="w-[8%]" /><col className="w-[5%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
                <th className="whitespace-nowrap px-2 py-3 text-center">{t(lang, "Request No.", "ඉල්ලීම් අංකය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requester", "ඉල්ලුම්කරු")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requester Position", "ඉල්ලුම්කරුගේ තනතුර")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Type", "වර්ගය")}</th>
                <th className="whitespace-nowrap px-2 py-3 text-center">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Status", "තත්ත්වය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Approved", "අනුමත")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Issued", "නිකුත් කළ")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Available to Issue", "නිකුත් කිරීමට ලබාගත හැකි")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Issue Now", "දැන් නිකුත් කරන්න")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Actions", "ක්‍රියා")}</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {requests.flatMap((r, requestIndex) => {
                const requesterName = r.requester?.name ?? `#${r.requester_id}`;
                const roleLabel = r.requester?.role_label;
                return (r.items ?? []).map((it, itemIndex) => {
                  const remaining = remainingApproved(it);
                  const isPartiallyIssued = Number(it.quantity_issued ?? 0) > 0 && remaining > 0;
                  const balance = balances[it.item_id];
                  const issuingQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                  const availableQty = balance?.available ?? 0;
                  const short = balance !== undefined && issuingQty > availableQty;
                  const isZeroStock = availableQty === 0;
                  const key = rowKey(r.id, it.item_id);
                  const busyKey = rowKey(r.id, it.id);
                  const isHighlighted = highlightedKey === key;
                  const multiItem = (r.items?.length ?? 0) > 1;
                  return (
                    <tr key={`request-${r.id}-item-${it.id}`} data-request-id={r.id} className={`border-b transition-colors hover:bg-slate-100/70 ${requestIndex > 0 && itemIndex === 0 ? "border-t border-t-slate-300" : ""} ${multiItem ? "bg-slate-100/60 border-b-slate-300" : "border-b-slate-200"} ${isHighlighted ? "!bg-blue-50/80" : ""}`}>
                      <td className="px-2 py-3 align-middle font-mono text-[11px] font-semibold text-slate-700">{r.request_number}</td>
                      <td className="min-w-0 px-2 py-3 align-middle"><span className="mb-0.5 block font-mono text-[10px] font-bold text-slate-400">{it.item.item_code}</span><span className="block font-semibold text-slate-900">{it.item.name_en}</span></td>
                      <td className="min-w-0 px-2 py-3 align-middle"><span className="flex items-center gap-1.5 font-medium text-slate-800"><User className="h-3.5 w-3.5 shrink-0 text-blue-600" /><span className="truncate">{requesterName}</span></span></td>
                      <td className="px-2 py-3 align-middle text-slate-700">{roleLabel || "-"}</td>
                      <td className="px-2 py-3 align-middle"><span className="inline-flex flex-col rounded-md border border-violet-100 bg-violet-50 px-2 py-1 text-[10px] font-semibold leading-tight text-violet-700">{r.request_context === "SECTION_COMMON" ? <><span>SECTION</span><span>COMMON</span></> : r.request_context}</span></td>
                      <td className="px-2 py-3 align-middle text-slate-600"><span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />{formatDate(r.submitted_at)}</span></td>
                      <td className="px-2 py-3 text-center align-middle">{isPartiallyIssued ? <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{t(lang, "Partially Issued", "අර්ධ වශයෙන් නිකුත් කර ඇත")}</span> : <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{t(lang, "Approved", "අනුමත")}</span>}</td>
                      <td className="px-2 py-3 text-center align-middle font-mono font-semibold text-slate-700">{Number(it.quantity_approved)}</td>
                      <td className="px-2 py-3 text-center align-middle font-mono font-semibold text-slate-600">{Number(it.quantity_issued ?? 0)}</td>
                      <td className="px-2 py-3 text-center align-middle">{balance !== undefined ? <span className={`inline-block rounded-md border px-2 py-1 text-[10px] font-semibold ${isZeroStock || short ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${availableQty} ${t(lang, "in stock", "තොගයේ ඇත")}`}</span> : <span className="text-[11px] text-slate-400">-</span>}</td>
                      <td className="px-2 py-3 text-center align-middle">{remaining > 0 ? <div className="flex items-center justify-center gap-1"><input ref={(el) => { issueInputRefs.current[key] = el; }} type="number" min={1} max={remaining} value={drafts[r.id]?.[it.item_id] ?? ""} onChange={(e) => { const value = e.target.value; setDraftQuantity(r.id, it.item_id, value === "" ? "" : String(Math.max(1, Math.min(remaining, Number(value))))); }} aria-label={t(lang, "Quantity to issue", "නිකුත් කළ යුතු ප්‍රමාණය")} className={`h-9 w-16 rounded-md border bg-white text-center font-mono text-sm font-semibold text-slate-900 outline-none transition-all ${isHighlighted ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`} /><div className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white"><button type="button" aria-label={t(lang, "Increase issue quantity", "නිකුත් ප්‍රමාණය වැඩි කරන්න")} disabled={issuingQty >= remaining} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.min(remaining, Math.max(1, issuingQty) + 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronUp className="h-3 w-3" /></button><span className="h-px w-full bg-slate-200" /><button type="button" aria-label={t(lang, "Decrease issue quantity", "නිකුත් ප්‍රමාණය අඩු කරන්න")} disabled={issuingQty <= 1} onClick={() => setDraftQuantity(r.id, it.item_id, String(Math.max(1, issuingQty - 1)))} className="flex h-[17px] w-6 items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><ChevronDown className="h-3 w-3" /></button></div></div> : <span className="inline-flex w-full items-center justify-center gap-1 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{t(lang, "Complete", "සම්පූර්ණයි")}</span>}</td>
                      <td className="px-2 py-3 text-center align-middle"><button type="button" title={t(lang, "Issue this item only", "මෙම භාණ්ඩය පමණක් නිකුත් කරන්න")} onClick={() => handleIssue(r, it.item_id, it.id)} disabled={busyIds.has(r.id) || remaining === 0} className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">{busyItemKeys.has(busyKey) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}<span>{t(lang, "Issue", "නිකුත්")}</span></button></td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

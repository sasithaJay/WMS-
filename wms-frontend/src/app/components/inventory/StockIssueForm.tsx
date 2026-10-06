import { useEffect, useState, useCallback, useRef } from "react";
import { Package, AlertCircle, Loader2, CheckCircle2, User } from "lucide-react";
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
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<IssueDraft>({});
  const [balances, setBalances] = useState<Record<number, InventoryBalanceInfo>>({});
  const [scanError, setScanError] = useState("");
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);
  const issueInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
      issueInputRefs.current[key]?.focus();
      issueInputRefs.current[key]?.select();

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

  async function handleIssue(request: StockRequest) {
    const itemDrafts = drafts[request.id] ?? {};
    const items = (request.items ?? [])
      .filter((it) => remainingApproved(it) > 0)
      .map((it) => ({
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
      setBusyId(request.id);
      setError("");
      const updated = await issueStockRequest(request.id, { items });

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

      {/* PENDING REQUEST CARDS */}
      <div className="space-y-4">
        {requests.map((r) => {
          const hasBackorder = (r.items ?? []).some(
            (it) =>
              Number(it.quantity_issued ?? 0) > 0 && remainingApproved(it) > 0
          );
          const requesterName = r.requester?.name ?? `#${r.requester_id}`;
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    {t(lang, "Approved", "අනුමත")}
                  </span>
                  {hasBackorder && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                      {t(lang, "Partially Issued", "අර්ධ වශයෙන් නිකුත් කර ඇත")}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  {formatDate(r.submitted_at)}
                </span>
              </div>

              {/* UNIFIED TABLE STRUCTURE */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Approved", "අනුමත")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Issued", "නිකුත් කළ")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Issue Now", "දැන් නිකුත් කරන්න")}</th>
                      <th className="py-2.5 px-3 text-center">{t(lang, "Available to Issue", "නිකුත් කිරීමට ලබාගත හැකි")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {(r.items ?? []).map((it) => {
                      const remaining = remainingApproved(it);
                      const balance = balances[it.item_id];
                      const issuingQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                      const availableQty = balance?.available ?? 0;
                      const short = balance !== undefined && issuingQty > availableQty;
                      const isZeroStock = availableQty === 0;
                      const key = rowKey(r.id, it.item_id);
                      const isHighlighted = highlightedKey === key;

                      return (
                        <tr
                          key={it.id}
                          className={`transition-colors ${
                            isHighlighted ? "bg-blue-50/80" : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="py-3 px-3">
                            <span className="font-mono text-[10px] font-bold text-slate-400 block">{it.item.item_code}</span>
                            <span className="font-bold text-slate-900">{it.item.name_en}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">
                            {Number(it.quantity_approved)}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                            {Number(it.quantity_issued ?? 0)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {remaining > 0 ? (
                              <input
                                ref={(el) => {
                                  issueInputRefs.current[key] = el;
                                }}
                                type="number"
                                min={0}
                                max={remaining}
                                value={drafts[r.id]?.[it.item_id] ?? ""}
                                onChange={(e) =>
                                  setDraftQuantity(r.id, it.item_id, e.target.value)
                                }
                                className={`w-20 h-8 mx-auto rounded-lg border bg-white text-center font-mono font-bold text-sm outline-none transition-all ${
                                  isHighlighted
                                    ? "border-blue-500 ring-4 ring-blue-500/20"
                                    : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                }`}
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px] justify-center w-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {t(lang, "Complete", "සම්පූර්ණයි")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {balance !== undefined ? (
                              <span className={`inline-block font-bold px-2 py-0.5 rounded-md text-[11px] ${
                                isZeroStock || short ? "bg-rose-100 text-rose-800 border border-rose-300" : "text-green-800 bg-green-200 border border-green-400/50"
                              }`}>
                                {isZeroStock ? t(lang, "Out of stock (0)", "තොග නොමැත (0)") : `${availableQty} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasBackorder && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-200/80 bg-amber-50 p-3 text-xs font-semibold text-amber-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    {t(
                      lang,
                      "Some items are back-ordered — stock will be issued as it becomes available.",
                      "සමහර භාණ්ඩ තොග නොමැති බැවින් පසුව නිකුත් කෙරේ."
                    )}
                  </span>
                </div>
              )}

              {/* CARD FOOTER ACTION */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleIssue(r)}
                  disabled={busyId === r.id}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {busyId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Package className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {busyId === r.id
                      ? t(lang, "Issuing…", "නිකුත් කරමින්…")
                      : t(lang, "Issue Stock", "තොග නිකුත් කරන්න")}
                  </span>
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
import { useEffect, useState, useCallback, useRef } from "react";
import { Package, AlertCircle } from "lucide-react";
import {
  getPendingIssuance,
  issueStockRequest,
} from "../../../services/stockRequestService";
import { getInventoryBalances, type InventoryBalanceInfo } from "../../../services/InventoryBalanceService"
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest } from "../../types/stockRequests";
import { lookupItemByCode } from "../../../services/ItemService";
import { BarcodeScannerInput } from "../ui/BarcodeScannerInput";

function ItemChip({ label, color = "blue" }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
      color === "green" ? "bg-green-50 text-green-700 border-green-200" : "bg-[#EBF4FD] text-[#4295D9] border-blue-100"
    }`}>
      {label}
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

type IssueDraft = Record<number, Record<number, string>>;

function remainingApproved(item: { quantity_approved: string | null; quantity_issued: string | null }): number {
  const approved = Number(item.quantity_approved ?? 0);
  const issued = Number(item.quantity_issued ?? 0);
  return Math.max(0, approved - issued);
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

      // Find every pending-issuance row across all cards that matches this item
      const matches = requests.flatMap((r) =>
        (r.items ?? [])
          .filter((it) => it.item_id === item.id && remainingApproved(it) > 0)
          .map((it) => ({ requestId: r.id, itemId: it.item_id })),
      );

      if (matches.length === 0) {
        setScanError(
          t(lang, `"${item.item_code}" is not part of any pending issuance.`, `"${item.item_code}" කිසිදු නිකුත් කිරීමකට අදාළ නොවේ.`),
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
            `මෙම භාණ්ඩය අපේක්ෂිත ඉල්ලීම් ${matches.length}ක ඇත — පළමුවැන්නට යොමු විය.`,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      setScanError(t(lang, `No item found for code "${code}".`, `"${code}" සඳහා භාණ්ඩයක් හමු නොවීය.`));
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
        t(lang, "Unable to load the issuance queue.", "නිකුත් කිරීමේ පෝලිම පූරණය කළ නොහැක."),
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All requests in this queue share the same division (the store keeper's
  // own), so one batched balance fetch covers the whole queue.
  useEffect(() => {
    if (requests.length === 0) return;

    const itemIds = Array.from(
      new Set(requests.flatMap((r) => (r.items ?? []).map((it) => it.item_id))),
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
      new Set(requests.flatMap((r) => (r.items ?? []).map((it) => it.item_id))),
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
      setError(t(lang, "Enter a quantity to issue for at least one item.", "අවම වශයෙන් එක් භාණ්ඩයකට නිකුත් කළ ප්‍රමාණයක් ඇතුළත් කරන්න."));
      return;
    }

    try {
      setBusyId(request.id);
      setError("");
      const updated = await issueStockRequest(request.id, { items });

      if (updated.status === "ISSUED") {
        setRequests((current) => current.filter((r) => r.id !== request.id));
      } else {
        setRequests((current) => current.map((r) => (r.id === request.id ? updated : r)));
        setDrafts((current) => ({
          ...current,
          [request.id]: Object.fromEntries(
            (updated.items ?? []).map((it) => [it.item_id, String(remainingApproved(it))]),
          ),
        }));
      }

      // Stock levels just changed — refresh so the next action in this
      // session reflects reality, not stale numbers.
      await refreshBalances(request.division_id);
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to issue this request. Please try again.", "මෙම ඉල්ලීම නිකුත් කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        {t(lang, "Loading queue…", "පූරණය වෙමින්…")}
      </p>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<Package className="w-9 h-9 text-green-400" />}
        title={t(lang, "All goods issued", "සියලු භාණ්ඩ ගිලිහී ඇත")}
        subtitle={t(lang, "No approved requests pending issuance.", "ගිලිහීමට ඉල්ලීම් නොමැත.")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500">
        {requests.length} {t(lang, "approved request(s) ready to issue", "අනුමත ඉල්ලීම් ගිලිහීමට සූදානම්")}
      </p>

      <div className="max-w-sm">
        <BarcodeScannerInput
          lang={lang}
          onScan={handleScan}
          placeholder={t(lang, "Scan item to verify…", "සත්‍යාපනය සඳහා භාණ්ඩය ස්කෑන් කරන්න…")}
          autoFocus
        />
        {scanError && <p className="mt-1.5 text-xs text-amber-600">{scanError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {requests.map((r) => {
          const hasBackorder = (r.items ?? []).some((it) => Number(it.quantity_issued ?? 0) > 0 && remainingApproved(it) > 0);

          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold text-gray-600">{r.request_number}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">
                      {t(lang, "Approved", "අනුමත")}
                    </span>
                    {hasBackorder && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                        {t(lang, "Partially Issued", "අර්ධ වශයෙන් නිකුත් කර ඇත")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {r.requester?.name ?? `#${r.requester_id}`}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">{formatDate(r.submitted_at)}</div>

                  <div className="rounded-lg border border-gray-100 overflow-hidden mb-3">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        <tr>
                          <th className="px-3 py-2">{t(lang, "Item", "භාණ්ඩය")}</th>
                          <th className="px-3 py-2 w-20 text-center">{t(lang, "Approved", "අනුමත")}</th>
                          <th className="px-3 py-2 w-20 text-center">{t(lang, "Issued", "නිකුත් කළ")}</th>
                          <th className="px-3 py-2 w-24 text-center">{t(lang, "Issue Now", "දැන් නිකුත් කරන්න")}</th>
                          <th className="px-3 py-2 w-24 text-center">{t(lang, "Available", "ලබාගත හැකි")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {(r.items ?? []).map((it) => {
                          const remaining = remainingApproved(it);
                          const balance = balances[it.item_id];
                          const issuingQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                          const short = balance !== undefined && issuingQty > balance.available;

                          return (
                            <tr key={it.id}>
                              <td className="px-3 py-2 text-gray-800">
                                {it.item.item_code} — {it.item.name_en}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-500">
                                {Number(it.quantity_approved)}
                              </td>
                              <td className="px-3 py-2 text-center text-gray-500">
                                {Number(it.quantity_issued ?? 0)}
                              </td>
                              <td className="px-3 py-2">
                                {remaining > 0 ? (
                                  <>
                                    <input
                                      ref={(el) => { issueInputRefs.current[rowKey(r.id, it.item_id)] = el; }}
                                      type="number"
                                      min={0}
                                      max={remaining}
                                      value={drafts[r.id]?.[it.item_id] ?? ""}
                                      onChange={(e) => setDraftQuantity(r.id, it.item_id, e.target.value)}
                                      className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                                    />                 
                                  </>
                                ) : (
                                  <span className="block text-center text-green-600 text-xs">
                                    {t(lang, "Complete", "සම්පූර්ණයි")}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-gray-800">
                                {balance !== undefined && (
                                      <p className={`mt-1 text-[11px] text-center font-medium ${short ? "text-red-500" : "text-gray-400"}`}>
                                        {t(lang, `${balance.available} in stock`, `තොගයේ ${balance.available}`)}
                                      </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {hasBackorder && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {t(
                        lang,
                        "Some items are back-ordered — stock will be issued as it becomes available.",
                        "සමහර භාණ්ඩ තොග නොමැති බැවින් පසුව නිකුත් කෙරේ.",
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleIssue(r)}
                  disabled={busyId === r.id}
                  className="flex items-center gap-2 px-5 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  {busyId === r.id
                    ? t(lang, "Issuing…", "නිකුත් කරමින්…")
                    : t(lang, "Issue Stock", "තොග නිකුත් කරන්න")}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
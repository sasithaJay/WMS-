import { useEffect, useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
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

// requestId -> itemId -> quantity string (as typed in the input)
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


  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingRecommendation({ per_page: 50 });
      setRequests(response.data);

      // seed drafts with the originally requested quantities
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
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <p className="text-sm text-gray-500">
        {t(lang, "Loading queue…", "පූරණය වෙමින්…")}
      </p>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-9 h-9 text-green-400" />}
        title={t(lang, "Queue is empty", "පෝලිම හිස්")}
        subtitle={t(lang, "All recommendation requests have been processed.", "සියලු නිර්දේශ ඉල්ලීම් සකස් කර ඇත.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500">
        {requests.length} {t(lang, "request(s) awaiting your recommendation", "ඉල්ලීමක් ඔබගේ නිර්දේශය බලා සිටී")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm"
          >
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-600">
                      {r.request_number}
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {t(lang, "Pending Recommendation", "නිර්දේශ අපේක්ෂිත")}
                    </span>

                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      {r.request_context}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-gray-900">
                    {/* {r.requester?.name ?? `#${r.requester_id}`} */}
                    {getRequesterName(r.requester, r.id)}
                  </div>

                  <div className="mb-3 text-xs text-gray-400">
                    {formatDate(r.submitted_at)}
                  </div>

                  {r.notes && (
                    <p className="mb-3 text-xs italic text-gray-500">
                      "{r.notes}"
                    </p>
                  )}

                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2">
                            {t(lang, "Item", "භාණ්ඩය")}
                          </th>
                          <th className="w-24 px-3 py-2 text-center">
                            {t(lang, "Requested", "ඉල්ලූ")}
                          </th>
                          <th className="w-28 px-3 py-2 text-center">
                            {t(lang, "Recommend", "නිර්දේශ")}
                          </th>
                          <th className="w-28 px-3 py-2 text-center">
                            {t(lang, "Available", "ලබාගත හැකි")}
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {(r.items ?? []).map((it) => (
                          <tr key={it.id}>
                            <td className="px-3 py-2 text-gray-800">
                              {it.item.item_code} — {it.item.name_en}
                            </td>

                            <td className="px-3 py-2 text-center text-gray-500">
                              {Number(it.quantity_requested)}
                            </td>

                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={drafts[r.id]?.[it.item_id] ?? ""}
                                onChange={(e) => setDraftQuantity(r.id, it.item_id, e.target.value)}
                                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                              />
                        
                            </td>
                            <td>
                              {(() => {
                                const avail = liveAvailable(it.item_id);
                                if (avail === null) return null;
                                const requestedQty = Number(drafts[r.id]?.[it.item_id] ?? 0);
                                const short = requestedQty > avail;
                                return (
                                  <p className={`mt-1 text-[12px] text-center ${short ? "text-red-500 font-semibold" : "text-gray-400 font-semibold"}`}>
                                    {t(lang, `${avail} in stock`, `තොගයේ ${avail}`)}
                                  </p>
                                );
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="mt-5 border-t border-gray-100 pt-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setRejectingId(r.id)}
                  disabled={busyId === r.id}
                  className="w-full rounded-xl border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50 sm:w-auto"
                >
                  {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>

                <button
                  onClick={() => handleRecommend(r)}
                  disabled={busyId === r.id || !isDraftValid(r)}
                  className="w-full rounded-xl bg-[#4295D9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3280C4] disabled:opacity-50 sm:w-auto"
                >
                  {busyId === r.id
                    ? t(lang, "Processing…", "සකසමින්…")
                    : t(lang, "Recommend", "නිර්දේශ")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reject dialog with reason */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(lang, "Reject this request?", "මෙම ඉල්ලීම ප්‍රතික්ෂේප කරන්නද?")}
            </h4>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {t(lang, "Reason", "හේතුව")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4295D9]"
              placeholder={t(lang, "Why is this being rejected?", "ප්‍රතික්ෂේප කිරීමට හේතුව?")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim() || busyId === rejectingId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t(lang, "Confirm Rejection", "ප්‍රතික්ෂේපය තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
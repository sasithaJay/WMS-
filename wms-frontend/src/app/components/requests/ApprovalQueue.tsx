import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  getPendingApproval,
  approveStockRequest,
  rejectStockRequest,
} from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest } from "../../types/stockRequests";

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

// requestId -> itemId -> quantity string (as typed in the input)
type QuantityDraft = Record<number, Record<number, string>>;

/** The baseline quantity approval is measured against for a given item. */
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [drafts, setDrafts] = useState<QuantityDraft>({});
  const [qtyChangeComments, setQtyChangeComments] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<Record<number, string>>({});

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
        t(lang, "Unable to load the approval queue.", "අනුමැති පෝලිම පූරණය කළ නොහැක."),
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

  function setDraftQuantity(requestId: number, itemId: number, value: string) {
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
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to approve this request. Please try again.", "මෙම ඉල්ලීම අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."),
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
        title={t(lang, "No pending approvals", "අනුමත ඉල්ලීම් නැත")}
        subtitle={t(lang, "All requests have been processed.", "සියලු ඉල්ලීම් සකස් කර ඇත.")}
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
        {requests.length}{" "}
        {t(
          lang,
          "request(s) awaiting your approval",
          "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී"
        )}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((r) => {
          const changed = hasQuantityChanges(r);

          return (
            <div
              key={r.id}
              className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              {/* Card Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs font-bold text-gray-600">
                    {r.request_number}
                  </span>

                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                    {t(lang, "Pending Approval", "අනුමත අපේක්ෂිත")}
                  </span>

                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                    {r.request_context}
                  </span>
                </div>

                <div className="text-sm font-semibold text-gray-900">
                  {r.requester?.name ?? `#${r.requester_id}`}
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  {formatDate(r.submitted_at)}
                </div>

                {r.notes && (
                  <p className="mb-3 text-xs italic text-gray-500">
                    "{r.notes}"
                  </p>
                )}

                <div className="overflow-hidden rounded-xl border border-gray-100 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                          {t(lang, "Item", "භාණ්ඩය")}
                        </th>

                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">
                          {t(lang, "Recommended", "නිර්දේශිත")}
                        </th>

                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">
                          {t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                      {(r.items ?? []).map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                            {it.item.item_code} — {it.item.name_en}
                          </td>

                          <td className="px-4 py-2.5 text-center text-sm text-gray-500">
                            {baselineQuantity(it)}
                          </td>

                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min={0}
                              max={baselineQuantity(it)}
                              value={drafts[r.id]?.[it.item_id] ?? ""}
                              onChange={(e) =>
                                setDraftQuantity(
                                  r.id,
                                  it.item_id,
                                  e.target.value
                                )
                              }
                              className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {t(
                    lang,
                    "You may reduce quantities before approving.",
                    "අනුමත කිරීමට පෙර ප්‍රමාණ අඩු කළ හැකිය."
                  )}
                </div>

                {changed && (
                  <div className="mb-4">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">
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
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[#4295D9] focus:outline-none focus:ring-2 focus:ring-[#4295D9]/20"
                      placeholder={t(
                        lang,
                        "Example: Only partial stock is available.",
                        "උදාහරණය: තොගයේ පවතින්නේ කොටස් ප්‍රමාණයක් පමණි."
                      )}
                    />
                  </div>
                )}

                {validationError[r.id] && (
                  <p className="mb-3 text-xs text-red-500">
                    {validationError[r.id]}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => {
                      setRejectingId(r.id);
                      setRejectReason("");
                    }}
                    disabled={busyId === r.id}
                    className="w-full rounded-xl border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50 sm:w-auto"
                  >
                    {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                  </button>

                  <button
                    onClick={() => handleApprove(r)}
                    disabled={busyId === r.id}
                    className="w-full rounded-xl bg-[#4295D9] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3280C4] disabled:opacity-50 sm:w-auto"
                  >
                    {busyId === r.id
                      ? t(lang, "Processing…", "සකසමින්…")
                      : t(lang, "Approve", "අනුමත")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Keep your existing reject modal exactly as it is */}
      {rejectingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {t(lang, "Reject Request", "ඉල්ලීම ප්‍රතික්ෂේප කරන්න")}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {t(
                lang,
                "Please enter the reason for rejecting this request.",
                "මෙම ඉල්ලීම ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න.",
              )}
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder={t(lang, "Enter reject reason...", "ප්‍රතික්ෂේප හේතුව ඇතුළත් කරන්න...")}
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                disabled={busyId === rejectingId}
                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!rejectReason.trim() || busyId === rejectingId}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {t(lang, "Confirm Reject", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
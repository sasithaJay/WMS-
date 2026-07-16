import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Eye, Loader2, Pencil, XCircle } from "lucide-react";

import {
  getStockReceipts,
  confirmStockReceipt,
  cancelStockReceipt,
} from "../../../services/stockReceiptService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type {
  StockReceipt,
  StockReceiptStatus,
} from "../../../app/types/stockReceipts";

interface StockReceiptsListProps {
  lang: Lang;
  onEdit: (receipt: StockReceipt) => void;
  onView: (receipt: StockReceipt) => void;
  onStockChanged?: () => void;
}

const STATUS_STYLES: Record<StockReceiptStatus, string> = {
  DRAFT: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap",
  CONFIRMED: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap",
  CANCELLED: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 whitespace-nowrap",
};

const PAGE_SIZE = 5;

export function StockReceiptsList({
  lang,
  onEdit,
  onView,
  onStockChanged,
}: StockReceiptsListProps) {
  const [receipts, setReceipts] = useState<StockReceipt[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // action state
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadFirstPage = useCallback(async () => {
    try {
      setLoading((prev) => (receipts.length === 0 ? true : prev));
      setError("");

      const response = await getStockReceipts({
        page: 1,
        per_page: PAGE_SIZE,
      });

      setReceipts(response.data);
      setVisibleCount(PAGE_SIZE);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to load stock receipts.", "තොග රිසිට් පූරණය කළ නොහැක."),
      );
    } finally {
      setLoading(false);
    }
  }, [lang, receipts.length]);

  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSeeMore() {
    const nextVisibleCount = visibleCount + PAGE_SIZE;

    // Enough already cached — just reveal more, no API call.
    if (nextVisibleCount <= receipts.length) {
      setVisibleCount(nextVisibleCount);
      return;
    }

    setVisibleCount(receipts.length);

    if (currentPage >= lastPage) return;

    try {
      setLoadingMore(true);
      setError("");

      const nextPage = currentPage + 1;
      const response = await getStockReceipts({
        page: nextPage,
        per_page: PAGE_SIZE,
      });

      setReceipts((current) => {
        const updated = [...current, ...response.data];
        setVisibleCount(Math.min(nextVisibleCount, updated.length));
        return updated;
      });
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to load more receipts.", "තවත් රිසිට් පූරණය කළ නොහැක."),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleShowLess() {
    setVisibleCount(PAGE_SIZE);
  }

  async function handleConfirm(id: number) {
    try {
      setBusyId(id);
      const updated = await confirmStockReceipt(id);
      setReceipts((current) =>
        current.map((r) => (r.id === id ? updated : r)),
      );
      onStockChanged?.();
      setConfirmingId(null);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to confirm this receipt. Please try again.",
          "මෙම රිසිට් තහවුරු කළ නොහැක. නැවත උත්සාහ කරන්න.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: number, reason: string) {
    if (!cancelReason.trim()) return;

    try {
      setBusyId(id);
      const updated = await cancelStockReceipt(id, reason);
      setReceipts((current) =>
        current.map((r) => (r.id === id ? updated : r)),
      );
      setCancellingId(null);
      setCancelReason("");
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to cancel this receipt. Please try again.",
          "මෙම රිසිට් අවලංගු කළ නොහැක. නැවත උත්සාහ කරන්න.",
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        {t(lang, "Loading receipts…", "පූරණය වෙමින්…")}
      </p>
    );
  }

  const visibleReceipts = receipts.slice(0, visibleCount);
  const canSeeMore = visibleCount < receipts.length || currentPage < lastPage;
  const isExpanded = visibleCount > PAGE_SIZE;

  return (
    <div className="space-y-4 bg-white">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-4 py-3">{t(lang, "GRN No.", "GRN අංකය")}</th>
              <th className="px-4 py-3">{t(lang, "Supplier", "සැපයුම්කරු")}</th>
              <th className="px-4 py-3">{t(lang, "Date", "දිනය")}</th>
              <th className="px-4 py-3">{t(lang, "Items", "භාණ්ඩ")}</th>
              <th className="px-4 py-3">{t(lang, "Status", "තත්ත්වය")}</th>
              <th className="px-4 py-3 text-right">
                {t(lang, "Actions", "ක්‍රියා")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleReceipts.map((receipt) => (
              <tr key={receipt.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {receipt.grn_number}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {receipt.supplier_name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {receipt.received_date.trim() ? new Date(receipt.received_date).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {receipt.items_count ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[receipt.status]}`}
                  >
                    {receipt.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(receipt)}
                      title={t(lang, "View", "බලන්න")}
                      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {receipt.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => onEdit(receipt)}
                          title={t(lang, "Edit", "සංස්කරණය")}
                          className="rounded-lg p-1.5 text-[#4295D9] hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setConfirmingId(receipt.id)}
                          title={t(lang, "Confirm", "තහවුරු කරන්න")}
                          disabled={busyId === receipt.id}
                          className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setCancellingId(receipt.id)}
                          title={t(lang, "Cancel", "අවලංගු")}
                          disabled={busyId === receipt.id}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {receipts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  {t(lang, "No stock receipts yet.", "තොග රිසිට් නොමැත.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {receipts.length > 0 && (canSeeMore || isExpanded) && (
          <div className="border-t border-gray-100 px-4 py-3">
            <button
              type="button"
              onClick={canSeeMore ? handleSeeMore : handleShowLess}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#4295D9] hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t(lang, "Loading…", "පූරණය වෙමින්…")}
                </>
              ) : canSeeMore ? (
                <>
                  {t(lang, "See More", "තව බලන්න")}
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  {t(lang, "Show Less", "අඩුවෙන් පෙන්වන්න")}
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {confirmingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(lang, "Confirm this receipt?", "මෙම රිසිට් තහවුරු කරන්නද?")}
            </h4>
            <p className="mt-2 text-xs text-gray-500">
              {t(
                lang,
                "This will add all items to stock and cannot be undone.",
                "මෙය සියලු භාණ්ඩ තොගයට එකතු කරයි, පසුව අවලංගු කළ නොහැක.",
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmingId(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, "Cancel", "අවලංගු")}
              </button>
              <button
                onClick={() => handleConfirm(confirmingId)}
                disabled={busyId === confirmingId}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {t(lang, "Yes, Confirm", "ඔව්, තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel dialog with reason */}
      {cancellingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(lang, "Cancel this receipt?", "මෙම රිසිට් අවලංගු කරන්නද?")}
            </h4>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {t(lang, "Reason", "හේතුව")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4295D9]"
              placeholder={t(lang, "Why is this being cancelled?", "අවලංගු කිරීමට හේතුව?")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCancellingId(null);
                  setCancelReason("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                onClick={() => handleCancel(cancellingId, cancelReason)}
                disabled={!cancelReason.trim() || busyId === cancellingId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t(lang, "Confirm Cancellation", "අවලංගු කිරීම තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
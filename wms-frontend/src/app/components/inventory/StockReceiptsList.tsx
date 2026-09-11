import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Loader2,
  Pencil,
  XCircle,
  AlertCircle,
  Receipt,
  Inbox,
  Building2,
  Calendar,
  Package,
} from "lucide-react";

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
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200/80",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
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

  // Action State
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
        t(lang, "Unable to load stock receipts.", "තොග රිසිට් පූරණය කළ නොහැක.")
      );
    } finally {
      setLoading(false);
    }
  }, [lang, receipts.length]);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function handleSeeMore() {
    const nextVisibleCount = visibleCount + PAGE_SIZE;

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
        t(lang, "Unable to load more receipts.", "තවත් රිසිට් පූරණය කළ නොහැක.")
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
        current.map((r) => (r.id === id ? updated : r))
      );
      onStockChanged?.();
      setConfirmingId(null);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to confirm this receipt. Please try again.",
          "මෙම රිසිට් තහවුරු කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
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
        current.map((r) => (r.id === id ? updated : r))
      );
      setCancellingId(null);
      setCancelReason("");
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to cancel this receipt. Please try again.",
          "මෙම රිසිට් අවලංගු කළ නොහැක. නැවත උත්සාහ කරන්න."
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
          {t(lang, "Loading receipts…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  const visibleReceipts = receipts.slice(0, visibleCount);
  const canSeeMore = visibleCount < receipts.length || currentPage < lastPage;
  const isExpanded = visibleCount > PAGE_SIZE;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MAIN CONTENT CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 whitespace-nowrap">
                  {t(lang, "GRN No.", "GRN අංකය")}
                </th>
                <th className="px-5 py-3 whitespace-nowrap">
                  {t(lang, "Supplier", "සැපයුම්කරු")}
                </th>
                <th className="px-5 py-3 whitespace-nowrap">
                  {t(lang, "Date", "දිනය")}
                </th>
                <th className="px-5 py-3 whitespace-nowrap">
                  {t(lang, "Items", "භාණ්ඩ")}
                </th>
                <th className="px-5 py-3 whitespace-nowrap">
                  {t(lang, "Status", "තත්ත්වය")}
                </th>
                <th className="px-5 py-3 text-right whitespace-nowrap">
                  {t(lang, "Actions", "ක්‍රියා")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visibleReceipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-900 whitespace-nowrap">
                    {receipt.grn_number}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium whitespace-nowrap">
                    {receipt.supplier_name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                    {receipt.received_date.trim()
                      ? new Date(receipt.received_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-slate-700 whitespace-nowrap">
                    {receipt.items_count ?? "-"}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        STATUS_STYLES[receipt.status]
                      }`}
                    >
                      {receipt.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(receipt)}
                        title={t(lang, "View", "බලන්න")}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60 transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {receipt.status === "DRAFT" && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(receipt)}
                            title={t(lang, "Edit", "සංස්කරණය")}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 transition-all cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirmingId(receipt.id)}
                            title={t(lang, "Confirm", "තහවුරු කරන්න")}
                            disabled={busyId === receipt.id}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200/60 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {busyId === receipt.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setCancellingId(receipt.id)}
                            title={t(lang, "Cancel", "අවලංගු")}
                            disabled={busyId === receipt.id}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/60 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {receipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-500">
                        {t(lang, "No stock receipts yet.", "තොග රිසිට් නොමැත.")}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (<md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {visibleReceipts.map((receipt) => (
            <div key={receipt.id} className="p-4 space-y-3 bg-white">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-mono text-xs font-bold text-slate-900">
                      {receipt.grn_number}
                    </h4>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-0.5 ${
                        STATUS_STYLES[receipt.status]
                      }`}
                    >
                      {receipt.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onView(receipt)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t(lang, "View", "බලන්න")}</span>
                </button>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {t(lang, "Supplier", "සැපයුම්කරු")}
                  </span>
                  <span className="font-bold text-slate-700 truncate block mt-0.5">
                    {receipt.supplier_name}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t(lang, "Date", "දිනය")}
                  </span>
                  <span className="font-bold text-slate-700 block mt-0.5">
                    {receipt.received_date.trim()
                      ? new Date(receipt.received_date).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="col-span-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {t(lang, "Items Count", "භාණ්ඩ ප්‍රමාණය")}
                  </span>
                  <span className="font-bold font-mono text-slate-700 block mt-0.5">
                    {receipt.items_count ?? "-"}
                  </span>
                </div>
              </div>

              {/* Card Actions Footer for Draft Status */}
              {receipt.status === "DRAFT" && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => onEdit(receipt)}
                    className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{t(lang, "Edit", "සංස්කරණය")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmingId(receipt.id)}
                    disabled={busyId === receipt.id}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {busyId === receipt.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    <span>{t(lang, "Confirm", "තහවුරු කරන්න")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCancellingId(receipt.id)}
                    disabled={busyId === receipt.id}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>{t(lang, "Cancel", "අවලංගු")}</span>
                  </button>
                </div>
              )}
            </div>
          ))}

          {receipts.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {t(lang, "No stock receipts yet.", "තොග රිසිට් නොමැත.")}
              </p>
            </div>
          )}
        </div>

        {/* PAGINATION / EXPAND CONTROLS */}
        {receipts.length > 0 && (canSeeMore || isExpanded) && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <button
              type="button"
              onClick={canSeeMore ? handleSeeMore : handleShowLess}
              disabled={loadingMore}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t(lang, "Loading…", "පූරණය වෙමින්…")}</span>
                </>
              ) : canSeeMore ? (
                <>
                  <span>{t(lang, "See More", "තව බලන්න")}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>{t(lang, "Show Less", "අඩුවෙන් පෙන්වන්න")}</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* CONFIRM MODAL DIALOG */}
      {confirmingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setConfirmingId(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200/80 z-10 space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Confirm this receipt?", "මෙම රිසිට් තහවුරු කරන්නද?")}
              </h4>
              <p className="mt-1 text-xs font-medium text-slate-500 leading-relaxed">
                {t(
                  lang,
                  "This will add all items to stock and cannot be undone.",
                  "මෙය සියලු භාණ්ඩ තොගයට එකතු කරයි, පසුව අවලංගු කළ නොහැක."
                )}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmingId(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු")}
              </button>
              <button
                type="button"
                onClick={() => handleConfirm(confirmingId)}
                disabled={busyId === confirmingId}
                className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyId === confirmingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>{t(lang, "Yes, Confirm", "ඔව්, තහවුරු කරන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL DIALOG */}
      {cancellingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => {
              setCancellingId(null);
              setCancelReason("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200/80 z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Cancel this receipt?", "මෙම රිසිට් අවලංගු කරන්නද?")}
              </h4>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {t(
                  lang,
                  "Please provide a reason for cancelling this receipt.",
                  "මෙම රිසිට්පත අවලංගු කිරීමට හේතුව සපයන්න."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Reason", "හේතුව")}
                <span className="text-rose-500"> *</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none placeholder:text-slate-400"
                placeholder={t(
                  lang,
                  "Why is this being cancelled?",
                  "අවලංගු කිරීමට හේතුව?"
                )}
              />
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingId(null);
                  setCancelReason("");
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                type="button"
                onClick={() => handleCancel(cancellingId, cancelReason)}
                disabled={!cancelReason.trim() || busyId === cancellingId}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyId === cancellingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {t(lang, "Confirm Cancellation", "අවලංගු කිරීම තහවුරු කරන්න")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
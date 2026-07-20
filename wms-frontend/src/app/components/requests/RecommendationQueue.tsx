import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  getPendingRecommendation,
  recommendStockRequest,
  rejectStockRequest,
} from "../../../services/stockRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { StockRequest } from "../../types/stockRequests";

function ItemChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#EBF4FD] text-[#4295D9] border-blue-100">
      {label}
    </span>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

export function RecommendationQueue({ lang }: { lang: Lang }) {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingRecommendation({ per_page: 50 });
      setRequests(response.data);
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

  async function handleRecommend(id: number) {
    try {
      setBusyId(id);
      setError("");
      await recommendStockRequest(id, {});
      setRequests((current) => current.filter((r) => r.id !== id));
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

      {requests.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-xs font-bold text-gray-600">{r.request_number}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {t(lang, "Pending Recommendation", "නිර්දේශ අපේක්ෂිත")}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">
                  {r.request_context}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {r.requester?.name ?? `#${r.requester_id}`}
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {formatDate(r.submitted_at)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(r.items ?? []).map((it) => (
                  <ItemChip key={it.id} label={`${it.item.item_code} × ${Number(it.quantity_requested)}`} />
                ))}
              </div>
              {r.notes && (
                <p className="mt-3 text-xs text-gray-500 italic">"{r.notes}"</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setRejectingId(r.id)}
              disabled={busyId === r.id}
              className="flex-1 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {t(lang, "Reject", "ප්‍රතික්ෂේප")}
            </button>
            <button
              onClick={() => handleRecommend(r.id)}
              disabled={busyId === r.id}
              className="flex-1 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50"
            >
              {busyId === r.id
                ? t(lang, "Processing…", "සකසමින්…")
                : t(lang, "Recommend", "නිර්දේශ")}
            </button>
          </div>
        </div>
      ))}

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
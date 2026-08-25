import { useEffect, useState, useCallback } from "react";
import { CheckCircle } from "lucide-react";
import {
  getPendingVatRates,
  approveVatRate,
  rejectVatRate,
} from "../../../services/vatRateService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { VatRate } from "../../types/vatRate";

export function VatRateApprovalQueue({ lang }: { lang: Lang }) {
  const [requests, setRequests] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingVatRates();
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load pending VAT requests.", "අපේක්ෂිත VAT ඉල්ලීම් පූරණය කළ නොහැක."));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleApprove(id: number) {
    try {
      setBusyId(id);
      setError("");
      await approveVatRate(id);
      setRequests((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to approve this VAT rate. Please try again.", "මෙම VAT අනුපාතය අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    if (!comment.trim()) return;

    try {
      setBusyId(id);
      setError("");
      await rejectVatRate(id, comment);
      setRequests((current) => current.filter((r) => r.id !== id));
      setRejectingId(null);
      setComment("");
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to reject this VAT rate. Please try again.", "මෙම VAT අනුපාතය ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>;
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-9 h-9 text-green-400" />}
        title={t(lang, "No pending VAT requests", "අපේක්ෂිත VAT ඉල්ලීම් නොමැත")}
        subtitle={t(lang, "All VAT rate change requests have been reviewed.", "සියලු VAT අනුපාත වෙනස් කිරීමේ ඉල්ලීම් සමාලෝචනය කර ඇත.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {requests.map((r) => (
        <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
              {t(lang, "Pending Approval", "අනුමැතිය අපේක්ෂිතයි")}
            </span>
          </div>

          <div className="text-2xl font-bold text-gray-900 mb-1">{Number(r.percentage)}%</div>
          <div className="text-xs text-gray-400 mb-4">
            {t(lang, "Proposed by", "යෝජනා කළේ")}: {r.requester?.staff_profile?.full_name ?? "-"} · {new Date(r.created_at).toLocaleDateString()}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setRejectingId(r.id);
                setComment("");
              }}
              disabled={busyId === r.id}
              className="flex-1 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
            >
              {t(lang, "Reject", "ප්‍රතික්ෂේප")}
            </button>
            <button
              onClick={() => handleApprove(r.id)}
              disabled={busyId === r.id}
              className="flex-1 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50"
            >
              {busyId === r.id ? t(lang, "Processing…", "සකසමින්…") : t(lang, "Approve", "අනුමත")}
            </button>
          </div>
        </div>
      ))}

      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(lang, "Reject this VAT rate?", "මෙම VAT අනුපාතය ප්‍රතික්ෂේප කරන්නද?")}
            </h4>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {t(lang, "Comment", "අදහස")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4295D9]"
              placeholder={t(lang, "Why is this being rejected?", "ප්‍රතික්ෂේප කිරීමට හේතුව?")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setComment("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!comment.trim() || busyId === rejectingId}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t(lang, "Confirm Rejection", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
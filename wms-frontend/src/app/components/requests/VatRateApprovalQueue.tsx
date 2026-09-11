import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, XCircle, Percent } from "lucide-react";
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
      setError(
        t(
          lang,
          "Unable to load pending VAT requests.",
          "අපේක්ෂිත VAT ඉල්ලීම් පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [lang, requests.length]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  async function handleApprove(id: number) {
    try {
      setBusyId(id);
      setError("");
      await approveVatRate(id);
      setRequests((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to approve this VAT rate. Please try again.",
          "මෙම VAT අනුපාතය අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
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
      setError(
        t(
          lang,
          "Unable to reject this VAT rate. Please try again.",
          "මෙම VAT අනුපාතය ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."
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
          {t(lang, "Loading…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  if (!loading && requests.length === 0 && !error) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="w-9 h-9 text-emerald-500" />}
        title={t(lang, "No pending VAT requests", "අපේක්ෂිත VAT ඉල්ලීම් නොමැත")}
        subtitle={t(
          lang,
          "All VAT rate change requests have been reviewed.",
          "සියලු VAT අනුපාත වෙනස් කිරීමේ ඉල්ලීම් සමාලෝචනය කර ඇත."
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

      {/* REQUESTS QUEUE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                  {t(lang, "Pending Approval", "අනුමැතිය අපේක්ෂිතයි")}
                </span>
                <span className="text-[11px] font-mono font-medium text-slate-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {Number(r.percentage)}%
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {t(lang, "Proposed by", "යෝජනා කළේ")}:{" "}
                    <strong className="text-slate-700">
                      {r.requester?.staff_profile?.full_name ?? "—"}
                    </strong>
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(r.id);
                  setComment("");
                }}
                disabled={busyId === r.id}
                className="flex-1 h-9 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t(lang, "Reject", "ප්‍රතික්ෂේප")}
              </button>

              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                disabled={busyId === r.id}
                className="flex-1 h-9 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {busyId === r.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t(lang, "Processing…", "සකසමින්…")}</span>
                  </>
                ) : (
                  <span>{t(lang, "Approve", "අනුමත")}</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REJECTION REASON DIALOG MODAL */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => {
              setRejectingId(null);
              setComment("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200/80 z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Reject this VAT rate?", "මෙම VAT අනුපාතය ප්‍රතික්ෂේප කරන්නද?")}
              </h4>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {t(
                  lang,
                  "Please provide a comment for rejecting this request.",
                  "මෙම ඉල්ලීම ප්‍රතික්ෂේප කිරීම සඳහා අදහසක් සපයන්න."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Comment", "අදහස")}
                <span className="text-rose-500"> *</span>
              </label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none placeholder:text-slate-400"
                placeholder={t(
                  lang,
                  "Why is this being rejected?",
                  "ප්‍රතික්ෂේප කිරීමට හේතුව?"
                )}
              />
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setComment("");
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={!comment.trim() || busyId === rejectingId}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyId === rejectingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {t(lang, "Confirm Rejection", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
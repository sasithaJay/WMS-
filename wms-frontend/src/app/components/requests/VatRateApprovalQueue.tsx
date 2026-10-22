import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, XCircle, Percent, ArrowRight, Building2, CalendarClock } from "lucide-react";
import {
  getPendingVatRates,
  approveVatRate,
  rejectVatRate,
} from "../../../services/vatRateService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { VatRate } from "../../types/vatRate";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";

function formatPercent(value: number): string {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}

function formatRequestDate(value: string, lang: Lang): string {
  return new Date(value).toLocaleString(lang === "si" ? "si-LK" : "en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function VatRateApprovalQueue({ lang }: { lang: Lang }) {
  const { triggerBadgeRefresh } = useBadgeRefresh();
  const [requests, setRequests] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [currentPercentage, setCurrentPercentage] = useState<number | null>(null);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingVatRates();
      setRequests(response.data);
      setCurrentPercentage(response.current_percentage);
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
      triggerBadgeRefresh();
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
      triggerBadgeRefresh();
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {t(lang, "Current approved VAT rate", "දැනට අනුමත VAT අනුපාතය")}
            </p>
            <p className="text-2xl font-extrabold font-mono text-slate-900">
              {currentPercentage === null ? "—" : formatPercent(currentPercentage)}
            </p>
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold text-slate-500">
            {t(lang, "Awaiting review", "සමාලෝචනයට බලාපොරොත්තුවෙන්")}
          </p>
          <p className="text-lg font-bold text-slate-800">
            {requests.length} {t(lang, "pending request(s)", "අපේක්ෂිත ඉල්ලීම්")}
          </p>
        </div>
      </div>

      {/* REQUESTS QUEUE CARDS */}
      <div className="grid grid-cols-1 gap-4">
        {requests.map((r) => {
          const rateChange = currentPercentage === null
            ? null
            : Number(r.percentage) - currentPercentage;

          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-all flex flex-col space-y-4 xl:grid xl:grid-cols-[220px_1fr_1.2fr_180px] xl:items-center xl:gap-5 xl:space-y-0 xl:px-6 xl:py-5"
            >
              {/* SECTION 1: Status & Proposed Percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                    {t(lang, "Pending Approval", "අනුමැතිය අපේක්ෂිතයි")}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-400">
                    {t(lang, "Request", "ඉල්ලීම")} #{r.id}
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
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate max-w-[140px]">
                      {t(lang, "Proposed by", "යෝජනා කළේ")}:{" "}
                      <strong className="text-slate-700">
                        {r.requester?.staff_profile?.full_name ?? "—"}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Rate Comparison */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {t(lang, "Current rate", "වත්මන් අනුපාතය")}
                    </p>
                    <p className="mt-1 text-sm font-bold font-mono text-slate-700">
                      {currentPercentage === null ? "—" : formatPercent(currentPercentage)}
                    </p>
                  </div>
                  <div className="border-l border-slate-200 pl-3">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {t(lang, "Proposed rate", "යෝජිත අනුපාතය")}
                    </p>
                    <p className="mt-1 text-sm font-bold font-mono text-blue-700">
                      {formatPercent(Number(r.percentage))}
                    </p>
                  </div>
                </div>
                <div className={`mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[11px] font-semibold ${rateChange === null ? "text-slate-500" : rateChange > 0 ? "text-amber-700" : rateChange < 0 ? "text-emerald-700" : "text-slate-500"}`}>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {rateChange === null
                      ? t(lang, "Comparing with current rate…", "වත්මන් අනුපාතය සමඟ සසඳමින්…")
                      : rateChange > 0
                        ? `${t(lang, "Increase of", "වැඩිවීම")} ${formatPercent(rateChange)}`
                        : rateChange < 0
                          ? `${t(lang, "Decrease of", "අඩුවීම")} ${formatPercent(Math.abs(rateChange))}`
                          : t(lang, "No change", "වෙනසක් නැත")}
                  </span>
                </div>
              </div>

              {/* SECTION 3: Requester Details & Date */}
              <div className="rounded-xl border border-slate-100 p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {t(lang, "Requested by", "ඉල්ලීම කළේ")}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">
                    {r.requester?.staff_profile?.full_name ?? r.requester?.username ?? t(lang, "Unknown requester", "නොදන්නා ඉල්ලුම්කරු")}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                    {r.requester?.staff_profile?.role?.name_en ?? t(lang, "Role unavailable", "තනතුර නොමැත")}
                    {r.requester?.staff_profile?.division?.name_en ? ` · ${r.requester.staff_profile.division.name_en}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <CalendarClock className="ml-auto w-4 h-4 text-slate-400" />
                  <p className="mt-0.5 text-[10px] font-mono font-medium text-slate-500">
                    {formatRequestDate(r.created_at, lang)}
                  </p>
                </div>
              </div>

              {/* SECTION 4: Action Buttons (Side-by-side on mobile, Approve on top / Reject below on PC) */}
              <div className="pt-3 border-t border-slate-100 flex flex-row xl:flex-col gap-2.5 xl:pt-0 xl:border-t-0 xl:border-l xl:border-slate-100 xl:pl-4 xl:justify-center">
                <button
                  type="button"
                  onClick={() => handleApprove(r.id)}
                  disabled={busyId === r.id}
                  className="flex-1 xl:flex-none w-full h-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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

                <button
                  type="button"
                  onClick={() => {
                    setRejectingId(r.id);
                    setComment("");
                  }}
                  disabled={busyId === r.id}
                  className="flex-1 xl:flex-none w-full h-10 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>
              </div>
            </div>
          );
        })}
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

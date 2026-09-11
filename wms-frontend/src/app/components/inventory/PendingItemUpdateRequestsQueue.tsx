import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, XCircle, FileEdit } from "lucide-react";
import {
  getPendingItemUpdateRequests,
  approveItemUpdateRequest,
  rejectItemUpdateRequest,
} from "../../../services/itemUpdateRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { ItemUpdateRequest, ItemUpdateRequestValues } from "../../types/itemUpdateRequests";

const FIELD_LABELS: Record<keyof ItemUpdateRequestValues, { en: string; si: string }> = {
  category_id: { en: "Category", si: "වර්ගය" },
  unit_id: { en: "Unit", si: "ඒකකය" },
  item_code: { en: "Item Code", si: "භාණ්ඩ කේතය" },
  name_en: { en: "Name", si: "නාමය" },
  description: { en: "Description", si: "විස්තරය" },
  barcode: { en: "Barcode", si: "බාර්කේතය" },
  reorder_level: { en: "Reorder Level", si: "නැවත ඇණවුම් මට්ටම" },
};

function DiffRow({
  label,
  oldValue,
  newValue,
}: {
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  lang: Lang;
}) {
  const changed = String(oldValue ?? "") !== String(newValue ?? "");
  if (!changed) return null;

  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100/80 last:border-b-0 text-xs items-center">
      <span className="font-bold text-slate-500 truncate">{label}</span>
      <span className="font-mono text-rose-600 font-semibold bg-rose-50/60 px-2 py-0.5 rounded-md truncate">
        {oldValue ?? "—"}
      </span>
      <span className="font-mono text-emerald-700 font-extrabold bg-emerald-50/60 px-2 py-0.5 rounded-md truncate">
        {newValue ?? "—"}
      </span>
    </div>
  );
}

export function PendingItemUpdateRequestsQueue({ lang }: { lang: Lang }) {
  const [requests, setRequests] = useState<ItemUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      setLoading((prev) => (requests.length === 0 ? true : prev));
      setError("");
      const response = await getPendingItemUpdateRequests({ per_page: 50 });
      setRequests(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load pending item updates.",
          "අපේක්ෂිත භාණ්ඩ යාවත්කාලීන පූරණය කළ නොහැක."
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
      await approveItemUpdateRequest(id);
      setRequests((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to approve this update. Please try again.",
          "මෙම යාවත්කාලීන කිරීම අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    if (!reviewComment.trim()) return;

    try {
      setBusyId(id);
      setError("");
      await rejectItemUpdateRequest(id, reviewComment);
      setRequests((current) => current.filter((r) => r.id !== id));
      setRejectingId(null);
      setReviewComment("");
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to reject this update. Please try again.",
          "මෙම යාවත්කාලීන කිරීම ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."
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
        title={t(lang, "No pending item updates", "අපේක්ෂිත භාණ්ඩ යාවත්කාලීන නොමැත")}
        subtitle={t(
          lang,
          "All item update requests have been reviewed.",
          "සියලු භාණ්ඩ යාවත්කාලීන ඉල්ලීම් සමාලෝචනය කර ඇත."
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

      {/* REQUESTS GRID */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            {/* Request Card Header & Body */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      {r.item?.item_code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                      {t(lang, "Pending Review", "සමාලෝචනය අපේක්ෂිතයි")}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {r.item?.name_en}
                  </h4>
                </div>

                <span className="text-[11px] font-medium text-slate-400 shrink-0">
                  {t(lang, "Requested by", "ඉල්ලූයේ")}:{" "}
                  <strong className="text-slate-700">
                    {r.requester?.name ??
                      r.requester?.username ??
                      `#${r.requested_by}`}
                  </strong>
                </span>
              </div>

              {/* Diffs Table */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-200/60 mb-1">
                  <span>{t(lang, "Field", "ක්ෂේත්‍රය")}</span>
                  <span>{t(lang, "Current", "වත්මන්")}</span>
                  <span>{t(lang, "Requested", "ඉල්ලූ")}</span>
                </div>

                {(
                  Object.keys(FIELD_LABELS) as (keyof ItemUpdateRequestValues)[]
                ).map((field) => (
                  <DiffRow
                    key={field}
                    label={t(
                      lang,
                      FIELD_LABELS[field].en,
                      FIELD_LABELS[field].si
                    )}
                    oldValue={r.old_values[field]}
                    newValue={r.new_values[field]}
                    lang={lang}
                  />
                ))}
              </div>

              {/* Reason Banner */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-blue-900 font-medium leading-relaxed">
                <strong className="font-bold text-blue-700 uppercase tracking-wide text-[10px] block mb-0.5">
                  {t(lang, "Reason", "හේතුව")}
                </strong>
                {r.reason}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(r.id);
                  setReviewComment("");
                }}
                disabled={busyId === r.id}
                className="w-full sm:w-auto h-9 px-4 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {t(lang, "Reject", "ප්‍රතික්ෂේප")}
              </button>

              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                disabled={busyId === r.id}
                className="w-full sm:w-auto h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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

      {/* REJECTION REASON DIALOG */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => {
              setRejectingId(null);
              setReviewComment("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200/80 z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <XCircle className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Reject this update?", "මෙම යාවත්කාලීන කිරීම ප්‍රතික්ෂේප කරන්නද?")}
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
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
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
                  setReviewComment("");
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={!reviewComment.trim() || busyId === rejectingId}
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
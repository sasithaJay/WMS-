import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Loader2, XCircle, User, Calendar, Check } from "lucide-react";
import {
  getPendingItemUpdateRequests,
  approveItemUpdateRequest,
  rejectItemUpdateRequest,
} from "../../../services/itemUpdateRequestService";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";
import type { ItemUpdateRequest, ItemUpdateRequestValues } from "../../types/itemUpdateRequests";
import { useBadgeRefresh } from "../../context/BadgeRefreshContext";

type DisplayedUpdateField = Exclude<keyof ItemUpdateRequestValues, "barcode">;

const FIELD_LABELS: Record<DisplayedUpdateField, { en: string; si: string }> = {
  category_id: { en: "Category", si: "වර්ගය" },
  unit_id: { en: "Unit", si: "ඒකකය" },
  item_code: { en: "Item Code", si: "භාණ්ඩ කේතය" },
  name_en: { en: "Name", si: "නාමය" },
  description: { en: "Description", si: "විස්තරය" },
  reorder_level: { en: "Reorder Level", si: "නැවත ඇණවුම් මට්ටම" },
};

export function PendingItemUpdateRequestsQueue({ lang }: { lang: Lang }) {
  const { triggerBadgeRefresh } = useBadgeRefresh();
  const [requests, setRequests] = useState<ItemUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(() => new Set());

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  function markBusy(id: number, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

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
      markBusy(id, true);
      setError("");
      await approveItemUpdateRequest(id);
      setRequests((current) => current.filter((r) => r.id !== id));
      triggerBadgeRefresh();
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
      markBusy(id, false);
    }
  }

  async function handleReject(id: number) {
    if (!reviewComment.trim()) return;

    try {
      markBusy(id, true);
      setError("");
      await rejectItemUpdateRequest(id, reviewComment);
      setRequests((current) => current.filter((r) => r.id !== id));
      triggerBadgeRefresh();
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
      markBusy(id, false);
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

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-700">
          {requests.length} {t(lang, "request(s) are awaiting your approval", "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී")}
        </p>
      </div>

      <div className="space-y-3 md:hidden">
        {requests.map((r) => {
          const requesterName = r.requester?.name ?? r.requester?.username ?? `#${r.requested_by}`;
          const changedFields = (Object.keys(FIELD_LABELS) as DisplayedUpdateField[])
            .filter((field) => String(r.old_values[field] ?? "") !== String(r.new_values[field] ?? ""));
          const busy = busyIds.has(r.id);
          return (
            <article key={`mobile-update-${r.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="min-w-0"><p className="font-mono text-[10px] font-bold text-slate-400">{r.item?.item_code ?? "-"}</p><h3 className="text-sm font-bold text-slate-900">{r.item?.name_en ?? "-"}</h3></div>
                <span className="shrink-0 text-right text-[10px] text-slate-500">{t(lang, "Requested by", "ඉල්ලූයේ")}<strong className="block max-w-32 truncate text-xs text-slate-800">{requesterName}</strong></span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-600"><Calendar className="h-3.5 w-3.5 text-slate-400" />{new Date(r.created_at).toLocaleDateString()}</p>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <div className="mb-2 grid grid-cols-[minmax(64px,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1.5 border-b border-slate-200 pb-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500"><span>{t(lang, "Field", "ක්ෂේත්‍රය")}</span><span>{t(lang, "Current", "වත්මන්")}</span><span>{t(lang, "Requested", "ඉල්ලූ")}</span></div>
                <div className="space-y-1.5">{changedFields.length ? changedFields.map((field) => <div key={field} className="grid grid-cols-[minmax(64px,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-[10px]"><span className="truncate font-semibold text-slate-500">{t(lang, FIELD_LABELS[field].en, FIELD_LABELS[field].si)}</span><span className="truncate rounded bg-rose-50 px-1.5 py-1 font-mono text-rose-700" title={String(r.old_values[field] ?? "—")}>{String(r.old_values[field] ?? "—")}</span><span className="truncate rounded bg-emerald-50 px-1.5 py-1 font-mono font-semibold text-emerald-700" title={String(r.new_values[field] ?? "—")}>{String(r.new_values[field] ?? "—")}</span></div>) : <span className="text-xs text-slate-400">-</span>}</div>
              </div>
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed text-blue-900"><strong className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-blue-700">{t(lang, "Reason", "හේතුව")}</strong>{r.reason}</div>
              <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => { setRejectingId(r.id); setReviewComment(""); }} disabled={busy} className="h-9 rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-700 disabled:opacity-50">{t(lang, "Reject", "ප්‍රතික්ෂේප")}</button>
                <button type="button" onClick={() => handleApprove(r.id)} disabled={busy} className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t(lang, "Approve", "අනුමත")}</button>
              </div>
            </article>
          );
        })}
      </div>

      {/* SINGLE SHARED REQUEST TABLE */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white pl-2 md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[16%]" /><col className="w-[14%]" /><col className="w-[8%]" />
              <col className="w-[25%]" /><col className="w-[18%]" /><col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-600">
                <th className="px-2 py-3 text-center">{t(lang, "Item Details", "භාණ්ඩ විස්තර")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Requester", "ඉල්ලුම්කරු")}</th>
                <th className="whitespace-nowrap px-2 py-3 text-center">{t(lang, "Request Date", "ඉල්ලීම් දිනය")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Changes", "වෙනස්කම්")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Reason", "හේතුව")}</th>
                <th className="px-2 py-3 text-center">{t(lang, "Actions", "ක්‍රියා")}</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {requests.map((r) => {
                const requesterName = r.requester?.name ?? r.requester?.username ?? `#${r.requested_by}`;
                const changedFields = (Object.keys(FIELD_LABELS) as DisplayedUpdateField[])
                  .filter((field) => String(r.old_values[field] ?? "") !== String(r.new_values[field] ?? ""));
                return (
                  <tr key={r.id} className="border-b border-slate-200 transition-colors hover:bg-slate-50/70">
                    <td className="min-w-0 px-2 py-3 align-middle">
                      <span className="mb-0.5 block font-mono text-[10px] font-bold text-slate-400">{r.item?.item_code ?? "-"}</span>
                      <span className="block font-semibold text-slate-900">{r.item?.name_en ?? "-"}</span>
                    </td>
                    <td className="min-w-0 px-2 py-3 align-middle"><span className="flex items-center gap-1.5 font-medium text-slate-800"><User className="h-3.5 w-3.5 shrink-0 text-blue-600" /><span className="truncate">{requesterName}</span></span></td>
                    <td className="px-2 py-3 align-middle text-slate-600"><span className="flex items-center gap-1.5 whitespace-nowrap"><Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />{new Date(r.created_at).toLocaleDateString()}</span></td>
                    <td className="px-2 py-3 align-middle">
                      <div className="space-y-1.5">
                        {changedFields.length ? changedFields.map((field) => (
                          <div key={field} className="grid grid-cols-[minmax(64px,0.7fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-1.5 text-[10px]">
                            <span className="truncate font-semibold text-slate-500">{t(lang, FIELD_LABELS[field].en, FIELD_LABELS[field].si)}</span>
                            <span className="truncate rounded bg-rose-50 px-1.5 py-1 font-mono font-medium text-rose-700" title={String(r.old_values[field] ?? "—")}>{String(r.old_values[field] ?? "—")}</span>
                            <span className="truncate rounded bg-emerald-50 px-1.5 py-1 font-mono font-semibold text-emerald-700" title={String(r.new_values[field] ?? "—")}>{String(r.new_values[field] ?? "—")}</span>
                          </div>
                        )) : <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-middle text-[11px] leading-relaxed text-slate-600"><span className="line-clamp-3" title={r.reason}>{r.reason}</span></td>
                    <td className="px-2 py-3 text-center align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button type="button" onClick={() => { setRejectingId(r.id); setReviewComment(""); }} disabled={busyIds.has(r.id)} className="h-9 rounded-lg border border-rose-300 bg-white px-2.5 text-[10px] font-bold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50">{t(lang, "Reject", "ප්‍රතික්ෂේප")}</button>
                        <button type="button" onClick={() => handleApprove(r.id)} disabled={busyIds.has(r.id)} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">{busyIds.has(r.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}<span>{t(lang, "Approve", "අනුමත")}</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                disabled={!reviewComment.trim() || busyIds.has(rejectingId)}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyIds.has(rejectingId) ? (
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

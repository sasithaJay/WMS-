import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
  lang,
}: {
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  lang: Lang;
}) {
  const changed = String(oldValue ?? "") !== String(newValue ?? "");
  if (!changed) return null;

  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-red-500">{oldValue ?? "—"}</span>
      <span className="font-semibold text-green-600">{newValue ?? "—"}</span>
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
      setError(t(lang, "Unable to load pending item updates.", "අපේක්ෂිත භාණ්ඩ යාවත්කාලීන පූරණය කළ නොහැක."));
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
      await approveItemUpdateRequest(id);
      setRequests((current) => current.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to approve this update. Please try again.", "මෙම යාවත්කාලීන කිරීම අනුමත කළ නොහැක. නැවත උත්සාහ කරන්න."));
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
      setError(t(lang, "Unable to reject this update. Please try again.", "මෙම යාවත්කාලීන කිරීම ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."));
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
        icon={<CheckCircle2 className="w-9 h-9 text-green-400" />}
        title={t(lang, "No pending item updates", "අපේක්ෂිත භාණ්ඩ යාවත්කාලීන නොමැත")}
        subtitle={t(lang, "All item update requests have been reviewed.", "සියලු භාණ්ඩ යාවත්කාලීන ඉල්ලීම් සමාලෝචනය කර ඇත.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {requests.map((r) => (
            <div
            key={r.id}
            className="flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm"
            >
            {/* Content */}
            <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-gray-600">
                    {r.item?.item_code}
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                    {t(lang, "Pending Review", "සමාලෝචනය අපේක්ෂිතයි")}
                </span>
                </div>

                <div className="text-sm font-semibold text-gray-900">
                {r.item?.name_en}
                </div>

                <div className="mb-3 text-xs text-gray-400">
                {t(lang, "Requested by", "ඉල්ලූයේ")}:{" "}
                {r.requester?.name ??
                    r.requester?.username ??
                    `#${r.requested_by}`}
                </div>

                <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="mb-1 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <span>{t(lang, "Field", "ක්ෂේත්‍රය")}</span>
                    <span>{t(lang, "Current", "වත්මන්")}</span>
                    <span>{t(lang, "Requested", "ඉල්ලූ")}</span>
                </div>

                {(Object.keys(FIELD_LABELS) as (keyof ItemUpdateRequestValues)[]).map(
                    (field) => (
                    <DiffRow
                        key={field}
                        label={t(lang, FIELD_LABELS[field].en, FIELD_LABELS[field].si)}
                        oldValue={r.old_values[field]}
                        newValue={r.new_values[field]}
                        lang={lang}
                    />
                    ),
                )}
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs text-blue-700">
                <strong>{t(lang, "Reason", "හේතුව")}:</strong> {r.reason}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-5 border-t border-gray-100 pt-5">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                    onClick={() => {
                    setRejectingId(r.id);
                    setReviewComment("");
                    }}
                    disabled={busyId === r.id}
                    className="w-full rounded-xl border border-red-500 px-5 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-500 hover:text-white disabled:opacity-50 sm:w-auto"
                >
                    {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>

                <button
                    onClick={() => handleApprove(r.id)}
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
        ))}
      </div>

      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h4 className="text-sm font-semibold text-gray-900">
              {t(lang, "Reject this update?", "මෙම යාවත්කාලීන කිරීම ප්‍රතික්ෂේප කරන්නද?")}
            </h4>
            <label className="mt-3 block text-xs font-medium text-gray-600">
              {t(lang, "Comment", "අදහස")}
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#4295D9]"
              placeholder={t(lang, "Why is this being rejected?", "ප්‍රතික්ෂේප කිරීමට හේතුව?")}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setReviewComment("");
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t(lang, "Back", "ආපසු")}
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={!reviewComment.trim() || busyId === rejectingId}
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
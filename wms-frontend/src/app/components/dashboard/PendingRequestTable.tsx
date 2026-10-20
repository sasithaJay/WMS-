import { ChevronRight, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { ActionRequiredItem } from "../../types/dashboard";

const STAGE_LABELS: Record<
  ActionRequiredItem["stage"],
  { en: string; si: string; style: string }
> = {
  RECOMMENDATION: {
    en: "Recommend",
    si: "නිර්දේශ",
    style: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  APPROVAL: {
    en: "Approve",
    si: "අනුමත",
    style: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  },
  ISSUANCE: {
    en: "Issue",
    si: "නිකුත් කරන්න",
    style: "bg-blue-50 text-blue-700 border-blue-200/80",
  },
  ITEM_UPDATE: {
    en: "Review Update",
    si: "යාවත්කාලීන සමාලෝචනය",
    style: "bg-teal-50 text-teal-700 border-teal-200/80",
  },
  VAT_APPROVAL: {
    en: "Approve VAT",
    si: "VAT අනුමත කරන්න",
    style: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  USER_VERIFICATION: {
    en: "Verify User",
    si: "පරිශීලකයා සත්‍යාපනය කරන්න",
    style: "bg-violet-50 text-violet-700 border-violet-200/80",
  },
};

const STAGE_TO_NAV: Record<ActionRequiredItem["stage"], string> = {
  RECOMMENDATION: "recommend",
  APPROVAL: "approve",
  ISSUANCE: "issue",
  ITEM_UPDATE: "item-updates",
  VAT_APPROVAL: "vat-approve",
  USER_VERIFICATION: "users",
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "-";
}

export function PendingRequestTable({
  lang,
  items,
  onNavigate,
}: {
  lang: Lang;
  items: ActionRequiredItem[];
  onNavigate: (navId: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Action Required", "ක්‍රියාව අවශ්‍යයි")}
          </h3>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold">
              {items.length}
            </span>
          )}
        </div>
        <span className="text-xs font-medium text-slate-400">
          {items.length} {t(lang, "items", "අයිතම")}
        </span>
      </div>

      {/* List Body */}
      {items.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t(
              lang,
              "Nothing needs your attention right now.",
              "දැනට ඔබගේ අවධානය අවශ්‍ය කිසිවක් නොමැත.",
            )}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {items.map((p) => {
            const stage = STAGE_LABELS[p.stage];
            const initial = p.requester_name?.[0]?.toUpperCase() ?? "U";

            return (
              <div
                key={`${p.stage}-${p.id}`}
                onClick={() => onNavigate(STAGE_TO_NAV[p.stage])}
                className="group flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                {/* Requester Avatar */}
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 shadow-2xs group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                  {initial}
                </div>

                {/* Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate tracking-tight">
                    {p.item_summary || p.request_context}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-slate-600">
                      {p.request_number}
                    </span>
                    <span>·</span>
                    <span>{p.requester_name}</span>
                    <span>·</span>
                    <span>{formatDate(p.submitted_at)}</span>
                  </div>
                </div>

                {/* Stage Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${stage.style}`}
                >
                  {t(lang, stage.en, stage.si)}
                </span>

                {/* Navigate Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(STAGE_TO_NAV[p.stage]);
                  }}
                  className="w-7 h-7 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                  title={t(lang, "Go to queue", "පෝලිමට යන්න")}
                >
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { ChevronRight, ArrowRight } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { ActionRequiredItem } from "../../types/dashboard";

const STAGE_LABELS: Record<ActionRequiredItem["stage"], { en: string; si: string; style: string }> = {
  RECOMMENDATION: { en: "Recommend", si: "නිර්දේශ", style: "bg-amber-100 text-amber-700" },
  APPROVAL: { en: "Approve", si: "අනුමත", style: "bg-purple-100 text-purple-700" },
  ISSUANCE: { en: "Issue", si: "නිකුත් කරන්න", style: "bg-blue-100 text-blue-700" },
};

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "-";
}

export function PendingRequestTable({ lang, items }: { lang: Lang; items: ActionRequiredItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Action Required", "ක්‍රියාව අවශ්‍යයි")}</h3>
        <span className="text-xs text-gray-400">{items.length} {t(lang, "items", "අයිතම")}</span>
      </div>

      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400">
          {t(lang, "Nothing needs your attention right now.", "දැනට ඔබගේ අවධානය අවශ්‍ය කිසිවක් නොමැත.")}
        </p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((p) => {
            const stage = STAGE_LABELS[p.stage];
            return (
              <div key={`${p.stage}-${p.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                  {p.requester_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{p.item_summary || p.request_context}</div>
                  <div className="text-xs text-gray-400">{p.request_number} · {p.requester_name} · {formatDate(p.submitted_at)}</div>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${stage.style}`}>
                  {t(lang, stage.en, stage.si)}
                </span>
                <ChevronRight className="w-4 h-4 text-[#4295D9] flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {items.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-100">
          <span className="text-xs text-[#4295D9] font-medium flex items-center gap-1">
            {t(lang, "Go to the relevant queue tab to see all pending items", "සියලු අපේක්ෂිත අයිතම බැලීමට අදාළ පෝලිම් ටැබයට යන්න")} <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
}
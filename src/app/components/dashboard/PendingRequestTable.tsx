import { ChevronRight } from "lucide-react";
import { t } from "../../constants/translations";
import { ArrowRight } from "lucide-react";
import type { Lang } from "../../types";

const PENDING_APPROVALS = [
  { id: "REQ-2024-045", by: "P.K. Jayasena", role: "Dev. Officer", item: "Printer Toner", date: "2024-06-12", stage: "recommendation" },
  { id: "REQ-2024-046", by: "Matara DS Office", role: "DS Office", item: "A4 Paper × 10 Reams", date: "2024-06-11", stage: "recommendation" },
  { id: "REQ-2024-047", by: "Karandeniya Home", role: "Institution", item: "Bed Sheets × 20", date: "2024-06-10", stage: "approval" },
  { id: "REQ-2024-048", by: "D.M. Perera", role: "Social Service Officer", item: "File Covers × 50", date: "2024-06-09", stage: "approval" },
];

export function PendingRequestTable({ lang }: { lang: Lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Action Required", "ක්‍රියාව අවශ්‍යයි")}</h3>
        <span className="text-xs text-gray-400">{PENDING_APPROVALS.length} {t(lang, "items", "අයිතම")}</span>
      </div>
      <div className="divide-y divide-gray-50">
        {PENDING_APPROVALS.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
              {p.by[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{p.item}</div>
              <div className="text-xs text-gray-400">{p.id} · {p.by} · {p.date}</div>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
              p.stage === "recommendation" ? "bg-amber-100 text-amber-700" : "bg-purple-100 text-purple-700"
            }`}>
              {p.stage === "recommendation"
                ? t(lang, "Recommend", "නිර්දේශ")
                : t(lang, "Approve", "අනුමත")}
            </span>
            <button className="text-[#4295D9] hover:text-[#3280C4] transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-gray-100">
        <button className="text-xs text-[#4295D9] font-medium hover:underline flex items-center gap-1">
          {t(lang, "View all pending items", "සියලු අපේක්ෂිත ලබා ගන්න")} <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

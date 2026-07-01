import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { RECOMMEND_QUEUE } from "../../constants/mockData";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";

function ItemChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#EBF4FD] text-[#4295D9] border-blue-100">
      {label}
    </span>
  );
}

export function RecommendationQueue({ lang }: { lang: Lang }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = RECOMMEND_QUEUE.filter((r) => !dismissed.includes(r.ref));

  if (visible.length === 0) {
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
      <p className="text-sm text-gray-500">
        {visible.length} {t(lang, "request(s) awaiting your recommendation", "ඉල්ලීමක් ඔබගේ නිර්දේශය බලා සිටී")}
      </p>
      {visible.map((r) => (
        <div key={r.ref} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="font-mono text-xs font-bold text-gray-600">{r.ref}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                  {t(lang, "Pending Recommendation", "නිර්දේශ අපේක්ෂිත")}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${r.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                  {r.division}
                </span>
              </div>
              <div className="text-sm font-semibold text-gray-900">{r.requester}</div>
              <div className="text-xs text-gray-400 mb-3">{r.section} · {r.date}</div>
              <div className="flex flex-wrap gap-1.5">
                {r.items.map((item) => <ItemChip key={item} label={item} />)}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setDismissed((d) => [...d, r.ref])}
              className="flex-1 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all"
            >
              {t(lang, "Reject", "ප්‍රතික්ෂේප")}
            </button>
            <button
              onClick={() => setDismissed((d) => [...d, r.ref])}
              className="flex-1 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
            >
              {t(lang, "Recommend", "නිර්දේශ")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

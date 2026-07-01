import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { RECENT_MOVEMENTS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function StockMovementTable({ lang }: { lang: Lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Stock Movement History", "තොග චලන ඉතිහාසය")}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {RECENT_MOVEMENTS.map((m, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type === "in" ? "bg-green-50" : "bg-red-50"}`}>
              {m.type === "in"
                ? <ArrowDownToLine className="w-4 h-4 text-green-600" />
                : <ArrowUpFromLine className="w-4 h-4 text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900">{m.item}</div>
              <div className="text-xs text-gray-400">{m.by} · {m.date}</div>
            </div>
            <span className={`text-sm font-bold flex-shrink-0 ${m.type === "in" ? "text-green-600" : "text-red-500"}`}>{m.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

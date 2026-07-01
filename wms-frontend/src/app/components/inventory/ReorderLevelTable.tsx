import { AlertTriangle, CheckCircle } from "lucide-react";
import { LOW_STOCK } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function ReorderLevelTable({ lang }: { lang: Lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Inventory — Reorder Alerts", "තොග — නැවත ඇණවුම් දැනුම්දීම")}</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {LOW_STOCK.map((item) => {
          const pct = Math.round((item.qty / item.reorder) * 100);
          return (
            <div key={item.code} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.division}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{item.code}</div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]">
                  <div className={`h-full rounded-full transition-all ${item.critical ? "bg-red-500" : "bg-green-400"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${item.critical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {item.qty} / {item.reorder}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

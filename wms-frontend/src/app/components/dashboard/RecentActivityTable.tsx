import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { t } from "../../constants/translations";
import { isIncomingMovement, type StockMovement } from "../../types/stockMovements";
import type { Lang } from "../../types";

export function RecentActivityTable({ lang, movements }: { lang: Lang; movements: StockMovement[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Recent Movements", "මෑත චලනය")}</h3>
      </div>

      {movements.length === 0 ? (
        <p className="px-5 py-6 text-sm text-gray-400">{t(lang, "No recent movements.", "මෑත චලන නොමැත.")}</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {movements.map((m) => {
            const incoming = isIncomingMovement(m.movement_type);
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${incoming ? "bg-green-50" : "bg-red-50"}`}>
                  {incoming ? <ArrowDownToLine className="w-3.5 h-3.5 text-green-600" /> : <ArrowUpFromLine className="w-3.5 h-3.5 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{m.item.item_code} - {m.item.name_en}</div>
                  <div className="text-[10px] text-gray-400">{m.performer.name} · {new Date(m.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-[10px] font-bold flex-shrink-0 ${incoming ? "text-green-600" : "text-red-500"}`}>
                  {incoming ? "+" : "-"}{Math.abs(Number(m.quantity))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
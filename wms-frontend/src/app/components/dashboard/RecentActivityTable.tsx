import { ArrowDownToLine, ArrowUpFromLine, Activity } from "lucide-react";
import { t } from "../../constants/translations";
import {
  isIncomingMovement,
  type StockMovement,
} from "../../types/stockMovements";
import type { Lang } from "../../types";

export function RecentActivityTable({
  lang,
  movements,
}: {
  lang: Lang;
  movements: StockMovement[];
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
          {t(lang, "Recent Movements", "මෑත චලනය")}
        </h3>
        {movements.length > 0 && (
          <span className="text-xs font-semibold text-slate-400">
            {movements.length} {t(lang, "records", "වාර්තා")}
          </span>
        )}
      </div>

      {/* Activity List Body */}
      {movements.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t(lang, "No recent movements.", "මෑත චලන නොමැත.")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {movements.map((m) => {
            const incoming = isIncomingMovement(m.movement_type);

            return (
              <div
                key={m.id}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
              >
                {/* Movement Direction Icon */}
                <div
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                    incoming
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                  }`}
                >
                  {incoming ? (
                    <ArrowDownToLine className="w-4 h-4" />
                  ) : (
                    <ArrowUpFromLine className="w-4 h-4" />
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate tracking-tight">
                    <span className="font-mono text-slate-500 font-semibold mr-1">
                      {m.item.item_code}
                    </span>
                    — {m.item.name_en}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                    {m.performer.name} ·{" "}
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Quantity Badge */}
                <span
                  className={`text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg border shrink-0 ${
                    incoming
                      ? "bg-emerald-50/60 text-emerald-700 border-emerald-200/60"
                      : "bg-rose-50/60 text-rose-700 border-rose-200/60"
                  }`}
                >
                  {incoming ? "+" : "-"}
                  {Math.abs(Number(m.quantity))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
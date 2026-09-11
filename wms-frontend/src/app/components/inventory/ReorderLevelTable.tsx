import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, AlertCircle, Inbox, BellIcon } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { DivisionDashboardSummary } from "../../types/dashboard";
import { getDashboardOverview } from "../../../services/dashboardService";

export function ReorderLevelTable({ lang }: { lang: Lang }) {
  const [divisions, setDivisions] = useState<DivisionDashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");
      const response = await getDashboardOverview();
      setDivisions(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load dashboard overview.",
          "උපකරණ පුවරු දළ විශ්ලේෂණය පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 flex flex-col items-center justify-center text-slate-400 gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (divisions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
          <Inbox className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {t(lang, "No data available.", "දත්ත නොමැත.")}
        </p>
      </div>
    );
  }

  const isMultiDivision = divisions.length > 1;

  const combinedLowStock = divisions.flatMap((d) =>
    d.low_stock_items.map((item) => ({
      ...item,
      divisionName: t(lang, d.division_name_en, d.division_name_si),
    }))
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
          <BellIcon className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Reorder Level Alerts", "නැවත ඇණවුම් මට්ටම් දැනුම්")}
          </h3>
          <p className="text-[11px] font-medium text-slate-400">
            {t(lang, "Items reaching or below minimum stock threshold", "නැවත ඇණවුම් මට්ටමට ළඟා වූ හෝ ඊට අඩු තොග භාණ්ඩ")}
          </p>
        </div>
      </div>

      {/* Empty Items List */}
      {combinedLowStock.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t(lang, "No items below reorder level.", "නැවත ඇණවුම් මට්ටමට වඩා පහළ භාණ්ඩ නොමැත.")}
          </p>
        </div>
      ) : (
        /* Alerts List */
        <div className="divide-y divide-slate-100 text-xs">
          {combinedLowStock.map((item) => {
            const critical = Number(item.quantity_on_hand) === 0;

            return (
              <div
                key={`${item.id}-${item.divisionName}`}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
              >
                {/* Warning Icon Badge */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    critical
                      ? "bg-rose-50 border-rose-100 text-rose-600"
                      : "bg-amber-50 border-amber-100 text-amber-600"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">
                      {item.name_en}
                    </span>

                    <span className="font-mono text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                      {item.item_code}
                    </span>

                    {isMultiDivision && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                        {item.divisionName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock vs Reorder Level Badge */}
                <div
                  className={`px-3 py-1 rounded-full font-mono text-[11px] font-extrabold shrink-0 border ${
                    critical
                      ? "bg-rose-50 text-rose-700 border-rose-200/80"
                      : "bg-amber-50 text-amber-700 border-amber-200/80"
                  }`}
                >
                  {item.quantity_on_hand} / {item.reorder_level}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
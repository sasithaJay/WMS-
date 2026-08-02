import { AlertTriangle, CheckCircle } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { DivisionDashboardSummary } from "../../types/dashboard";
import { useEffect, useState } from "react";
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
        setError(t(lang, "Unable to load dashboard overview.", "උපකරණ පුවරු දළ විශ්ලේෂණය පූරණය කළ නොහැක."));
      } finally {
        setLoading(false);
      }
    }

    if (loading) return <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>;
  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (divisions.length === 0) return <p className="text-sm text-gray-400">{t(lang, "No data available.", "දත්ත නොමැත.")}</p>;
  

  const isMultiDivision = divisions.length > 1;

  const combinedLowStock = divisions.flatMap((d) =>
      d.low_stock_items.map((item) => ({ ...item, divisionName: t(lang, d.division_name_en, d.division_name_si) })),
    );

  return (
    <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            {t(lang, "Reorder Level Alerts", "නැවත ඇණවුම් මට්ටම් දැනුම්")}
          </h3>
        </div>
        {combinedLowStock.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">
            {t(lang, "No items below reorder level.", "නැවත ඇණවුම් මට්ටමට වඩා පහළ භාණ්ඩ නොමැත.")}
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {combinedLowStock.map((item) => {
              const critical = item.quantity_on_hand == 0;
              return (
                <div key={`${item.id}-${item.divisionName}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${critical ? "text-red-500" : "text-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">{item.name_en}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.item_code}</span>
                      {isMultiDivision && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-100 text-blue-700">
                          {item.divisionName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.quantity_on_hand} / {item.reorder_level}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}

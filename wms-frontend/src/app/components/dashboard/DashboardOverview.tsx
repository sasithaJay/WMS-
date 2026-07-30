import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Clock, CheckCircle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { DashboardChart } from "./DashboardChart";
import { StockStatusPieChart } from "./StockStatusPieChart";
import { t } from "../../constants/translations";
import { getDashboardOverview } from "../../../services/dashboardService";
import { isIncomingMovement } from "../../types/stockMovements";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";
import { MultiDivisionStockPie } from "./MultiDivisionStockPie";
import { MultiDivisionMonthlyChart } from "./MultiDivisionMonthlyChart";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DashboardOverview({ lang }: { lang: Lang }) {
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

  const totalItems = divisions.reduce((sum, d) => sum + d.total_items, 0);
  const lowStockCount = divisions.reduce((sum, d) => sum + d.low_stock_count, 0);
  const pendingTotal = divisions.reduce(
    (sum, d) => sum + d.pending_recommendation_count + d.pending_approval_count + d.pending_issuance_count,
    0,
  );
  const issuedThisMonth = divisions.reduce((sum, d) => sum + d.issued_this_month_count, 0);

  const combinedLowStock = divisions.flatMap((d) =>
    d.low_stock_items.map((item) => ({ ...item, divisionName: t(lang, d.division_name_en, d.division_name_si) })),
  );

  const combinedMovements = divisions
    .flatMap((d) => d.recent_movements)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const combinedStockStatus = divisions.reduce(
    (acc, d) => ({
      out: acc.out + d.stock_status.out,
      low: acc.low + d.stock_status.low,
      normal: acc.normal + d.stock_status.normal,
    }),
    { out: 0, low: 0, normal: 0 },
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t(lang, "Total Items", "මුළු අයිතම")}
          value={String(totalItems)}
          sub={isMultiDivision ? t(lang, "Both stores combined", "ගබඩා දෙකම") : undefined}
          color="blue"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Reorder Alerts", "නැවත ඇණවුම් දැනුම්")}
          value={String(lowStockCount)}
          sub={t(lang, "At or below threshold", "සීමාවේ හෝ ඊට පහළ")}
          color="red"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Pending in Pipeline", "නල මාර්ගයේ")}
          value={String(pendingTotal)}
          sub={t(lang, "Awaiting action", "ක්‍රියාව අපේක්ෂිත")}
          color="amber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Issued This Month", "මාසේ ගිලිහුණු")}
          value={String(issuedThisMonth)}
          sub={t(lang, "Fulfilled requests", "සම්පූර්ණ ඉල්ලීම්")}
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Charts */}
      {isMultiDivision ? (
        <div className="space-y-4">
          <MultiDivisionMonthlyChart lang={lang} divisions={divisions} />
          <div className="grid grid-cols-2 gap-4">
            <StockStatusPieChart lang={lang} breakdown={divisions[0].stock_status} title={t(lang, divisions[0].division_name_en, divisions[0].division_name_si)} />
            <StockStatusPieChart lang={lang} breakdown={divisions[1].stock_status} title={t(lang, divisions[1].division_name_en, divisions[1].division_name_si)} />
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardChart lang={lang} data={divisions[0].monthly_chart} />
          <StockStatusPieChart lang={lang} breakdown={divisions[0].stock_status} />
        </div>
      )}

      {/* Reorder alerts */}
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

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { title: t(lang, "Awaiting Recommendation", "නිර්දේශ අපේක්ෂිත"), count: divisions.reduce((s, d) => s + d.pending_recommendation_count, 0), color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { title: t(lang, "Awaiting Approval", "අනුමත අපේක්ෂිත"), count: divisions.reduce((s, d) => s + d.pending_approval_count, 0), color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
          { title: t(lang, "Awaiting Issuance", "ගිලිහීම අපේක්ෂිත"), count: divisions.reduce((s, d) => s + d.pending_issuance_count, 0), color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
        ].map((p) => (
          <div key={p.title} className={`rounded-xl border p-5 ${p.bg}`}>
            <div className="text-4xl font-bold text-gray-900 mb-1">{p.count}</div>
            <div className={`text-sm font-semibold ${p.color}`}>{p.title}</div>
            <div className="mt-4 text-xs text-gray-500">{t(lang, "Request Pipeline", "ඉල්ලීම් නල මාර්ගය")}</div>
          </div>
        ))}
      </div>

      {/* Recent movements */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Recent Stock Movements", "මෑත තොග චලනය")}</h3>
        </div>
        {combinedMovements.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400">{t(lang, "No recent movements.", "මෑත චලන නොමැත.")}</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {combinedMovements.map((m) => {
              const incoming = isIncomingMovement(m.movement_type);
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${incoming ? "bg-green-50" : "bg-red-50"}`}>
                    {incoming ? <ArrowDownToLine className="w-4 h-4 text-green-600" /> : <ArrowUpFromLine className="w-4 h-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{m.item.item_code} - {m.item.name_en}</div>
                    <div className="text-xs text-gray-400 truncate">{m.performer.name} · {formatDateTime(m.created_at)}</div>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${incoming ? "text-green-600" : "text-red-500"}`}>
                    {incoming ? "+" : "-"}{Math.abs(Number(m.quantity))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
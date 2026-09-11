import { useEffect, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  GitPullRequest,
} from "lucide-react";
import { StatCard } from "../common/StatCard";
import { DashboardChart } from "./DashboardChart";
import { StockStatusPieChart } from "./StockStatusPieChart";
import { t } from "../../constants/translations";
import { getDashboardOverview } from "../../../services/dashboardService";
import { isIncomingMovement } from "../../types/stockMovements";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";
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
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading overview…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (divisions.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-medium">
        {t(lang, "No data available.", "දත්ත නොමැත.")}
      </div>
    );
  }

  const isMultiDivision = divisions.length > 1;

  const totalItems = divisions.reduce((sum, d) => sum + d.total_items, 0);
  const lowStockCount = divisions.reduce((sum, d) => sum + d.low_stock_count, 0);
  const pendingTotal = divisions.reduce(
    (sum, d) =>
      sum +
      d.pending_recommendation_count +
      d.pending_approval_count +
      d.pending_issuance_count,
    0
  );
  const issuedThisMonth = divisions.reduce(
    (sum, d) => sum + d.issued_this_month_count,
    0
  );

  const combinedLowStock = divisions.flatMap((d) =>
    d.low_stock_items.map((item) => ({
      ...item,
      divisionName: t(lang, d.division_name_en, d.division_name_si),
    }))
  );

  const combinedMovements = divisions
    .flatMap((d) => d.recent_movements)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t(lang, "Total Items", "මුළු අයිතම")}
          value={String(totalItems)}
          sub={
            isMultiDivision
              ? t(lang, "Both stores combined", "ගබඩා දෙකම")
              : undefined
          }
          color="blue"
          bgColor="bgBlue"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Reorder Alerts", "නැවත ඇණවුම් දැනුම්")}
          value={String(lowStockCount)}
          sub={t(lang, "At or below threshold", "සීමාවේ හෝ ඊට පහළ")}
          color="red"
          bgColor="bgRed"
          icon={<AlertTriangle className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Pending in Pipeline", "නල මාර්ගයේ")}
          value={String(pendingTotal)}
          sub={t(lang, "Awaiting action", "ක්‍රියාව අපේක්ෂිත")}
          color="amber"
          bgColor="bgAmber"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Issued This Month", "මාසේ ගිලිහුණු")}
          value={String(issuedThisMonth)}
          sub={t(lang, "Fulfilled requests", "සම්පූර්ණ ඉල්ලීම්")}
          color="green"
          bgColor="bgGreen"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Charts Section */}
      {isMultiDivision ? (
        <div className="space-y-4">
          <MultiDivisionMonthlyChart lang={lang} divisions={divisions} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StockStatusPieChart
              lang={lang}
              breakdown={divisions[0].stock_status}
              title={t(
                lang,
                divisions[0].division_name_en,
                divisions[0].division_name_si
              )}
            />
            <StockStatusPieChart
              lang={lang}
              breakdown={divisions[1].stock_status}
              title={t(
                lang,
                divisions[1].division_name_en,
                divisions[1].division_name_si
              )}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DashboardChart lang={lang} data={divisions[0].monthly_chart} />
          <StockStatusPieChart
            lang={lang}
            breakdown={divisions[0].stock_status}
          />
        </div>
      )}

      {/* Reorder Alerts Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              {t(lang, "Reorder Level Alerts", "නැවත ඇණවුම් මට්ටම් දැනුම්")}
            </h3>
            {combinedLowStock.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold">
                {combinedLowStock.length}
              </span>
            )}
          </div>
        </div>

        {combinedLowStock.length === 0 ? (
          <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-1.5">
            <p className="text-xs font-medium text-slate-400">
              {t(
                lang,
                "No items below reorder level.",
                "නැවත ඇණවුම් මට්ටමට වඩා පහළ භාණ්ඩ නොමැත."
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {combinedLowStock.map((item) => {
              const critical = item.quantity_on_hand === 0;

              return (
                <div
                  key={`${item.id}-${item.divisionName}`}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                      critical
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : "bg-amber-50 text-amber-600 border-amber-100"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.name_en}
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {item.item_code}
                      </span>
                      {isMultiDivision && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {item.divisionName}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full border shrink-0 ${
                      critical
                        ? "bg-rose-50 text-rose-700 border-rose-200/80"
                        : "bg-amber-50 text-amber-700 border-amber-200/80"
                    }`}
                  >
                    {item.quantity_on_hand} / {item.reorder_level}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Pipeline Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          {
            title: t(lang, "Awaiting Recommendation", "නිර්දේශ අපේක්ෂිත"),
            count: divisions.reduce(
              (s, d) => s + d.pending_recommendation_count,
              0
            ),
            color: "text-amber-700",
            bg: "bg-amber-50/60 border-amber-200/80",
            badgeBg: "bg-amber-100/80 text-amber-800",
          },
          {
            title: t(lang, "Awaiting Approval", "අනුමත අපේක්ෂිත"),
            count: divisions.reduce((s, d) => s + d.pending_approval_count, 0),
            color: "text-indigo-700",
            bg: "bg-indigo-50/60 border-indigo-200/80",
            badgeBg: "bg-indigo-100/80 text-indigo-800",
          },
          {
            title: t(lang, "Awaiting Issuance", "ගිලිහීම අපේක්ෂිත"),
            count: divisions.reduce((s, d) => s + d.pending_issuance_count, 0),
            color: "text-blue-700",
            bg: "bg-blue-50/60 border-blue-200/80",
            badgeBg: "bg-blue-100/80 text-blue-800",
          },
        ].map((p) => (
          <div
            key={p.title}
            className={`rounded-2xl border p-5 flex flex-col justify-between shadow-xs ${p.bg}`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${p.badgeBg}`}
                >
                  {t(lang, "Pipeline Stage", "නල මාර්ග අදියර")}
                </span>
                <GitPullRequest className={`w-4 h-4 opacity-40 ${p.color}`} />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                {p.count}
              </div>
              <div className={`text-xs font-bold ${p.color}`}>{p.title}</div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/40 text-[11px] font-medium text-slate-500">
              {t(lang, "Request Pipeline", "ඉල්ලීම් නල මාර්ගය")}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Movements Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Recent Stock Movements", "මෑත තොග චලනය")}
          </h3>
          {combinedMovements.length > 0 && (
            <span className="text-xs font-semibold text-slate-400">
              {combinedMovements.length} {t(lang, "records", "වාර්තා")}
            </span>
          )}
        </div>

        {combinedMovements.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs font-medium text-slate-400">
            {t(lang, "No recent movements.", "මෑත චලන නොමැත.")}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {combinedMovements.map((m) => {
              const incoming = isIncomingMovement(m.movement_type);

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                >
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

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate tracking-tight">
                      <span className="font-mono text-slate-500 font-semibold mr-1">
                        {m.item.item_code}
                      </span>
                      — {m.item.name_en}
                    </div>
                    <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                      {m.performer.name} · {formatDateTime(m.created_at)}
                    </div>
                  </div>

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
    </div>
  );
}
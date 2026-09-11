import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";

const STATUS_COLORS = { normal: "#10B981", low: "#F59E0B", out: "#F43F5E" };

function toSlices(
  breakdown: { normal: number; low: number; out: number },
  lang: Lang
) {
  return [
    { key: "normal", name: t(lang, "Normal", "සාමාන්‍ය"), value: breakdown.normal },
    { key: "low", name: t(lang, "Low Stock", "අඩු තොග"), value: breakdown.low },
    { key: "out", name: t(lang, "Out of Stock", "තොග නොමැත"), value: breakdown.out },
  ].filter((s) => s.value > 0);
}

export function MultiDivisionStockPie({
  lang,
  divisions,
}: {
  lang: Lang;
  divisions: DivisionDashboardSummary[];
}) {
  const [divA, divB] = divisions;

  if (!divA || !divB) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center justify-center h-[280px] shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
          <PieChartIcon className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {t(lang, "Insufficient store data.", "ප්‍රමාණවත් ගබඩා දත්ත නොමැත.")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div>
        <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-0.5">
          {t(lang, "Stock Status — Both Stores", "තොග තත්ත්වය — ගබඩා දෙකම")}
        </h3>
        <p className="text-[11px] font-medium text-slate-400">
          <span className="font-semibold text-slate-600">
            {t(lang, "Inner ring", "අභ්‍යන්තර වළල්ල")}:
          </span>{" "}
          {t(lang, divA.division_name_en, divA.division_name_si)} ·{" "}
          <span className="font-semibold text-slate-600">
            {t(lang, "Outer ring", "බාහිර වළල්ල")}:
          </span>{" "}
          {t(lang, divB.division_name_en, divB.division_name_si)}
        </p>
      </div>

      {/* Chart Canvas */}
      <div className="h-[200px] w-full my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Inner Ring (Division A) */}
            <Pie
              data={toSlices(divA.stock_status, lang)}
              dataKey="value"
              nameKey="name"
              innerRadius={35}
              outerRadius={58}
              paddingAngle={3}
              cornerRadius={4}
            >
              {toSlices(divA.stock_status, lang).map((s) => (
                <Cell
                  key={`divA-${s.key}`}
                  fill={STATUS_COLORS[s.key as keyof typeof STATUS_COLORS]}
                  stroke="transparent"
                />
              ))}
            </Pie>

            {/* Outer Ring (Division B) */}
            <Pie
              data={toSlices(divB.stock_status, lang)}
              dataKey="value"
              nameKey="name"
              innerRadius={68}
              outerRadius={90}
              paddingAngle={3}
              cornerRadius={4}
            >
              {toSlices(divB.stock_status, lang).map((s) => (
                <Cell
                  key={`divB-${s.key}`}
                  fill={STATUS_COLORS[s.key as keyof typeof STATUS_COLORS]}
                  fillOpacity={0.75}
                  stroke="transparent"
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                borderRadius: "12px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                fontSize: "12px",
                fontWeight: "600",
                color: "#0F172A",
                padding: "8px 12px",
              }}
              itemStyle={{ color: "#0F172A" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend Footer */}
      <div className="flex justify-center items-center gap-5 pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: STATUS_COLORS.normal }}
          />
          {t(lang, "Normal", "සාමාන්‍ය")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: STATUS_COLORS.low }}
          />
          {t(lang, "Low", "අඩු")}
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: STATUS_COLORS.out }}
          />
          {t(lang, "Out", "නොමැත")}
        </span>
      </div>
    </div>
  );
}
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";

interface MultiDivisionMonthlyChartProps {
  lang: Lang;
  divisions: DivisionDashboardSummary[];
}

const DIVISION_COLORS = [
  { received: "#2563EB", issued: "#93C5FD" }, // Division A: Blue 600 & Blue 300
  { received: "#10B981", issued: "#6EE7B7" }, // Division B: Emerald 500 & Emerald 300
];

export function MultiDivisionMonthlyChart({
  lang,
  divisions,
}: MultiDivisionMonthlyChartProps) {
  const monthCount = divisions[0]?.monthly_chart.length ?? 0;
  const merged = Array.from({ length: monthCount }, (_, i) => {
    const row: Record<string, string | number> = {
      month: divisions[0].monthly_chart[i].month,
    };
    divisions.forEach((d) => {
      row[`${d.division_id}_received`] = d.monthly_chart[i]?.received ?? 0;
      row[`${d.division_id}_issued`] = d.monthly_chart[i]?.issued ?? 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-4">
        {t(lang, "Stock Movement — Both Stores", "තොග චලනය — ගබඩා දෙකම")}
      </h3>

      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={merged} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F1F5F9"
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#64748B", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
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
              cursor={{ fill: "#F8FAFC" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748B",
                paddingTop: "12px",
              }}
              iconType="circle"
              iconSize={8}
            />
            {divisions.map((d, i) => (
              <React.Fragment key={d.division_id}>
                <Bar
                  dataKey={`${d.division_id}_received`}
                  name={`${t(lang, d.division_name_en, d.division_name_si)} — ${t(
                    lang,
                    "Received",
                    "ලැබුණු"
                  )}`}
                  radius={[5, 5, 0, 0]}
                  fill={
                    DIVISION_COLORS[i % DIVISION_COLORS.length].received
                  }
                />
                <Bar
                  dataKey={`${d.division_id}_issued`}
                  name={`${t(lang, d.division_name_en, d.division_name_si)} — ${t(
                    lang,
                    "Issued",
                    "ගිලිහුණු"
                  )}`}
                  radius={[5, 5, 0, 0]}
                  fill={DIVISION_COLORS[i % DIVISION_COLORS.length].issued}
                />
              </React.Fragment>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
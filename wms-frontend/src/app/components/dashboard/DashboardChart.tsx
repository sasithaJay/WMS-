import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { MonthlyChartPoint } from "../../types/dashboard";

interface DashboardChartProps {
  lang: Lang;
  data: MonthlyChartPoint[];
  title?: string;
}

export function DashboardChart({ lang, data, title }: DashboardChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-4">
        {title ??
          t(
            lang,
            "Stock Movement — Last 6 Months",
            "තොග චලනය — පසුගිය මාස 6"
          )}
      </h3>

      <div className="h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6}>
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
                paddingTop: "8px",
              }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="received"
              name={t(lang, "Received", "ලැබුණු")}
              radius={[6, 6, 0, 0]}
              fill="#2563EB"
            />
            <Bar
              dataKey="issued"
              name={t(lang, "Issued", "ගිලිහුණු")}
              radius={[6, 6, 0, 0]}
              fill="#10B981"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
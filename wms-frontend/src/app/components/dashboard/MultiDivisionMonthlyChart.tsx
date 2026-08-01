

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";

interface MultiDivisionMonthlyChartProps {
  lang: Lang;
  divisions: DivisionDashboardSummary[];
}

const DIVISION_COLORS = [
  { received: "#4295D9", issued: "#93C5FD" }, // division A: blue tones
  { received: "#10B981", issued: "#6EE7B7" }, // division B: green tones
];

export function MultiDivisionMonthlyChart({ lang, divisions }: MultiDivisionMonthlyChartProps) {
  // Merge each division's 6-month series into one array keyed by month,
  // since both divisions were queried over the same rolling window.
  const monthCount = divisions[0]?.monthly_chart.length ?? 0;
  const merged = Array.from({ length: monthCount }, (_, i) => {
    const row: Record<string, string | number> = { month: divisions[0].monthly_chart[i].month };
    divisions.forEach((d) => {
      row[`${d.division_id}_received`] = d.monthly_chart[i]?.received ?? 0;
      row[`${d.division_id}_issued`] = d.monthly_chart[i]?.issued ?? 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">
        {t(lang, "Stock Movement — Both Stores", "තොග චලනය — ගබඩා දෙකම")}
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={merged} barGap={4}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} cursor={{ fill: "#F1F5F9" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {divisions.map((d, i) => (
            <>
              <Bar
                key={`${d.division_id}-received`}
                dataKey={`${d.division_id}_received`}
                name={`${t(lang, d.division_name_en, d.division_name_si)} — ${t(lang, "Received", "ලැබුණු")}`}
                radius={[4, 4, 0, 0]}
                fill={DIVISION_COLORS[i % DIVISION_COLORS.length].received}
              />
              <Bar
                key={`${d.division_id}-issued`}
                dataKey={`${d.division_id}_issued`}
                name={`${t(lang, d.division_name_en, d.division_name_si)} — ${t(lang, "Issued", "ගිලිහුණු")}`}
                radius={[4, 4, 0, 0]}
                fill={DIVISION_COLORS[i % DIVISION_COLORS.length].issued}
              />
            </>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
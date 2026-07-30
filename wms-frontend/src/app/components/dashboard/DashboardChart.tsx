import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">
        {title ?? t(lang, "Stock Movement — Last 6 Months", "තොග චලනය — පසුගිය මාස 6")}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barGap={4}>
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }}
            cursor={{ fill: "#F1F5F9" }}
          />
          <Bar dataKey="received" name={t(lang, "Received", "ලැබුණු")} radius={[4, 4, 0, 0]} fill="#4295D9" />
          <Bar dataKey="issued" name={t(lang, "Issued", "ගිලිහුණු")} radius={[4, 4, 0, 0]} fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
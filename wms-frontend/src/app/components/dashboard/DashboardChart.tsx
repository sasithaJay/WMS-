import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { STOCK_CHART } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function DashboardChart({ lang }: { lang: Lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">
        {t(lang, "Stock Movement — 2024", "තොග චලනය — 2024")}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={STOCK_CHART} barGap={4}>
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

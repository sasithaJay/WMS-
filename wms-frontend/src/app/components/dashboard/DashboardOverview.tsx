import { TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import { LOW_STOCK, RECENT_MOVEMENTS } from "../../constants/mockData";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Lang } from "../../types";

export function DashboardOverview({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t(lang, "Total Stock Value", "මුළු තොග වටිනාකම")} value="347" sub={t(lang, "Both stores combined", "ගබඩා දෙකම")} color="blue" icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label={t(lang, "Reorder Alerts", "නැවත ඇණවුම් දැනුම්")} value="3" sub={t(lang, "At or below threshold", "සීමාවේ හෝ ඊට පහළ")} color="red" icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label={t(lang, "Pending in Pipeline", "නල මාර්ගයේ")} value="11" sub={t(lang, "Awaiting action", "ක්‍රියාව අපේක්ෂිත")} color="amber" icon={<Clock className="w-5 h-5" />} />
        <StatCard label={t(lang, "Issued This Month", "මාසේ ගිලිහුණු")} value="62" sub={t(lang, "Fulfilled requests", "සම්පූර්ණ ඉල්ලීම්")} color="green" icon={<CheckCircle className="w-5 h-5" />} />
      </div>

      {/* Reorder alerts */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Reorder Level Alerts", "නැවත ඇණවුම් මට්ටම් දැනුම්")}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {LOW_STOCK.map((item) => (
            <div key={item.code} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              {item.critical ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{item.code}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${item.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{item.division}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${item.critical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {item.qty} / {item.reorder}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Division stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: t(lang, "Social Services Store", "සමාජ සේවා ගබඩාව"), total: 180, below: 2, capacity: 60, color: "bg-[#4295D9]" },
          { title: t(lang, "Probation & Child Care Store", "ස්ථාවරත්ව ගබඩාව"), total: 167, below: 1, capacity: 45, color: "bg-green-500" },
        ].map((div) => (
          <div key={div.title} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-sm">{div.title}</h4>
              <span className="text-xs text-gray-400">{div.total} {t(lang, "items", "අයිතම")}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
              <div className={`h-full ${div.color} rounded-full`} style={{ width: `${div.capacity}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{div.capacity}% {t(lang, "utilization", "භාවිතය")}</span>
              <span className="text-red-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {div.below} {t(lang, "below reorder level", "නැවත ඇණවුම් මට්ටමෙන් පහළ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[
          { title: t(lang, "Awaiting Recommendation", "නිර්දේශ අපේක්ෂිත"), count: 4, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { title: t(lang, "Awaiting Approval", "අනුමත අපේක්ෂිත"), count: 7, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
        ].map((p) => (
          <div key={p.title} className={`rounded-xl border p-5 ${p.bg}`}>
            <div className="text-4xl font-bold text-gray-900 mb-1">{p.count}</div>
            <div className={`text-sm font-semibold ${p.color}`}>{p.title}</div>
            <div className="mt-4 text-xs text-gray-500">{t(lang, "Request Pipeline — This Month", "ඉල්ලීම් නල මාර්ගය — මේ මාසය")}</div>
          </div>
        ))}
      </div>

      {/* Recent movements */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Recent Stock Movements", "මෑත තොග චලනය")}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {RECENT_MOVEMENTS.map((m, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type === "in" ? "bg-green-50" : "bg-red-50"}`}>
                {m.type === "in"
                  ? <ArrowDownToLine className="w-4 h-4 text-green-600" />
                  : <ArrowUpFromLine className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{m.item}</div>
                <div className="text-xs text-gray-400">{m.by} · {m.date}</div>
              </div>
              <span className={`text-sm font-bold flex-shrink-0 ${m.type === "in" ? "text-green-600" : "text-red-500"}`}>{m.qty}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

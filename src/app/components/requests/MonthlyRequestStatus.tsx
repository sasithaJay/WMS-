import { PlusCircle } from "lucide-react";
import { ClipboardList, Clock, CheckCircle, Package } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { STATUS_CONFIG, t } from "../../constants/translations";
import { MOCK_REQUESTS } from "../../constants/mockData";
import { ArrowRight } from "lucide-react";
import type { Lang } from "../../types";

export function MonthlyRequestStatus({ lang, onNewRequest }: { lang: Lang; onNewRequest?: () => void }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t(lang, "Requests This Month", "මාසේ ඉල්ලීම්")} value="1" sub={t(lang, "Max 1/month", "උපරිම 1/මාසය")} color="blue" icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard label={t(lang, "Pending", "අපේක්ෂිත")} value="1" color="amber" icon={<Clock className="w-5 h-5" />} />
        <StatCard label={t(lang, "Approved", "අනුමත")} value="2" color="green" icon={<CheckCircle className="w-5 h-5" />} />
        <StatCard label={t(lang, "Issued", "ලබාදුන්")} value="3" color="purple" icon={<Package className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "My Requests", "මගේ ඉල්ලීම්")}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {MOCK_REQUESTS.map((r) => {
              const sc = STATUS_CONFIG[r.status];
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.item}</div>
                    <div className="text-xs text-gray-400">{r.id} · {r.date} · Qty: {r.qty}</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${sc.color}`}>
                    {t(lang, sc.label, sc.labelSi)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <button className="text-xs text-[#4295D9] font-medium hover:underline flex items-center gap-1">
              {t(lang, "View all requests", "සියලු ඉල්ලීම් බලන්න")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">{t(lang, "New Request", "නව ඉල්ලීම")}</h3>
            <p className="text-xs text-gray-500 mb-4">
              {t(lang, "You can submit one request per month. Your next request window opens 1 July 2024.", "ඔබට මසකට ඉල්ලීම් එකක් ඉදිරිපත් කළ හැකිය.")}
            </p>
            <button
              onClick={onNewRequest}
              className="w-full py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              {t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">{t(lang, "Request Status", "ඉල්ලීම් තත්ත්වය")}</h3>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${v.color}`}>
                  {t(lang, v.label, v.labelSi)}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {MOCK_REQUESTS.filter((r) => r.status === k).length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

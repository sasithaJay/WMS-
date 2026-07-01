import { useState } from "react";
import { Search } from "lucide-react";
import { ACTIVE_USERS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

type UserType = "all" | "staff" | "institution" | "ds";

export function UserManagementTable({ lang }: { lang: Lang }) {
  const [filter, setFilter] = useState<UserType>("all");
  const [search, setSearch] = useState("");

  const typeLabel: Record<UserType, string> = {
    all: t(lang, "All Types", "සියලු"),
    staff: t(lang, "Staff", "කාර්ය මණ්ඩලය"),
    institution: t(lang, "Institution", "ආයතනය"),
    ds: t(lang, "DS Office", "DS කාර්යාලය"),
  };

  const activeFiltered = ACTIVE_USERS.filter(
    (u) =>
      (filter === "all" ||
        (filter === "staff" && !["Institution", "DS Office"].includes(u.role)) ||
        (filter === "institution" && u.role === "Institution") ||
        (filter === "ds" && u.role === "DS Office")) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "Search users…", "පරිශීලකයන් සෙවීම…")}
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "staff", "institution", "ds"] as UserType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {typeLabel[f]}
            </button>
          ))}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        {t(lang, "Active Users", "සක්‍රිය පරිශීලකයන්")}
      </h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Name", "නාමය"), t(lang, "Role", "කාර්යභාරය"), t(lang, "Division", "කොට්ඨාශය"), t(lang, "Section", "අංශය"), t(lang, "Status", "තත්ත්වය"), ""].map((h, i) => (
                <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeFiltered.map((u) => (
              <tr key={u.name} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3.5 text-gray-600 text-xs">{u.role}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{u.division}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{u.section}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.status === "active" ? t(lang, "Active", "සක්‍රිය") : t(lang, "Inactive", "අක්‍රිය")}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button className="text-xs text-[#4295D9] font-medium hover:underline">{t(lang, "Edit", "සංස්කරණය")}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { usePersistentActiveNav } from "../../hooks/usePersistentActiveNav";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { UserVerificationTable } from "../../components/users/UserVerificationTable";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { StatCard } from "../../components/common/StatCard";
import { Users, UserCheck, ShieldCheck, AlertTriangle, Database, FileText, Settings2, ChevronRight, Activity, UserCog } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { UserManagementTable } from "../../components/users/UserManagementTable";
import { getAdminStats } from "../../../services/userManagementService";
import type { AdminStats } from "../../types/userManagement";
import { BackupSettingsPanel } from "../../components/settings/BackupSettingsPanel";
import { CommissionerAccounts } from "../../components/users/CommissionerAccounts";

export function AdminDashboard({
  lang,
  setLang,
  onLogout,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onLogout: () => void;
}) {
  const [activeNav, setActiveNav] = usePersistentActiveNav("ADMIN");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const role = "ADMIN" as const;

  useEffect(() => {
    getAdminStats().then((res) => setStats(res.data)).catch((err) => console.error(err));
  }, []);

  return (
    <DashboardLayout
      lang={lang}
      setLang={setLang}
      role={role}
      activeNav={activeNav}
      setActiveNav={setActiveNav}
      onLogout={onLogout}
      canSeeSummary={false}
    >
      {activeNav === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t(lang, "Total Users", "මුළු පරිශීලකයන්")}
              value={stats ? String(stats.total_users) : "-"}
              color="blue"
              bgColor="bgBlue"
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label={t(lang, "Pending Users", "අපේක්ෂිත පරිශීලකයන්")}
              value={stats ? String(stats.pending_users) : "-"}
              color="amber"
              bgColor="bgAmber"
              icon={<UserCheck className="w-5 h-5" />}
            />
            <StatCard
              label={t(lang, "Active Roles", "සක්‍රීය භූමිකා")}
              value={stats ? String(stats.active_roles) : "-"}
              color="green"
              bgColor="bgGreen"
              icon={<ShieldCheck className="w-5 h-5" />}
            />
            <StatCard
              label={t(lang, "Suspended Users", "අත්හිටුවා ඇති පරිශීලකයන්")}
              value={stats ? String(stats.suspended_users) : "-"}
              color="red"
              bgColor="bgRed"
              icon={<AlertTriangle className="w-5 h-5" />}
            />
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">{t(lang, "Recent Admin Activity", "මෑත පරිපාලන ක්‍රියාකාරකම්")}</h2>
                </div>
                <span className="text-xs text-slate-400">{stats?.recent_activity.length ?? 0} {t(lang, "events", "සිදුවීම්")}</span>
              </div>
              {stats?.recent_activity.length ? (
                <div className="divide-y divide-slate-100">
                  {stats.recent_activity.map((event) => {
                    const actionLabels: Record<string, string> = {
                      ACCOUNT_APPROVED: "Account approved",
                      ACCOUNT_REJECTED: "Account rejected",
                      ACCOUNT_STATUS_CHANGED: `Account status changed to ${String(event.details?.to ?? "updated")}`,
                      USER_ROLE_CHANGED: "User role changed",
                    };
                    return <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{actionLabels[event.action] ?? event.action.replaceAll("_", " ")}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500 truncate">{event.target} <span className="text-slate-300">·</span> {t(lang, "by", "විසින්")} {event.actor}</p>
                      </div>
                      <time className="shrink-0 text-[10px] text-slate-400">{new Date(event.created_at).toLocaleString()}</time>
                    </div>;
                  })}
                </div>
              ) : <p className="px-5 py-8 text-center text-xs text-slate-500">{t(lang, "Admin actions will appear here as they happen.", "පරිපාලන ක්‍රියා සිදුවන විට මෙහි පෙන්වනු ඇත.")}</p>}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 mb-4"><Settings2 className="w-4 h-4 text-indigo-600" /><h2 className="text-sm font-bold text-slate-900">{t(lang, "Quick Actions", "ඉක්මන් ක්‍රියා")}</h2></div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Manage users & roles", nav: "users", icon: UserCog },
                    { label: "Review registrations", nav: "users", icon: UserCheck },
                    { label: "Commissioner accounts", nav: "commissioners", icon: Users },
                    { label: "Backup settings", nav: "backups", icon: Database },
                    { label: "View reports", nav: "reports", icon: FileText },
                  ].map(({ label, nav, icon: Icon }) => <button key={label} onClick={() => setActiveNav(nav)} className="group flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-left text-[11px] font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700 transition-colors">
                    <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-blue-600" />{t(lang, label, label)}<ChevronRight className="ml-auto w-3.5 h-3.5 text-slate-300" />
                  </button>)}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-emerald-600" /><h2 className="text-sm font-bold text-slate-900">{t(lang, "System Status", "පද්ධති තත්ත්වය")}</h2></div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between"><span className="text-slate-500">{t(lang, "Database", "දත්ත ගබඩාව")}</span><span className={`font-bold ${stats?.system_status.database === "online" ? "text-emerald-700" : "text-rose-700"}`}>{stats?.system_status.database ?? "—"}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">{t(lang, "Low stock schedule", "අඩු තොග කාලසටහන")}</span><span className={`font-bold ${stats?.system_status.low_stock_scheduler_configured ? "text-emerald-700" : "text-amber-700"}`}>{stats?.system_status.low_stock_scheduler_configured ? t(lang, "Configured", "සකසා ඇත") : t(lang, "Not configured", "සකසා නැත")}</span></div>
                  <div className="flex items-center justify-between"><span className="text-slate-500">{t(lang, "Maintenance mode", "නඩත්තු මාදිලිය")}</span><span className={`font-bold ${stats?.system_status.maintenance_mode ? "text-amber-700" : "text-emerald-700"}`}>{stats?.system_status.maintenance_mode ? t(lang, "On", "ක්‍රියාත්මකයි") : t(lang, "Off", "අක්‍රියයි")}</span></div>
                  <div className="border-t border-slate-100 pt-3 flex items-start justify-between gap-3"><span className="text-slate-500">{t(lang, "Latest backup", "නවතම උපස්ථය")}</span><span className="text-right font-semibold text-slate-700">{stats?.latest_backup ? <>{stats.latest_backup.exists ? "✓ " : "⚠ "}{new Date(stats.latest_backup.created_at).toLocaleString()} · {stats.latest_backup.type}</> : t(lang, "No backup recorded", "උපස්ථයක් නැත")}</span></div>
                </div>
              </div>
            </div>
          </section>

          {/* <UserVerificationTable lang={lang} /> */}
        </div>
      )}

      {activeNav === "users" && (
        <div className="space-y-6">
          <UserVerificationTable lang={lang} />
          <UserManagementTable lang={lang} />
        </div>
      )}
      {activeNav === "commissioners" && <CommissionerAccounts lang={lang} />}
      {activeNav === "reports" && <ReportsPanel lang={lang} role={role} />}
      {activeNav === "backups" && <BackupSettingsPanel lang={lang} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { UserVerificationTable } from "../../components/users/UserVerificationTable";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { StatCard } from "../../components/common/StatCard";
import { Users, UserCheck, ShieldCheck, AlertTriangle } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { UserManagementTable } from "../../components/users/UserManagementTable";
import { getAdminStats } from "../../../services/userManagementService";
import type { AdminStats } from "../../types/userManagement";
import { BackupSettingsPanel } from "../../components/settings/BackupSettingsPanel";

export function AdminDashboard({
  lang,
  setLang,
  onLogout,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onLogout: () => void;
}) {
  const [activeNav, setActiveNav] = useState("dashboard");
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

          <UserVerificationTable lang={lang} />
        </div>
      )}

      {activeNav === "users" && (
        <div className="space-y-6">
          <UserVerificationTable lang={lang} />
          <UserManagementTable lang={lang} />
        </div>
      )}
      {activeNav === "reports" && <ReportsPanel lang={lang} />}
      {/* {activeNav === "backups" && <BackupSettingsPanel lang={lang} />} */}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}
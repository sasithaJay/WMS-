import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { UserVerificationTable } from "../../components/users/UserVerificationTable";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { StatCard } from "../../components/common/StatCard";
import { Users, UserCheck, ShieldCheck, AlertTriangle } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { UserManagementTable } from "../../components/users/UserManagementTable";

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
  const role = "ADMIN" as const;

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
              value="42"
              color="blue"
              icon={<Users className="w-5 h-5" />}
            />

            <StatCard
              label={t(lang, "Pending Users", "අපේක්ෂිත පරිශීලකයන්")}
              value="5"
              color="amber"
              icon={<UserCheck className="w-5 h-5" />}
            />

            <StatCard
              label={t(lang, "Active Roles", "සක්‍රීය භූමිකා")}
              value="8"
              color="green"
              icon={<ShieldCheck className="w-5 h-5" />}
            />

            <StatCard
              label={t(lang, "System Alerts", "පද්ධති අනතුරු ඇඟවීම්")}
              value="2"
              color="red"
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
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}
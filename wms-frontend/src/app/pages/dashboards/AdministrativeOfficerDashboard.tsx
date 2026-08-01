import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { RequestForm } from "../../components/requests/RequestForm";
import { RecommendationQueue } from "../../components/requests/RecommendationQueue";
import { PendingItemUpdateRequestsQueue } from "../../components/inventory/PendingItemUpdateRequestsQueue";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import type { Lang, DashTab } from "../../types";
import { UserManagementTable } from "../../components/users/UserManagementTable";
import { UserVerificationTable } from "../../components/users/UserVerificationTable";
import { DashboardMyView } from "../../components/dashboard/DashboardMyView";

export function AdministrativeOfficerDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [dashTab, setDashTab] = useState<DashTab>("personal");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestsRefreshSignal, setRequestsRefreshSignal] = useState(0);
  const role = "ADMINISTRATIVE_OFFICER" as const;

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav}
      setActiveNav={(id) => { setActiveNav(id); setShowNewRequest(false); }}
      onLogout={onLogout} canSeeSummary={true} dashTab={dashTab} setDashTab={setDashTab}>
      {activeNav === "dashboard" && (
                    dashTab === "summary"
                      ? <DashboardOverview lang={lang} />
                      : <DashboardMyView lang={lang} role={role} onNavigate={setActiveNav} />
      )}
      {activeNav === "requests" && !showNewRequest && <MyRequestsTable lang={lang} role={role} onNewRequest={() => setShowNewRequest(true)} refreshSignal={requestsRefreshSignal} />}
      {activeNav === "requests" && showNewRequest && <RequestForm lang={lang} role={role} onCancel={() => setShowNewRequest(false)} 
        onSubmitted={() => {
          setRequestsRefreshSignal((s) => s + 1);
          setShowNewRequest(false);
        }} />}
      {activeNav === "recommend" && <RecommendationQueue lang={lang} />}
      {activeNav === "item-updates" && <PendingItemUpdateRequestsQueue lang={lang} />}
      {activeNav === "reports" && <ReportsPanel lang={lang} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}
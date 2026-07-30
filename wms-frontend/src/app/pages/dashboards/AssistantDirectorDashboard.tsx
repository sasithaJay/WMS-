import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { RequestForm } from "../../components/requests/RequestForm";
import { ApprovalQueue } from "../../components/requests/ApprovalQueue";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import type { Lang, DashTab } from "../../types";
import { DashboardMyView } from "../../components/dashboard/DashboardMyView";

export function AssistantDirectorDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [dashTab, setDashTab] = useState<DashTab>("personal");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requestsRefreshSignal, setRequestsRefreshSignal] = useState(0);
  const role = "ASSISTANT_DIRECTOR" as const;

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
      {activeNav === "approve" && <ApprovalQueue lang={lang} />}
      {activeNav === "reports" && <ReportsPanel lang={lang} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}

import React, { useEffect, useState, useCallback  } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { t } from "../../constants/translations";
import { ROLE_LABELS } from "../../constants/roles";
import { getRoleUserName } from "../../utils/roleHelpers";
import type { Lang, Role, DashTab } from "../../types";
import { DashboardOverview } from "../dashboard/DashboardOverview";
import { DashboardMyView } from "../dashboard/DashboardMyView";
import { DashboardChart } from "../dashboard/DashboardChart";
import { getNavBadgeCounts } from "../../../services/badgeCountService";
import { BadgeRefreshContext } from "../../context/BadgeRefreshContext";

const NAV_TITLES: Record<string, { en: string; si: string }> = {
  dashboard: { en: "Dashboard", si: "උපකරණ පුවරුව" },
  requests: { en: "My Requests", si: "මගේ ඉල්ලීම්" },
  new: { en: "New Request", si: "නව ඉල්ලීම" },
  recommend: { en: "Recommend Queue", si: "නිර්දේශ පෝලිම" },
  approve: { en: "Approve Queue", si: "අනුමත පෝලිම" },
  issue: { en: "Issue Goods", si: "භාණ්ඩ ගිලිහීම" },
  inventory: { en: "Inventory", si: "තොග ලැයිස්තුව" },
  receipts: { en: "Stock Receipts", si: "ගබඩා රිසිට්" },
  reports: { en: "Reports", si: "වාර්තා" },
  users: { en: "User Management", si: "පරිශීලක කළමනාකරණය" },
  settings: { en: "Settings", si: "සැකසීම්" },
};

export function DashboardLayout({
  lang,
  setLang,
  role,
  activeNav,
  setActiveNav,
  onLogout,
  canSeeSummary,
  dashTab,
  setDashTab,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  role: Role;
  activeNav: string;
  setActiveNav: (id: string) => void;
  onLogout: () => void;
  canSeeSummary?: boolean;
  dashTab?: DashTab;
  setDashTab?: (tab: DashTab) => void;
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [badgeRefreshSignal, setBadgeRefreshSignal] = useState(0);
  const titleEntry = NAV_TITLES[activeNav] ?? { en: "Dashboard", si: "උපකරණ පුවරුව" };
  const title = t(lang, titleEntry.en, titleEntry.si);

  const roleLabel = ROLE_LABELS[role] ?? { en: role, si: role };
  const userName = getRoleUserName(role);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t(lang, "Good morning", "සුභ උදෑසනක්");
    if (h < 17) return t(lang, "Good afternoon", "සුභ දහවලක්");
    return t(lang, "Good evening", "සුභ සැන්දෑවක්");
  };
 

  const loadBadges = useCallback(async () => {
    const counts = await getNavBadgeCounts();
    setBadges(counts);
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  useEffect(() => {
    if (badgeRefreshSignal > 0) {
      loadBadges();
    }
  }, [badgeRefreshSignal, loadBadges]);


  useEffect(() => {
    loadBadges();
  }, [activeNav]);

  const triggerBadgeRefresh = useCallback(() => {
    setBadgeRefreshSignal((s) => s + 1);
  }, []);

  useEffect(() => {
    getNavBadgeCounts().then(setBadges);
  }, []);

  return (
    <BadgeRefreshContext.Provider value={{ triggerBadgeRefresh }}>
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar
          lang={lang}
          role={role}
          active={activeNav}
          setActive={setActiveNav}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onLogout={onLogout}
          badges={badges}
        />
        <div className="flex-1 flex flex-col min-w-0 ">
          <Topbar lang={lang} setLang={setLang} title={title} />
          <main className="flex-1 p-6 space-y-6 ">
            {activeNav === "dashboard" && (
              <div
                className="rounded-2xl p-6 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #4295D9 0%, #1A5FA8 100%)" }}
              >
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
                <div className="absolute bottom-0 right-20 w-24 h-24 rounded-full bg-white/5" />
                <div className="relative z-10">
                  <p className="text-blue-200 text-sm">{greeting()},</p>
                  <h2 className="text-2xl font-bold mt-0.5">{userName}</h2>
                  <p className="text-blue-100 text-sm mt-1">{t(lang, roleLabel.en, roleLabel.si)}</p>
                  {canSeeSummary && dashTab !== undefined && setDashTab && (
                    <div className="mt-4 flex gap-1 bg-white/10 rounded-lg p-0.5 w-fit backdrop-blur-sm">
                      {(["personal", "summary"] as DashTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setDashTab(tab)}
                          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                            dashTab === tab ? "bg-white text-[#4295D9]" : "text-blue-100 hover:text-white"
                          }`}
                        >
                          {tab === "personal"
                            ? t(lang, "My View", "මගේ දසුන")
                            : t(lang, "Overview", "දළ විශ්ලේෂණය")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* {children} */}

            {/* {activeNav === "dashboard" && role === "COMMISSIONER" ? (
              dashTab === "summary" ? (
                <DashboardOverview lang={lang} />
              ) : (
                <DashboardMyView lang={lang} role={role} />
              )
            ) : (
              children
            )} */}

            {activeNav === "dashboard" ? (
              dashTab === "summary" ? (
                role === "STORE_KEEPER" ? (
                  children
                ) : (
                  <DashboardOverview lang={lang} />
                )
              ) : role === "COMMISSIONER" ? (
                <DashboardMyView lang={lang} role={role} />
              ) : (
                children
              )
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </BadgeRefreshContext.Provider>
  );
}

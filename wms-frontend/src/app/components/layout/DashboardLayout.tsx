import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { t } from "../../constants/translations";
import type { Lang, Role, DashTab } from "../../types";
import { getNavBadgeCounts } from "../../../services/badgeCountService";
import { getCurrentUser} from "../../../services/authService";
import type { User } from "../../types/auth";
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

function getDisplayName(user: User | null): string {
  if (!user) return "";
  return user.staff_profile?.full_name ?? user.organization?.name ?? user.username;
}

function getDisplayRole(user: User | null, lang: Lang): string {
  if (!user) return "";
  if (user.staff_profile?.role) {
    return t(lang, user.staff_profile.role.name_en, user.staff_profile.role.name_si);
  }
  if (user.organization) {
    return user.organization.organization_kind === "INSTITUTION"
      ? t(lang, "Institution", "ආයතනය")
      : t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය");
  }
  return user.account_type;
}

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const titleEntry = NAV_TITLES[activeNav] ?? { en: "Dashboard", si: "උපකරණ පුවරුව" };
  const title = t(lang, titleEntry.en, titleEntry.si);

  const userName = getDisplayName(currentUser);
  const roleLabel = getDisplayRole(currentUser, lang);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t(lang, "Good morning", "සුභ උදෑසනක්");
    if (h < 17) return t(lang, "Good afternoon", "සුභ දහවලක්");
    return t(lang, "Good evening", "සුභ සැන්දෑවක්");
  };

  useEffect(() => {
    getCurrentUser().then(setCurrentUser).catch((err) => console.error(err));
  }, []);

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
                  <h2 className="text-2xl font-bold mt-0.5">{userName || "\u00A0"}</h2>
                  <p className="text-blue-100 text-sm mt-1">{roleLabel}</p>
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
            {children}
          </main>
        </div>
      </div>
    </BadgeRefreshContext.Provider>
  );
}
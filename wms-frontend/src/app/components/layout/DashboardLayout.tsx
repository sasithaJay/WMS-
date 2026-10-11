import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { t } from "../../constants/translations";
import type { Lang, Role, DashTab } from "../../types";
import { getNavBadgeCounts } from "../../../services/badgeCountService";
import { getCurrentUser } from "../../../services/authService";
import type { User } from "../../types/auth";
import { BadgeRefreshContext } from "../../context/BadgeRefreshContext";
import { Sparkles } from "lucide-react";

const NAV_TITLES: Record<string, { en: string; si: string }> = {
  dashboard: { en: "Dashboard", si: "උපකරණ පුවරුව" },
  requests: { en: "My Requests", si: "මගේ ඉල්ලීම්" },
  new: { en: "New Request", si: "නව ඉල්ලීම" },
  recommend: { en: "Recommend Queue", si: "නිර්දේශ පෝලිම" },
  approve: { en: "Approve Queue", si: "අනුමත පෝලිම" },
  issue: { en: "Issue Goods", si: "භාණ්ඩ ගිලිහීම" },
  "equipment-returns": { en: "Equipment Returns", si: "උපකරණ ආපසු ලබාගැනීම" },
  inventory: { en: "Inventory", si: "තොග ලැයිස්තුව" },
  receipts: { en: "Stock Receipts", si: "ගබඩා රිසිට්" },
  reports: { en: "Reports", si: "වාර්තා" },
  users: { en: "User Management", si: "පරිශීලක කළමනාකරණය" },
  commissioners: { en: "Commissioner Accounts", si: "කොමසාරිස් ගිණුම්" },
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
  // On mobile (<768px), sidebar is hidden by default (`collapsed = true`)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

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
      <div className="flex h-screen bg-[#F8FAFC] text-slate-800 overflow-hidden antialiased">
        {/* RESPONSIVE SIDEBAR */}
        <Sidebar
          lang={lang}
          setLang={setLang}
          role={role}
          active={activeNav}
          setActive={setActiveNav}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onLogout={onLogout}
          badges={badges}
        />

        {/* MAIN CONTAINER */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
          {/* TOPBAR WITH MOBILE HAMBURGER TOGGLE */}
          <Topbar
            lang={lang}
            setLang={setLang}
            title={title}
            onMobileMenuToggle={() => setSidebarCollapsed((c) => !c)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            {activeNav === "dashboard" && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-700 p-5 sm:p-8 mb-6 shadow-xl shadow-blue-500/10 text-white">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-16 right-24 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-100 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{greeting()}</span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                      {userName || "\u00A0"}
                    </h2>

                    <p className="text-xs text-blue-100 mt-1 font-medium">
                      {roleLabel}
                    </p>
                  </div>

                  {canSeeSummary && dashTab !== undefined && setDashTab && (
                    <div className="flex bg-white/15 border border-white/20 p-1 rounded-2xl backdrop-blur-md self-start md:self-auto">
                      {(["personal", "summary"] as DashTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setDashTab(tab)}
                          className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            dashTab === tab
                              ? "bg-white text-blue-700 shadow-md"
                              : "text-blue-50 hover:text-white"
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

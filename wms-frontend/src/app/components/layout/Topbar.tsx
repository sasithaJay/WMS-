import { Menu } from "lucide-react";
import { LanguageToggle } from "../common/LanguageToggle";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { NotificationBell } from "./NotificationBell";

export function Topbar({
  lang,
  setLang,
  title,
  subtitle,
  onMobileMenuToggle,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  title: string;
  subtitle?: string;
  onMobileMenuToggle?: () => void;
}) {
  const defaultSubtitle = t(
    lang,
    "Social Welfare, Probation & Child Care Services",
    "සමාජ සුබසාධන, පරිවාස හා ළමාරක්ෂක සේවා"
  );

  return (
    <header className="sticky top-0 z-30 h-20 w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-slate-800 md:bg-[var(--app-shell)]">
      {/* LEFT SECTION: MOBILE HAMBURGER + PAGE TITLE */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onMobileMenuToggle}
          title="Open Menu"
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-white md:text-slate-900 tracking-tight truncate">
            {title}
          </h1>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] sm:text-xs text-slate-300 md:text-slate-500 truncate">
              {subtitle ?? defaultSubtitle}
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 md:bg-slate-400 shrink-0" />
            <span className="hidden sm:inline-block text-[10px] font-bold text-blue-200 md:text-blue-600 bg-blue-500/20 md:bg-blue-50 border border-blue-400/30 md:border-blue-100 px-2 py-0.5 rounded-md">
              WMS
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-slate-200/70 hover:bg-white transition-colors">
          <NotificationBell lang={lang} />
        </div>

        <div className="flex items-center rounded-xl bg-white/80 border border-slate-200/70 p-0.5">
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>
      </div>
    </header>
  );
}

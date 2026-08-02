import { Bell } from "lucide-react";
import { LanguageToggle } from "../common/LanguageToggle";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { NotificationBell } from "./NotificationBell";

export function Topbar({
  lang,
  setLang,
  title,
  subtitle,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 sticky top-0 z-50">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-xs text-gray-400">
          {subtitle ?? `${t(lang, "Social Welfare, Probation & Child Care Services", "සමාජ සුබසාධන, පරිවාස හා ළමාරක්ෂක සේවා")} · WMS`}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell lang={lang} />
        <LanguageToggle lang={lang} setLang={setLang} />
      </div>
    </header>
  );
}

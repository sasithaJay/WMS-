import type { Lang } from "../../types";

export function LanguageToggle({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold select-none border border-slate-200/60">
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
          lang === "en"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
        }`}
      >
        EN
      </button>

      <button
        type="button"
        onClick={() => setLang("si")}
        className={`px-2.5 py-1 rounded-lg transition-all duration-200 cursor-pointer ${
          lang === "si"
            ? "bg-blue-600 text-white shadow-xs"
            : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
        }`}
      >
        සිං
      </button>
    </div>
  );
}
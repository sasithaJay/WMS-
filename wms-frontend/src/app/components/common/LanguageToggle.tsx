import type { Lang } from "../../types";

export function LanguageToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center bg-gray-100 rounded-full p-0.5 text-sm font-medium select-none">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-full transition-all duration-200 ${
          lang === "en"
            ? "bg-[#4295D9] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("si")}
        className={`px-3 py-1 rounded-full transition-all duration-200 ${
          lang === "si"
            ? "bg-[#4295D9] text-white shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        සිං
      </button>
    </div>
  );
}

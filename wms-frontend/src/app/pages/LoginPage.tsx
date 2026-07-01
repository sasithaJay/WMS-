import { useState } from "react";
import { Eye, EyeOff, Warehouse } from "lucide-react";
import { LanguageToggle } from "../components/common/LanguageToggle";
import { t } from "../constants/translations";
import type { Lang, Role } from "../types";

export function LoginPage({
  lang,
  setLang,
  onLogin,
  onRegister,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onLogin: (role: Role) => void;
  onRegister: () => void;
}) {
  const [showPw, setShowPw] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [roleDemo, setRoleDemo] = useState<Role>("COMMISSIONER");

  const roles: { value: Role; label: string; labelSi: string }[] = [
    { value: "COMMISSIONER", label: "Commissioner", labelSi: "කොමසාරිස්" },
    { value: "ASSISTANT_COMMISSIONER", label: "Asst. Commissioner", labelSi: "ස. කොමසාරිස්" },
    { value: "ASSISTANT_DIRECTOR", label: "Asst. Director", labelSi: "ස. අධ්‍යක්ෂ" },
    { value: "ACCOUNTANT", label: "Accountant", labelSi: "ගණකාධිකාරී" },
    { value: "ADMINISTRATIVE_OFFICER", label: "Admin. Officer", labelSi: "ව්‍ය. නිලධාරී" },
    { value: "SECTION_HEAD", label: "Section Head", labelSi: "අංශ ප්‍රධානී" },
    { value: "STORE_KEEPER", label: "Store Keeper", labelSi: "ගබඩාරක්ෂක" },
    { value: "DEVELOPMENT_OFFICER", label: "Dev. Officer", labelSi: "ස. නිලධාරී" },
    { value: "OFFICER", label: "Officer", labelSi: "නිලධාරී" },
    { value: "INSTITUTION", label: "Institution", labelSi: "ආයතනය" },
    { value: "DIVISIONAL_SECRETARIAT", label: "DS Office", labelSi: "DS කාර්යාලය" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col justify-center items-center text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4295D9 0%, #1A5FA8 100%)" }}
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-32 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/3 right-10 w-48 h-48 rounded-full opacity-5 bg-white" />

        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
              <Warehouse className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="text-sm font-semibold tracking-widest uppercase text-blue-200 mb-3">
            {t(lang, "Sri Lanka Government", "ශ්‍රී ලංකා රජය")}
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-2">
            {t(lang, "Department of Social Services", "සමාජ සේවා දෙපාර්තමේන්තුව")}
          </h1>
          <h2 className="text-2xl font-semibold text-blue-100 mb-1">
            {t(lang, "Probation & Child Care Services", "ස්ථාවරත්ව හා ළමා රැකවරණ සේවා")}
          </h2>
          <div className="mt-6 h-px bg-white/20 w-32 mx-auto" />
          <p className="mt-6 text-lg text-blue-100 font-medium">
            {t(lang, "Digital Warehouse Management System", "ඩිජිටල් ගබඩා කළමනාකරණ පද්ධතිය")}
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { n: "2", label: t(lang, "Divisions", "කොට්ඨාශ") },
              { n: "17+", label: t(lang, "Institutions", "ආයතන") },
              { n: "50", label: t(lang, "DS Offices", "ද.ලේ. කාර්යාල") },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <div className="text-3xl font-bold">{s.n}</div>
                <div className="text-xs text-blue-200 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 relative">
        <div className="absolute top-5 right-6">
          <LanguageToggle lang={lang} setLang={setLang} />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4FD] flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-[#4295D9]" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg leading-tight">
                {t(lang, "Warehouse Management", "ගබඩා කළමනාකරණ")}
              </div>
              <div className="text-xs text-gray-500">{t(lang, "System", "පද්ධතිය")}</div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {t(lang, "Sign in to your account", "ගිණුමට ඇතුල් වන්න")}
          </h2>
          <p className="text-sm text-gray-500 mb-7">
            {t(lang, "Enter your credentials to continue", "ඔබගේ විස්තර ඇතුලත් කරන්න")}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Username", "පරිශීලක නාමය")}
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t(lang, "Enter username", "පරිශීලක නාමය ඇතුලත් කරන්න")}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Password", "මුරපදය")}
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(lang, "Enter password", "මුරපදය ඇතුලත් කරන්න")}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#4295D9]"
                />
                <span className="text-sm text-gray-600">{t(lang, "Remember me", "මතක තබා ගන්න")}</span>
              </label>
              <button className="text-sm text-[#4295D9] hover:underline">
                {t(lang, "Forgot password?", "මුරපදය අමතකද?")}
              </button>
            </div>

            {/* Demo role selector */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">
                {t(lang, "Demo: Select role to preview dashboard", "Demo: කාර්යභාරය තෝරන්න")}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRoleDemo(r.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                      roleDemo === r.value
                        ? "bg-[#4295D9] text-white"
                        : "bg-white border border-amber-300 text-amber-700"
                    }`}
                  >
                    {t(lang, r.label, r.labelSi)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => onLogin(roleDemo)}
              className="w-full py-2.5 bg-[#4295D9] text-white font-semibold rounded-xl hover:bg-[#3280C4] active:bg-[#2670B0] transition-all shadow-sm hover:shadow-md"
            >
              {t(lang, "Sign In", "ඇතුල් වන්න")}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t(lang, "Don't have an account?", "ගිණුමක් නැද්ද?")}{" "}
            <button onClick={onRegister} className="text-[#4295D9] font-semibold hover:underline">
              {t(lang, "Register", "ලියාපදිංචි වන්න")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

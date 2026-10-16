import { useState } from "react";
import axios from "axios";
import {
  Eye,
  EyeOff,
  Warehouse,
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
  User,
  Sparkles,
} from "lucide-react";

import { LanguageToggle } from "../components/common/LanguageToggle";
import { t } from "../constants/translations";
import {
  login,
  requestTemporaryPassword,
} from "../../services/authService";

import type { Lang, Role } from "../types";
import logo from "../resources/logo.jpeg";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await login({
        username,
        password,
      });

      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");

      if (remember) {
        localStorage.setItem("auth_token", data.token);
      } else {
        sessionStorage.setItem("auth_token", data.token);
      }

      const userStorage = remember
        ? localStorage
        : sessionStorage;

      userStorage.setItem(
        "auth_user",
        JSON.stringify(data.user),
      );

      let dashboardRole: Role;

      if (data.user.account_type === "STAFF") {
        if (!data.user.role) {
          throw new Error(
            "No staff role is assigned to this account.",
          );
        }

        if (data.user.role === "OTHER_OFFICER") {
          dashboardRole = "DEVELOPMENT_OFFICER";
        } else {
          dashboardRole = data.user.role as Role;
        }
      } else if (
        data.user.account_type === "INSTITUTION"
      ) {
        dashboardRole = "INSTITUTION";
      } else {
        dashboardRole = "DIVISIONAL_SECRETARIAT";
      }

      onLogin(dashboardRole);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        const rejectionReason =
          error.response?.data?.rejection_reason;

        if (error.response?.status === 503) {
          setError(
            t(
              lang,
              "The system is currently under maintenance. Please try again later.",
              "පද්ධතිය මේ වන විට නඩත්තු කටයුතු සඳහා වසා ඇත. කරුණාකර පසුව නැවත උත්සාහ කරන්න.",
            ),
          );
        } else if (rejectionReason) {
          setError(`${message} ${rejectionReason}`);
        } else {
          setError(
            message ??
              t(
                lang,
                "Login failed. Please check your credentials and try again.",
                "ඇතුල් වීම අසාර්ථකයි. ඔබගේ විස්තර පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
              ),
          );
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          t(
            lang,
            "An unexpected error occurred.",
            "අනපේක්ෂිත දෝෂයක් ඇතිවිය.",
          ),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      const data = await requestTemporaryPassword(resetUsername.trim());
      setResetMessage(data.message);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setResetError(
          error.response?.data?.message ??
            "We could not process your request. Please try again.",
        );
      } else {
        setResetError("We could not process your request. Please try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 lg:bg-[#0F172A] flex items-center justify-center p-0 lg:p-8 selection:bg-blue-500 selection:text-white antialiased">
      {/* Background glow effects for large screens */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden lg:block">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Main Container */}
      <div className="w-full min-h-screen lg:min-h-0 lg:max-w-6xl lg:h-[720px] lg:rounded-3xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl lg:shadow-[0_20px_80px_rgba(0,0,0,0.3)] border border-slate-800/80 flex relative z-10">

        {/* =====================================================
            LEFT BRANDING PANEL
        ====================================================== */}
        <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden text-white bg-slate-950 flex-col justify-between p-12 border-r border-slate-800/80">
          
          {/* Subtle Ambient Glow inside Panel */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 via-indigo-900/10 to-transparent pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          {/* Header / Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-15 h-15 rounded-2xl bg-slate-900/80 p-1 ring-1 ring-white/10 shadow-xl backdrop-blur-md flex items-center justify-center">
                <img
                  src={logo}
                  alt="Department Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400 font-bold">
                  {t(
                    lang,
                    "Sri Lanka Government",
                    "ශ්‍රී ලංකා රජය",
                  )}
                </p>

                <p className="text-xs font-medium text-slate-300 mt-0.5">
                  {t(
                    lang,
                    "Government Digital Services",
                    "රාජ්‍ය ඩිජිටල් සේවා",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Main Branding */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">
                {t(
                  lang,
                  "Secure Government Platform",
                  "ආරක්ෂිත රාජ්‍ය පද්ධතිය",
                )}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
              {t(
                lang,
                "Digital Warehouse",
                "ඩිජිටල් ගබඩා",
              )}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-200 mt-1">
                {t(
                  lang,
                  "Management System",
                  "කළමනාකරණ පද්ධතිය",
                )}
              </span>
            </h1>

            <p className="text-sm leading-relaxed text-slate-400 mt-4 max-w-md">
              {t(
                lang,
                "A centralized platform for managing inventory, requests, approvals and warehouse operations across government institutions.",
                "රාජ්‍ය ආයතන හරහා තොග, ඉල්ලීම්, අනුමැතීන් සහ ගබඩා මෙහෙයුම් කළමනාකරණය කිරීම සඳහා මධ්‍යගත පද්ධතියකි.",
              )}
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 backdrop-blur-md">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {t(lang, "Secure", "ආරක්ෂිත")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t(
                      lang,
                      "Role-based access",
                      "භූමිකා මත ප්‍රවේශය",
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 border border-slate-800 p-3.5 backdrop-blur-md">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">
                    {t(lang, "Centralized", "මධ්‍යගත")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {t(
                      lang,
                      "Inventory management",
                      "තොග කළමනාකරණය",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-end justify-between pt-6 border-t border-slate-800/80">
            <div>
              <p className="text-xs font-medium text-slate-300">
                {t(
                  lang,
                  "Department of Social Welfare, Probation & Child Care Services",
                  "සමාජ සුබසාධන, පරිවාස හා ළමාරක්ෂක සේවා දෙපාර්තමේන්තුව",
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Digital Warehouse Management Platform
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl font-bold text-slate-200">2</span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                {t(lang, "Divisions", "කොට්ඨාශ")}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            RIGHT LOGIN PANEL
        ====================================================== */}
        <div className="flex-1 relative flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 bg-white dark:bg-slate-900">

          {/* Language Toggle */}
          <div className="absolute top-6 right-6 z-20">
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>

          <div className="w-full max-w-sm">

            {/* Mobile Logo Header */}
            <div className="lg:hidden flex flex-col items-center mb-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 p-1.5 ring-1 ring-slate-800 shadow-xl mb-3">
                <img
                  src={logo}
                  alt="Department Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t(lang, "Digital Warehouse", "ඩිජිටල් ගබඩා")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(lang, "Management System", "කළමනාකරණ පද්ධතිය")}
              </p>
            </div>

            {/* Desktop Panel Header */}
            <div className="mb-8">
              <div className="hidden lg:flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Warehouse className="w-4 h-4" />
                <span>
                  {t(lang, "Portal Access", "පද්ධති ප්‍රවේශය")}
                </span>
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t(
                  lang,
                  "Welcome back",
                  "නැවත සාදරයෙන් පිළිගනිමු",
                )}
              </h2>

              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {t(
                  lang,
                  "Sign in to continue to your dashboard.",
                  "ඔබගේ පාලක පුවරුව වෙත යාමට ඇතුල් වන්න.",
                )}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(
                    lang,
                    "Username",
                    "පරිශීලක නාමය",
                  )}
                </label>

                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>

                  <input
                    type="text"
                    value={username}
                    onChange={(event) =>
                      setUsername(event.target.value)
                    }
                    placeholder={t(
                      lang,
                      "Enter your username",
                      "ඔබගේ පරිශීලක නාමය ඇතුළත් කරන්න",
                    )}
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t(
                    lang,
                    "Password",
                    "මුරපදය",
                  )}
                </label>

                <div className="relative group">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                    <LockKeyhole className="w-4 h-4" />
                  </div>

                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder={t(
                      lang,
                      "Enter your password",
                      "ඔබගේ මුරපදය ඇතුළත් කරන්න",
                    )}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPw((previous) => !previous)
                    }
                    disabled={loading}
                    className="absolute cursor-pointer right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    aria-label={
                      showPw
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) =>
                      setRemember(event.target.checked)
                    }
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500/20 bg-slate-50 dark:bg-slate-800 accent-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t(
                      lang,
                      "Remember me",
                      "මතක තබා ගන්න",
                    )}
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setResetUsername(username);
                    setResetError("");
                    setResetMessage("");
                    setShowForgotPassword(true);
                  }}
                  className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  {t(
                    lang,
                    "Forgot password?",
                    "මුරපදය අමතකද?",
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="w-4 h-4 shrink-0 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                    !
                  </div>
                  <p className="text-xs font-medium leading-relaxed text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !username.trim() ||
                  !password
                }
                className="group relative w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm cursor-pointer transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>
                      {t(
                        lang,
                        "Signing in...",
                        "ඇතුල් වෙමින්...",
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      {t(
                        lang,
                        "Sign In",
                        "ඇතුල් වන්න",
                      )}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

            </form>

            {showForgotPassword && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="forgot-password-title"
              >
                <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
                  <h3 id="forgot-password-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    Forgot password?
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    Enter your username. If it belongs to an account with a phone number, we will send a temporary password by SMS.
                  </p>

                  <form onSubmit={handleForgotPassword} className="mt-5 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="reset-username">
                        Username
                      </label>
                      <input
                        id="reset-username"
                        type="text"
                        value={resetUsername}
                        onChange={(event) => setResetUsername(event.target.value)}
                        autoComplete="username"
                        required
                        disabled={resetLoading}
                        className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    {resetError && (
                      <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        {resetError}
                      </p>
                    )}

                    {resetMessage && (
                      <p className="rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {resetMessage}
                      </p>
                    )}

                    <div className="flex justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        disabled={resetLoading}
                        className="h-10 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={resetLoading || !resetUsername.trim()}
                        className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {resetLoading ? "Sending..." : "Send temporary password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Register Action */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t(
                  lang,
                  "Don't have an account?",
                  "ගිණුමක් නැද්ද?",
                )}{" "}
                <button
                  type="button"
                  onClick={onRegister}
                  className="font-semibold cursor-pointer text-blue-600 dark:text-blue-400 hover:underline transition-all"
                >
                  {t(
                    lang,
                    "Register",
                    "ලියාපදිංචි වන්න",
                  )}
                </button>
              </p>
            </div>

            {/* Security Footer Notice */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {t(
                  lang,
                  "Authorized users only • Secure access",
                  "අවසර ලත් පරිශීලකයින් සඳහා පමණි • ආරක්ෂිත ප්‍රවේශය",
                )}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

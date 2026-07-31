import { useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Warehouse } from "lucide-react";

import { LanguageToggle } from "../components/common/LanguageToggle";
import { t } from "../constants/translations";
import { login } from "../../services/authService";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      //Save Authentication Token
      localStorage.removeItem("auth_token");
      sessionStorage.removeItem("auth_token");

      if (remember) {
        localStorage.setItem(
          "auth_token",
          data.token,
        );
      } else {
        sessionStorage.setItem(
          "auth_token",
          data.token,
        );
      }

      //Store Logged-In User
      const userStorage = remember
        ? localStorage
        : sessionStorage;

      userStorage.setItem(
        "auth_user",
        JSON.stringify(data.user),
      );

      //Determine Frontend Role
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

      //Continue Existing Dashboard Flow
      onLogin(dashboardRole);

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message;

        const rejectionReason =
          error.response?.data?.rejection_reason;

        if (rejectionReason) {
          setError(
            `${message} ${rejectionReason}`,
          );
        } else {
          setError(
            message ??
              t(
                lang,
                "Login failed. Please try again.",
                "ඇතුල් වීම අසාර්ථකයි. නැවත උත්සාහ කරන්න.",
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

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-3/5 flex-col justify-center items-center text-white relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #4295D9 0%, #1A5FA8 100%)",
        }}
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
            {t(
              lang,
              "Sri Lanka Government",
              "ශ්‍රී ලංකා රජය",
            )}
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-2">
            {t(
              lang,
              "Department of Social Welfare,",
              "සමාජ සුබසාධන,",
            )}
          </h1>

          <h1 className="text-4xl font-bold leading-tight mb-2">
            {t(
              lang,
              "Probation & Child Care Services",
              "පරිවාස හා ළමාරක්ෂක සේවා දෙපාර්තමේන්තුව",
            )}
          </h1>

          <div className="mt-6 h-px bg-white/20 w-32 mx-auto" />

          <p className="mt-6 text-lg text-blue-100 font-medium">
            {t(
              lang,
              "Digital Warehouse Management System",
              "ඩිජිටල් ගබඩා කළමනාකරණ පද්ධතිය",
            )}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              {
                n: "2",
                label: t(
                  lang,
                  "Divisions",
                  "කොට්ඨාශ",
                ),
              },
              {
                n: "17+",
                label: t(
                  lang,
                  "Institutions",
                  "ආයතන",
                ),
              },
              {
                n: "50",
                label: t(
                  lang,
                  "DS Offices",
                  "ප්‍රා.ලේ. කාර්යාල",
                ),
              },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20"
              >
                <div className="text-3xl font-bold">
                  {s.n}
                </div>

                <div className="text-xs text-blue-200 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 relative">
        <div className="absolute top-5 right-6">
          <LanguageToggle
            lang={lang}
            setLang={setLang}
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#EBF4FD] flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-[#4295D9]" />
            </div>

            <div>
              <div className="font-bold text-gray-900 text-lg leading-tight">
                {t(
                  lang,
                  "Warehouse Management",
                  "ගබඩා කළමනාකරණ",
                )}
              </div>

              <div className="text-xs text-gray-500">
                {t(lang, "System", "පද්ධතිය")}
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {t(
              lang,
              "Sign in to your account",
              "ගිණුමට ඇතුල් වන්න",
            )}
          </h2>

          <p className="text-sm text-gray-500 mb-7">
            {t(
              lang,
              "Enter your credentials to continue",
              "ඔබගේ විස්තර ඇතුලත් කරන්න",
            )}
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(
                  lang,
                  "Username",
                  "පරිශීලක නාමය",
                )}
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder={t(
                  lang,
                  "Enter username",
                  "පරිශීලක නාමය ඇතුලත් කරන්න",
                )}
                autoComplete="username"
                required
                disabled={loading}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(
                  lang,
                  "Password",
                  "මුරපදය",
                )}
              </label>

              <div className="relative">
                <input
                  type={
                    showPw
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={t(
                    lang,
                    "Enter password",
                    "මුරපදය ඇතුලත් කරන්න",
                  )}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white pr-10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPw((previous) => !previous)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target.checked,
                    )
                  }
                  className="w-4 h-4 rounded accent-[#4295D9]"
                />

                <span className="text-sm text-gray-600">
                  {t(
                    lang,
                    "Remember me",
                    "මතක තබා ගන්න",
                  )}
                </span>
              </label>

              <button
                type="button"
                className="text-sm text-[#4295D9] hover:underline"
              >
                {t(
                  lang,
                  "Forgot password?",
                  "මුරපදය අමතකද?",
                )}
              </button>
            </div>

            {/* API Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Login button */}
            <button
              type="submit"
              disabled={
                loading ||
                !username.trim() ||
                !password
              }
              className="w-full py-2.5 bg-[#4295D9] text-white font-semibold rounded-xl hover:bg-[#3280C4] active:bg-[#2670B0] transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? t(
                    lang,
                    "Signing in...",
                    "ඇතුල් වෙමින්...",
                  )
                : t(
                    lang,
                    "Sign In",
                    "ඇතුල් වන්න",
                  )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t(
              lang,
              "Don't have an account?",
              "ගිණුමක් නැද්ද?",
            )}{" "}
            <button
              type="button"
              onClick={onRegister}
              className="text-[#4295D9] font-semibold hover:underline"
            >
              {t(
                lang,
                "Register",
                "ලියාපදිංචි වන්න",
              )}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
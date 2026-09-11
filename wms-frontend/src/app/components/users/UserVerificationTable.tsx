import { useEffect, useState, useCallback } from "react";
import { UserCheck, UserX, Loader2, AlertCircle, ShieldAlert, User } from "lucide-react";
import {
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  type PendingRegistration,
} from "../../../services/userService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { UserDetailModal } from "./UserDetailModal";

function displayInfo(u: PendingRegistration, lang: Lang): { name: string; subtitle: string } {
  if (u.staff_profile) {
    const roleName = u.staff_profile.role
      ? t(lang, u.staff_profile.role.name_en, u.staff_profile.role.name_si)
      : `Role #${u.staff_profile.role_id}`;

    const divisionName = u.staff_profile.division
      ? t(lang, u.staff_profile.division.name_en, u.staff_profile.division.name_si)
      : undefined;

    return {
      name: u.staff_profile.full_name,
      subtitle: divisionName ? `${roleName} · ${divisionName}` : roleName,
    };
  }

  if (u.organization) {
    return {
      name: u.organization.name,
      subtitle:
        u.organization.organization_kind === "INSTITUTION"
          ? t(lang, "Institution", "ආයතනය")
          : t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය"),
    };
  }

  return { name: u.username, subtitle: u.account_type };
}

export function UserVerificationTable({ lang }: { lang: Lang }) {
  const [registrations, setRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingRegistration, setViewingRegistration] = useState<PendingRegistration | null>(null);

  const loadRegistrations = useCallback(async () => {
    try {
      setLoading((prev) => (registrations.length === 0 ? true : prev));
      setError("");
      const response = await getPendingRegistrations();
      setRegistrations(response.registrations);
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to load pending verifications.", "අපේක්ෂිත සත්‍යාපන පූරණය කළ නොහැක.")
      );
    } finally {
      setLoading(false);
    }
  }, [lang, registrations.length]);

  useEffect(() => {
    loadRegistrations();
  }, [loadRegistrations]);

  async function handleActivate(id: number) {
    try {
      setBusyId(id);
      setError("");
      await approveRegistration(id);
      setRegistrations((current) => current.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to activate this user. Please try again.", "මෙම පරිශීලකයා සක්‍රිය කළ නොහැක. නැවත උත්සාහ කරන්න.")
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    if (!rejectReason.trim() || rejectReason.trim().length < 5) return;

    try {
      setBusyId(id);
      setError("");
      await rejectRegistration(id, rejectReason);
      setRegistrations((current) => current.filter((u) => u.id !== id));
      setRejectingId(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to reject this user. Please try again.", "මෙම පරිශීලකයා ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න.")
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5 bg-white rounded-2xl border border-slate-200/80">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>{t(lang, "Pending Verification", "සත්‍යාපනය බලා සිටී")}</span>
          {registrations.length > 0 && (
            <span className="text-[10px] font-extrabold font-mono bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full">
              {registrations.length}
            </span>
          )}
        </h3>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {registrations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t(lang, "No pending verifications.", "සත්‍යාපනය අපේක්ෂිත නැත.")}
          </p>
        </div>
      ) : (
        /* Pending Users Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {registrations.map((u) => {
            const info = displayInfo(u, lang);

            return (
              <div
                key={u.id}
                onClick={() => setViewingRegistration(u)}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all p-4 flex items-start gap-3.5 cursor-pointer group"
              >
                {/* User Avatar */}
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-amber-700 text-sm shrink-0 group-hover:scale-105 transition-transform">
                  {info.name[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {info.name}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">
                    {info.subtitle}
                  </p>
                  <p className="text-[10px] font-mono font-bold text-slate-400 mt-1">
                    @{u.username}
                  </p>
                </div>

                {/* Actions */}
                <div
                  className="flex flex-col gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => handleActivate(u.id)}
                    disabled={busyId === u.id}
                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    {busyId === u.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{t(lang, "Activate", "සක්‍රිය")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(u.id);
                      setRejectReason("");
                    }}
                    disabled={busyId === u.id}
                    className="h-8 px-3 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>{t(lang, "Reject", "ප්‍රතික්ෂේප")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Details Modal */}
      {viewingRegistration && (
        <UserDetailModal
          lang={lang}
          registration={viewingRegistration}
          onClose={() => setViewingRegistration(null)}
        />
      )}

      {/* Rejection Reason Modal */}
      {rejectingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => {
              setRejectingId(null);
              setRejectReason("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200/80 z-10 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Reject User", "පරිශීලකයා ප්‍රතික්ෂේප කරන්න")}
              </h4>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {t(
                  lang,
                  "Please enter the reason for rejecting this user registration.",
                  "මෙම පරිශීලක ලියාපදිංචිය ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න."
                )}
              </p>
            </div>

            <div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                minLength={5}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none placeholder:text-slate-400"
                placeholder={t(
                  lang,
                  "Enter rejection reason (minimum 5 characters)...",
                  "ප්‍රතික්ෂේප කිරීමේ හේතුව ඇතුළත් කරන්න (අවම අකුරු 5)..."
                )}
              />
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                disabled={busyId === rejectingId}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>

              <button
                type="button"
                onClick={() => handleReject(rejectingId)}
                disabled={rejectReason.trim().length < 5 || busyId === rejectingId}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyId === rejectingId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {t(lang, "Confirm Reject", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
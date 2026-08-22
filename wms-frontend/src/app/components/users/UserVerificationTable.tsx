import { useEffect, useState, useCallback } from "react";
import { UserCheck, UserX } from "lucide-react";
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
        t(lang, "Unable to load pending verifications.", "අපේක්ෂිත සත්‍යාපන පූරණය කළ නොහැක."),
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    loadRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleActivate(id: number) {
    try {
      setBusyId(id);
      setError("");
      await approveRegistration(id);
      setRegistrations((current) => current.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to activate this user. Please try again.", "මෙම පරිශීලකයා සක්‍රිය කළ නොහැක. නැවත උත්සාහ කරන්න."),
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
        t(lang, "Unable to reject this user. Please try again.", "මෙම පරිශීලකයා ප්‍රතික්ෂේප කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        {t(lang, "Loading…", "පූරණය වෙමින්…")}
      </p>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
        {t(lang, "Pending Verification", "සත්‍යාපනය බලා සිටී")}

        {registrations.length > 0 && (
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            {registrations.length}
          </span>
        )}
      </h3>

      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-300" />
          {t(lang, "No pending verifications.", "සත්‍යාපනය අපේක්ෂිත නැත.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {registrations.map((u) => {
            const info = displayInfo(u, lang);

            return (
              <div
                key={u.id}
                onClick={() => setViewingRegistration(u)}
                className="bg-white rounded-xl border border-amber-100 p-4 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-sm flex-shrink-0">
                  {info.name[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm">
                    {info.name}
                  </div>

                  <div className="text-xs text-gray-500">
                    {info.subtitle}
                  </div>

                  <div className="text-xs font-mono text-gray-400 mt-0.5">
                    @{u.username}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleActivate(u.id)}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                  >
                    <UserCheck className="w-3 h-3" />
                    {t(lang, "Activate", "සක්‍රිය")}
                  </button>

                  <button
                    onClick={() => {
                      setRejectingId(u.id);
                      setRejectReason("");
                    }}
                    disabled={busyId === u.id}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <UserX className="w-3 h-3" />
                    {t(lang, "Reject", "ප්‍රතික්ෂේප")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingRegistration && (
        <UserDetailModal
          lang={lang}
          registration={viewingRegistration}
          onClose={() => setViewingRegistration(null)}
        />
      )}

      {rejectingId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {t(lang, "Reject User", "පරිශීලකයා ප්‍රතික්ෂේප කරන්න")}
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              {t(
                lang,
                "Please enter the reason for rejecting this user registration.",
                "මෙම පරිශීලක ලියාපදිංචිය ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න.",
              )}
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              minLength={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              placeholder={t(lang, "Enter rejection reason (minimum 5 characters)...", "ප්‍රතික්ෂේප කිරීමේ හේතුව ඇතුළත් කරන්න (අවම අකුරු 5)...")}
            />

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectReason("");
                }}
                disabled={busyId === rejectingId}
                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>

              <button
                onClick={() => handleReject(rejectingId)}
                disabled={rejectReason.trim().length < 5 || busyId === rejectingId}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {t(lang, "Confirm Reject", "ප්‍රතික්ෂේප කිරීම තහවුරු කරන්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
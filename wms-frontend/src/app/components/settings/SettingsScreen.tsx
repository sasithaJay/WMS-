import { useEffect, useState } from "react";
import {
  User2Icon,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Camera,
  Save,
} from "lucide-react";
import { AxiosError } from "axios";
import { getCurrentUser, getProfilePicture, updatePassword, updateProfile } from "../../../services/authService";
import type { User } from "../../types/auth";
import { ProfilePictureCropper } from "./ProfilePictureCropper";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";

interface LaravelValidationErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function SettingsScreen({ lang, role }: { lang: Lang; role: Role }) {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null);
  const [savedPictureUrl, setSavedPictureUrl] = useState<string | null>(null);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [pictureToCrop, setPictureToCrop] = useState<File | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      setLoadingUser(true);
      const data = await getCurrentUser();
      setUser(data);
      setProfileName(data.staff_profile?.full_name ?? data.organization?.name ?? data.name ?? "");
      try {
        const picture = await getProfilePicture();
        setSavedPictureUrl(URL.createObjectURL(picture));
      } catch (pictureError) {
        if ((pictureError as AxiosError).response?.status !== 404) console.error(pictureError);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    if (!selectedPicture) {
      setPicturePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedPicture);
    setPicturePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedPicture]);

  useEffect(() => () => {
    if (savedPictureUrl) URL.revokeObjectURL(savedPictureUrl);
  }, [savedPictureUrl]);

  const profile = user?.staff_profile;
  const organization = user?.organization;

  const accountFields = profile
    ? [
        {
          label: t(lang, "Full Name", "සම්පූර්ණ නම"),
          value: profile?.full_name ?? "-",
        },
        {
          label: t(lang, "Username", "පරිශීලක නාමය"),
          value: user ? `@${user.username}` : "-",
        },
        {
          label: t(lang, "Role", "කාර්යභාරය"),
          value: profile?.role
            ? t(lang, profile.role.name_en, profile.role.name_si)
            : "-",
        },
        {
          label: t(lang, "Division", "කොට්ඨාශය"),
          value: profile?.division
            ? t(lang, profile.division.name_en, profile.division.name_si)
            : "-",
        },
        {
          label: t(lang, "Section", "අංශය"),
          value: profile?.section
            ? t(lang, profile.section.name_en, profile.section.name_si)
            : "-",
        },
        {
          label: t(lang, "NIC", "ජාතික හැඳුනුම්පත"),
          value: profile?.nic_number ?? "-",
        },
      ]
    : organization
    ? [
        {
          label: t(lang, "Organization Name", "ආයතන නාමය"),
          value: organization.name,
        },
        {
          label: t(lang, "Username", "පරිශීලක නාමය"),
          value: user ? `@${user.username}` : "-",
        },
        {
          label: t(lang, "Type", "වර්ගය"),
          value:
            organization.organization_kind === "INSTITUTION"
              ? t(lang, "Institution", "ආයතනය")
              : t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය"),
        },
        {
          label: t(lang, "Division", "කොට්ඨාශය"),
          value: organization.division
            ? t(
                lang,
                organization.division.name_en,
                organization.division.name_si
              )
            : "-",
        },
        {
          label: t(lang, "Address", "ලිපිනය"),
          value: organization.address ?? "-",
        },
        {
          label: t(lang, "Contact Number", "සම්බන්ධතා අංකය"),
          value: organization.contact_number ?? "-",
        },
      ]
    : [];

  async function handleUpdatePassword() {
    if (pwForm.next !== pwForm.confirm) return;

    try {
      setSubmitting(true);
      setPwError("");
      await updatePassword(pwForm.current, pwForm.next, pwForm.confirm);

      setSaved(true);
      setPwForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      const axiosErr = err as AxiosError<LaravelValidationErrorBody>;

      if (axiosErr.response?.status === 422 && axiosErr.response.data.errors) {
        const firstError = Object.values(axiosErr.response.data.errors)[0]?.[0];
        setPwError(
          firstError ??
            t(lang, "Unable to update password.", "මුරපදය යාවත්කාලීන කළ නොහැක.")
        );
      } else {
        console.error(err);
        setPwError(
          t(
            lang,
            "Unable to update password. Please try again.",
            "මුරපදය යාවත්කාලීන කළ නොහැක. නැවත උත්සාහ කරන්න."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProfile() {
    if (!profileName.trim()) return;

    const formData = new FormData();
    formData.append("name", profileName.trim());
    if (selectedPicture) formData.append("profile_picture", selectedPicture);

    try {
      setProfileSubmitting(true);
      setProfileError("");
      setProfileSaved(false);
      const response = await updateProfile(formData);
      setUser(response.user);
      setProfileName(response.user.staff_profile?.full_name ?? response.user.organization?.name ?? response.user.name ?? "");
      if (selectedPicture) {
        setSavedPictureUrl(URL.createObjectURL(selectedPicture));
      }
      setSelectedPicture(null);
      window.dispatchEvent(new Event("wms-profile-updated"));
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      const axiosErr = err as AxiosError<LaravelValidationErrorBody>;
      const validationMessage = Object.values(axiosErr.response?.data?.errors ?? {}).flat()[0];
      setProfileError(
        validationMessage ?? axiosErr.response?.data?.message ??
          t(lang, "Unable to update your profile. Please try again.", "ඔබගේ පැතිකඩ යාවත්කාලීන කළ නොහැක. නැවත උත්සාහ කරන්න."),
      );
    } finally {
      setProfileSubmitting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-stretch">
      {pictureToCrop && (
        <ProfilePictureCropper
          file={pictureToCrop}
          lang={lang}
          onCancel={() => setPictureToCrop(null)}
          onCrop={(croppedFile) => {
            setSelectedPicture(croppedFile);
            setPictureToCrop(null);
          }}
        />
      )}
      {/* ACCOUNT INFORMATION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <User2Icon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {t(lang, "Account Information", "ගිණුම් තොරතුරු")}
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {t(lang, "Your registered system profile details", "ඔබගේ ලියාපදිංචි පද්ධති පැතිකඩ තොරතුරු")}
              </p>
            </div>
          </div>

          {/* Fields Content */}
          {loadingUser ? (
            <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-4 bg-slate-200/70 rounded-md w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-500">
                  {picturePreview || savedPictureUrl ? (
                    <img src={picturePreview ?? savedPictureUrl ?? undefined} alt={t(lang, "Profile picture", "පැතිකඩ පින්තූරය")} className="h-full w-full object-cover" />
                  ) : (
                    profileName.trim().charAt(0).toUpperCase() || <User2Icon className="h-6 w-6" />
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                  <Camera className="h-4 w-4 text-blue-600" />
                  {t(lang, "Choose profile picture", "පැතිකඩ පින්තූරය තෝරන්න")}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPictureToCrop(file); event.target.value = ""; }} />
                </label>
                <span className="text-[11px] text-slate-400">{t(lang, "JPG, PNG or WebP, up to 5 MB", "JPG, PNG හෝ WebP, උපරිම 5 MB")}</span>
              </div>

              <div className="max-w-xl space-y-1.5">
                <label htmlFor="profile-name" className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  {profile ? t(lang, "Full Name", "සම්පූර්ණ නම") : t(lang, "Organization Name", "ආයතන නාමය")}
                </label>
                <input id="profile-name" value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={255} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
              </div>

              {profileError && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{profileError}</div>}
              {profileSaved && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />{t(lang, "Profile updated successfully.", "පැතිකඩ සාර්ථකව යාවත්කාලීන කරන ලදී.")}</div>}

              <div className="flex justify-end">
                <button type="button" onClick={handleUpdateProfile} disabled={profileSubmitting || !profileName.trim()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                  {profileSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {profileSubmitting ? t(lang, "Saving…", "සුරකිමින්…") : t(lang, "Save Profile", "පැතිකඩ සුරකින්න")}
                </button>
              </div>

              <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                {accountFields.slice(1).map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{f.label}</div>
                    <div className="text-xs font-bold text-slate-800 break-words">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informational Footer Banner */}
        <div className="p-5 pt-0 mt-auto">
          <div className="bg-blue-50/70 border border-blue-100/80 rounded-xl p-3 text-xs font-medium text-blue-800 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              {t(
                lang,
                "You can update your profile name and picture above.",
                "ගිණුම් තොරතුරු යාවත්කාලීන කිරීමට ඔබගේ දිව්‍යංශ පරිපාලක සම්බන්ධ කරගන්න."
              )}
            </span>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden h-full flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                {t(lang, "Change Password", "මුරපදය වෙනස් කරන්න")}
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {t(lang, "Update your account access password", "ඔබගේ ගිණුම් පිවිසුම් මුරපදය යාවත්කාලීන කරන්න")}
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {t(
                    lang,
                    "Password updated successfully.",
                    "මුරපදය සාර්ථකව යාවත්කාලීන කරන ලදි."
                  )}
                </span>
              </div>
            )}

            {pwError && (
              <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {/* Current Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Current Password", "වත්මන් මුරපදය")}
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={pwForm.current}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, current: e.target.value }))
                  }
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "New Password", "නව මුරපදය")}
              </label>
              <div className="relative">
                <input
                  type={showNext ? "text" : "password"}
                  value={pwForm.next}
                  onChange={(e) =>
                    setPwForm((f) => ({ ...f, next: e.target.value }))
                  }
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNext((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                >
                  {showNext ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                {t(lang, "Minimum 8 characters.", "අවම අකුරු 8 ක්.")}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Confirm New Password", "නව මුරපදය තහවුරු කරන්න")}
              </label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) =>
                  setPwForm((f) => ({ ...f, confirm: e.target.value }))
                }
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>

            {/* Match Warning */}
            {pwForm.next &&
              pwForm.confirm &&
              pwForm.next !== pwForm.confirm && (
                <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{t(lang, "Passwords do not match.", "මුරපද නොගැලපේ.")}</span>
                </p>
              )}
          </div>
        </div>

        {/* Submit Action Footer */}
        <div className="p-5 pt-0 mt-auto">
          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={
              submitting ||
              !pwForm.current ||
              !pwForm.next ||
              pwForm.next !== pwForm.confirm
            }
            className="w-full h-10 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t(lang, "Updating…", "යාවත්කාලීන කරමින්…")}</span>
              </>
            ) : (
              <span>{t(lang, "Update Password", "මුරපදය යාවත්කාලීන කරන්න")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { ROLE_LABELS } from "../../constants/roles";
import { t } from "../../constants/translations";
import { getRoleUserName } from "../../utils/roleHelpers";
import type { Lang, Role } from "../../types";

export function SettingsScreen({ lang, role }: { lang: Lang; role: Role }) {
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saved, setSaved] = useState(false);

  const userName = getRoleUserName(role);
  const roleLabel = ROLE_LABELS[role] ?? { en: role, si: role };

  const accountFields = [
    { label: t(lang, "Full Name", "සම්පූර්ණ නම"), value: userName },
    { label: t(lang, "Username", "පරිශීලක නාමය"), value: `@${userName.toLowerCase().replace(/\s+/g, ".")}` },
    { label: t(lang, "Role", "කාර්යභාරය"), value: t(lang, roleLabel.en, roleLabel.si) },
    { label: t(lang, "Division", "කොට්ඨාශය"), value: t(lang, "Social Services", "සමාජ සේවා") },
    { label: t(lang, "Section", "අංශය"), value: "Development" },
    { label: t(lang, "NIC", "ජාතික හැඳුනුම්පත"), value: "198745678901" },
  ];

  return (
    <div className="max-w-6xl grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-full min-h-[400px] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EBF4FD] flex items-center justify-center">
            <User className="w-5 h-5 text-[#4295D9]" />
          </div>

          <h3 className="font-semibold text-gray-900">
            {t(lang, "Account Information", "ගිණුම් තොරතුරු")}
          </h3>
        </div>

  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
    {accountFields.map((f) => (
      <div key={f.label}>
        <div className="text-xs font-medium text-gray-400 mb-0.5">
          {f.label}
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {f.value}
        </div>
      </div>
    ))}
  </div>

  <div className="px-6 pb-5 mt-auto">
    <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-600 flex items-center gap-2">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />

      {t(
        lang,
        "To update account details, contact your divisional administrator.",
        "ගිණුම් තොරතුරු යාවත්කාලීන කිරීමට ඔබගේ දිව්‍යංශ පරිපාලක සම්බන්ධ කරගන්න."
      )}
    </div>
  </div>
</div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden h-full">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#EBF4FD] flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#4295D9]" />
          </div>
          <h3 className="font-semibold text-gray-900">{t(lang, "Change Password", "මුරපදය වෙනස් කරන්න")}</h3>
        </div>
        <div className="p-6 space-y-4">
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {t(lang, "Password updated successfully.", "මුරපදය සාර්ථකව යාවත්කාලීන කරන ලදි.")}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "Current Password", "වත්මන් මුරපදය")}</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white pr-10" />
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "New Password", "නව මුරපදය")}</label>
            <div className="relative">
              <input type={showNext ? "text" : "password"} value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white pr-10" />
              <button type="button" onClick={() => setShowNext((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "Confirm New Password", "නව මුරපදය තහවුරු කරන්න")}</label>
            <input type="password" value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white" />
          </div>
          {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {t(lang, "Passwords do not match.", "මුරපද නොගැලපේ.")}
            </p>
          )}
          <div className="pt-1">
            <button
              onClick={() => { setSaved(true); setPwForm({ current: "", next: "", confirm: "" }); setTimeout(() => setSaved(false), 3000); }}
              disabled={!pwForm.current || !pwForm.next || pwForm.next !== pwForm.confirm}
              className="px-6 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t(lang, "Update Password", "මුරපදය යාවත්කාලීන කරන්න")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

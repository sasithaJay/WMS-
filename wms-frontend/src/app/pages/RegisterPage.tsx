import { useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle, User, Building2, FileText, AlertCircle, ShieldCheck } from "lucide-react";
import { LanguageToggle } from "../components/common/LanguageToggle";
import { SECTIONS_SS, SECTIONS_PC, JOB_ROLES, DISTRICTS } from "../constants/menuItems";
import { t } from "../constants/translations";
import type { Lang } from "../types";

export function RegisterPage({
  lang,
  setLang,
  onBack,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [division, setDivision] = useState<"ss" | "pc" | null>(null);
  const [accountType, setAccountType] = useState<"staff" | "institution" | "ds" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const steps = [
    t(lang, "Division", "කොට්ඨාශය"),
    t(lang, "Account Type", "ගිණුම් වර්ගය"),
    t(lang, "Details", "විස්තර"),
    t(lang, "Credentials", "අක්තපත්‍ර"),
  ];

  const field = (key: string, label: string, labelSi: string, type = "text", ph = "", phSi = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {t(lang, label, labelSi)}
      </label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={t(lang, ph || label, phSi || labelSi)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white"
      />
    </div>
  );

  const select = (key: string, label: string, labelSi: string, options: string[]) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {t(lang, label, labelSi)}
      </label>
      <select
        value={form[key] || ""}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 transition-all bg-gray-50 focus:bg-white appearance-none cursor-pointer"
      >
        <option value="">{t(lang, `Select ${label}`, `${labelSi} තෝරන්න`)}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" />
          {t(lang, "Back to Login", "ලොගින් වෙත ආපසු")}
        </button>
        <LanguageToggle lang={lang} setLang={setLang} />
      </div>

      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-[580px] bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Progress */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-5">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < step ? "bg-green-500 text-white" :
                    i === step ? "bg-[#4295D9] text-white" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-[#4295D9]" : i < step ? "text-green-600" : "text-gray-400"}`}>
                    {s}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={`h-px w-8 mx-1 hidden sm:block ${i < step ? "bg-green-400" : "bg-gray-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t(lang, "Create Account", "ගිණුම සාදන්න")}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{t(lang, `Step ${step + 1} of 4`, `පියවර ${step + 1} / 4`)}</p>
          </div>

          <div className="p-8">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">{t(lang, "Select the division you belong to:", "ඔබ අයත් කොට්ඨාශය තෝරන්න:")}</p>
                {[
                  { id: "ss" as const, title: t(lang, "Social Services Division", "සමාජ සේවා කොට්ඨාශය"), desc: t(lang, "Access to Social Services store and resources", "සමාජ සේවා ගබඩාවට ප්‍රවේශය"), icon: <User className="w-6 h-6" /> },
                  { id: "pc" as const, title: t(lang, "Probation & Child Care Division", "පරිවාස හා ළමා රැකවරණ කොට්ඨාශය"), desc: t(lang, "Access to Probation & Child Care store and resources", "පරිවාස ගබඩාවට ප්‍රවේශය"), icon: <Building2 className="w-6 h-6" /> },
                ].map((d) => (
                  <button key={d.id} onClick={() => setDivision(d.id)}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all flex items-start gap-4 ${division === d.id ? "border-[#4295D9] bg-[#EBF4FD]" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${division === d.id ? "bg-[#4295D9] text-white" : "bg-gray-100 text-gray-500"}`}>{d.icon}</div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{d.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{d.desc}</div>
                    </div>
                    {division === d.id && <CheckCircle className="w-5 h-5 text-[#4295D9] ml-auto flex-shrink-0 mt-0.5" />}
                  </button>
                ))}
                {division && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                    {division === "ss"
                      ? t(lang, "You will have access to the Social Services store (2 institutions).", "ඔබට සමාජ සේවා ගබඩාවට ප්‍රවේශය ලැබෙනු ඇත (ආයතන 2).")
                      : t(lang, "You will have access to the Probation & Child Care store (17 institutions).", "ඔබට පරිවාස ගබඩාවට ප්‍රවේශය ලැබෙනු ඇත (ආයතන 17).")}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">{t(lang, "Select your account type:", "ඔබගේ ගිණුම් වර්ගය තෝරන්න:")}</p>
                {[
                  { id: "staff" as const, icon: <User className="w-5 h-5" />, title: t(lang, "Staff Member", "කාර්ය මණ්ඩල සාමාජිකයා"), desc: t(lang, "Department officer or employee", "දෙපාර්තමේන්තු නිලධාරී හෝ සේවකයා") },
                  { id: "institution" as const, icon: <Building2 className="w-5 h-5" />, title: t(lang, "Institution", "ආයතනය"), desc: t(lang, "Children's home, remand home — recommended by AO", "ළමා නිවාස, රිමාන්ඩ් නිවාස") },
                  { id: "ds" as const, icon: <FileText className="w-5 h-5" />, title: t(lang, "Divisional Secretary Office", "දිස්ත්‍රික් ලේකම් කාර්යාලය"), desc: t(lang, "One of 50 DS offices — recommended by AO", "DS කාර්යාල 50 න් එකක්") },
                ].map((a) => (
                  <button key={a.id} onClick={() => setAccountType(a.id)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${accountType === a.id ? "border-[#4295D9] bg-[#EBF4FD]" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accountType === a.id ? "bg-[#4295D9] text-white" : "bg-gray-100 text-gray-500"}`}>{a.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{a.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{a.desc}</div>
                    </div>
                    {accountType === a.id && <CheckCircle className="w-5 h-5 text-[#4295D9]" />}
                  </button>
                ))}
                {accountType && accountType !== "staff" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                    {t(lang, "Institution and DS office requests must be recommended by the Administrative Officer (AO).", "ආයතන හා DS ඉල්ලීම් ව්‍යවස්ථාපිත නිලධාරී (AO) විසින් නිර්දේශ කළ යුතුය.")}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {accountType === "staff" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {field("fullName", "Full Name", "සම්පූර්ණ නම")}
                      {field("nic", "NIC Number", "ජාතික හැඳුනුම්පත් අංකය")}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {field("email", "Email", "විද්‍යුත් තැපෑල", "email")}
                      {field("phone", "Phone", "දුරකථනය", "tel")}
                    </div>
                    {select("section", "Section", "අංශය", division === "ss" ? SECTIONS_SS : SECTIONS_PC)}
                    {select("jobRole", "Job Role", "රැකියා කාර්යභාරය", JOB_ROLES)}
                    {field("empId", "Employee ID", "සේවක ID")}
                  </>
                )}
                {accountType === "institution" && (
                  <>
                    {field("instName", "Institution Name", "ආයතනයේ නම")}
                    {select("instType", "Institution Type", "ආයතන වර්ගය", ["Children's Home", "Remand Home", "Observation Home", "Other"])}
                    <div className="grid grid-cols-2 gap-4">
                      {field("licence", "Licence Number", "බලපත්‍ර අංකය")}
                      {select("district", "District", "දිස්ත්‍රික්කය", DISTRICTS)}
                    </div>
                    {field("address", "Address", "ලිපිනය")}
                    {field("contact", "Institution Contact", "ආයතන සම්බන්ධතා")}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t(lang, "Authorised Contact Person", "බලයලත් සම්බන්ධතා පුද්ගලයා")}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {field("cpName", "Full Name", "සම්පූර්ණ නම")}
                        {field("cpDesig", "Designation", "තනතුර")}
                        {field("cpNic", "NIC", "ජාතික හැඳුනුම්පත")}
                        {field("cpPhone", "Phone", "දුරකථනය", "tel")}
                      </div>
                      {field("cpEmail", "Email", "විද්‍යුත් තැපෑල", "email")}
                    </div>
                  </>
                )}
                {accountType === "ds" && (
                  <>
                    {select("dsOffice", "DS Office / Division", "DS කාර්යාලය / කොට්ඨාශය", ["Galle DS Office", "Matara DS Office", "Hambantota DS Office", "Hakmana DS Office", "Akuressa DS Office", "Walasmulla DS Office"])}
                    {select("district", "District", "දිස්ත්‍රික්කය", DISTRICTS)}
                    {field("officeAddress", "Office Address", "කාර්යාල ලිපිනය")}
                    {field("officeContact", "Office Contact Number", "කාර්යාල සම්බන්ධතා", "tel")}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t(lang, "Authorised Contact Person", "බලයලත් සම්බන්ධතා පුද්ගලයා")}</p>
                      <div className="grid grid-cols-2 gap-4">
                        {field("cpName", "Full Name", "සම්පූර්ණ නම")}
                        {field("cpDesig", "Designation", "තනතුර")}
                        {field("cpNic", "NIC", "ජාතික හැඳුනුම්පත")}
                        {field("cpPhone", "Phone", "දුරකථනය", "tel")}
                      </div>
                      {field("cpEmail", "Email", "විද්‍යුත් තැපෑල", "email")}
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {field("username", "Username", "පරිශීලක නාමය")}
                {field("password", "Password", "මුරපදය", "password")}
                {field("confirmPassword", "Confirm Password", "මුරපදය තහවුරු කරන්න", "password")}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {t(lang, "Your account will be inactive until verified and activated by the Commissioner.", "ඔබගේ ගිණුම කොමසාරිස්වරයා විසින් සත්‍යාපනය කර සක්‍රිය කිරීම දක්වා අක්‍රිය වනු ඇත.")}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="px-8 pb-8 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {t(lang, "Previous", "කලින්")}
            </button>
            <button
              onClick={() => { if (step < 3) setStep((s) => s + 1); }}
              className="px-6 py-2.5 bg-[#4295D9] text-white rounded-xl text-sm font-semibold hover:bg-[#3280C4] transition-all flex items-center gap-2"
            >
              {step < 3 ? t(lang, "Continue", "ඉදිරියට") : t(lang, "Submit", "ඉදිරිපත් කරන්න")}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

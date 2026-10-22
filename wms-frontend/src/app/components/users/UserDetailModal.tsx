import { X, User, Building2, IdCard, Phone, Mail, Hash, Shield, MapPin } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { PendingRegistration } from "../../../services/userService";

export function UserDetailModal({
  lang,
  registration,
  onClose,
}: {
  lang: Lang;
  registration: PendingRegistration;
  onClose: () => void;
}) {
  const staff = registration.staff_profile;
  const org = registration.organization;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              {staff ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Registration Details", "ලියාපදිංචි විස්තර")}
              </h3>
              <p className="text-[10px] font-mono font-bold text-slate-400">
                @{registration.username}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* STAFF DETAILS */}
          {staff && (
            <div className="space-y-3">
              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t(lang, "Full Name", "සම්පූර්ණ නම")}
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {staff.full_name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <IdCard className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "NIC", "ජාතික හැඳුනුම්පත")}
                  </span>
                  <p className="font-mono font-bold text-slate-800">
                    {staff.nic_number || "—"}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Phone", "දුරකථනය")}
                  </span>
                  <p className="font-mono font-bold text-slate-800">
                    {staff.phone || "—"}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <Hash className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Employee No.", "සේවක අංකය")}
                  </span>
                  <p className="font-mono font-bold text-slate-800">
                    {staff.employee_number || "—"}
                  </p>
                </div>

                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Role", "කාර්යභාරය")}
                  </span>
                  <p className="font-bold text-slate-800 truncate">
                    {staff.role ? t(lang, staff.role.name_en, staff.role.name_si) : "—"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {t(lang, "Division", "කොට්ඨාශය")}
                </span>
                <p className="font-bold text-slate-800">
                  {staff.division ? t(lang, staff.division.name_en, staff.division.name_si) : "—"}
                </p>
              </div>
            </div>
          )}

          {/* ORGANIZATION DETAILS */}
          {org && (
            <div className="space-y-3">
              <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t(lang, "Organization", "ආයතනය")}
                </span>
                <p className="text-sm font-bold text-slate-900">
                  {org.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Type", "වර්ගය")}
                  </span>
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                    {org.organization_kind}
                  </span>
                </div>

                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Contact No.", "සම්බන්ධතා අංකය")}
                  </span>
                  <p className="font-mono font-bold text-slate-800 truncate">
                    {org.contact_number || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {t(lang, "Division", "කොට්ඨාශය")}
                </span>
                <p className="font-bold text-slate-800">
                  {org.division ? t(lang, org.division.name_en, org.division.name_si) : "—"}
                </p>
              </div>

              {org.address && (
                <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {t(lang, "Address", "ලිපිනය")}
                  </span>
                  <p className="font-medium text-slate-800 leading-relaxed">
                    {org.address}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {t(lang, "Close", "වසා දමන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}

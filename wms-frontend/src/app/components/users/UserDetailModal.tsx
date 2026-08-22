

import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <h3 className="text-base font-semibold text-gray-900">
            {t(lang, "Registration Details", "ලියාපදිංචි විස්තර")}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div>
            <p className="text-xs text-gray-500">{t(lang, "Username", "පරිශීලක නාමය")}</p>
            <p className="text-sm font-mono text-gray-900">@{registration.username}</p>
          </div>

          {staff && (
            <>
              <div><p className="text-xs text-gray-500">{t(lang, "Full Name", "සම්පූර්ණ නම")}</p><p className="text-sm font-medium text-gray-900">{staff.full_name}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "NIC", "ජාතික හැඳුනුම්පත")}</p><p className="text-sm text-gray-900">{staff.nic_number}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Phone", "දුරකථනය")}</p><p className="text-sm text-gray-900">{staff.phone}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Employee Number", "සේවක අංකය")}</p><p className="text-sm text-gray-900">{staff.employee_number}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Role", "කාර්යභාරය")}</p><p className="text-sm text-gray-900">{staff.role ? t(lang, staff.role.name_en, staff.role.name_si) : "-"}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Division", "කොට්ඨාශය")}</p><p className="text-sm text-gray-900">{staff.division ? t(lang, staff.division.name_en, staff.division.name_si) : "-"}</p></div>
            </>
          )}

          {org && (
            <>
              <div><p className="text-xs text-gray-500">{t(lang, "Organization", "ආයතනය")}</p><p className="text-sm font-medium text-gray-900">{org.name}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Type", "වර්ගය")}</p><p className="text-sm text-gray-900">{org.organization_kind}</p></div>
              <div><p className="text-xs text-gray-500">{t(lang, "Division", "කොට්ඨාශය")}</p><p className="text-sm text-gray-900">{org.division ? t(lang, org.division.name_en, org.division.name_si) : "-"}</p></div>
              {org.address && <div><p className="text-xs text-gray-500">{t(lang, "Address", "ලිපිනය")}</p><p className="text-sm text-gray-900">{org.address}</p></div>}
              {org.contact_number && <div><p className="text-xs text-gray-500">{t(lang, "Contact Number", "සම්බන්ධතා අංකය")}</p><p className="text-sm text-gray-900">{org.contact_number}</p></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
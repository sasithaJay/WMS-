import { useState } from "react";
import { Search, X, Save, UserPen } from "lucide-react";
import { ACTIVE_USERS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

type UserType = "all" | "staff" | "institution" | "ds";

export function UserManagementTable({ lang }: { lang: Lang }) {
  const [filter, setFilter] = useState<UserType>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(ACTIVE_USERS);

  const typeLabel: Record<UserType, string> = {
    all: t(lang, "All Types", "සියලු"),
    staff: t(lang, "Staff", "කාර්ය මණ්ඩලය"),
    institution: t(lang, "Institution", "ආයතනය"),
    ds: t(lang, "DS Office", "DS කාර්යාලය"),
  };

  const activeFiltered = users.filter(
    (u) =>
      (filter === "all" ||
        (filter === "staff" && !["Institution", "DS Office"].includes(u.role)) ||
        (filter === "institution" && u.role === "Institution") ||
        (filter === "ds" && u.role === "DS Office")) &&
      (u.name.toLowerCase().includes(search.toLowerCase()) || u.role.toLowerCase().includes(search.toLowerCase()))
  );

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    name: "",
    role: "",
    division: "",
    section: "",
    status: "",
  });

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      name: user.name,
      role: user.role,
      division: user.division,
      section: user.section,
      status: user.status,
    });
  };

  const closeEditModal = () => {
    setEditingUser(null);
  };

  const handleSaveUser = () => {
    if (!editForm.name.trim()) {
      alert(t(lang, "Name is required.", "නම අවශ්‍යයි."));
      return;
    }

    console.log({
      action: "UPDATE_USER",
      oldUser: editingUser,
      updatedUser: editForm,
    });

    setEditingUser(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "Search users…", "පරිශීලකයන් සෙවීම…")}
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "staff", "institution", "ds"] as UserType[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {typeLabel[f]}
            </button>
          ))}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        {t(lang, "Active Users", "සක්‍රිය පරිශීලකයන්")}
      </h3>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Name", "නාමය"), t(lang, "Role", "කාර්යභාරය"), t(lang, "Division", "කොට්ඨාශය"), t(lang, "Section", "අංශය"), t(lang, "Status", "තත්ත්වය"), ""].map((h, i) => (
                <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activeFiltered.map((u) => (
              <tr key={u.username} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3.5 text-gray-600 text-xs">{u.role}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{u.division}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-500 text-xs">{u.section}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.status === "active" ? t(lang, "Active", "සක්‍රිය") : t(lang, "Inactive", "අක්‍රිය")}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => openEditModal(u)}
                    className="text-xs text-[#4295D9] font-medium hover:underline"
                  >
                    {t(lang, "Edit", "සංස්කරණය")}
                  </button>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">

                    <button
                      onClick={() => {
                        setUsers((prev) =>
                          prev.map((item) =>
                            item.username === u.username
                              ? {
                                  ...item,
                                  status: item.status === "active" ? "inactive" : "active",
                                }
                              : item
                          )
                        );
                      }}
                      className={`text-xs font-medium hover:underline ${
                        u.status === "active" ? "text-amber-600" : "text-green-600"
                      }`}
                    >
                      {u.status === "active"
                        ? t(lang, "Deactivate", "අක්‍රිය කරන්න")
                        : t(lang, "Activate", "සක්‍රිය කරන්න")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBF4FD] flex items-center justify-center">
                  <UserPen className="w-5 h-5 text-[#4295D9]" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    {t(lang, "Edit User Details", "පරිශීලක තොරතුරු සංස්කරණය")}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {t(lang, "Update role, division, section and account status.", "කාර්යභාරය, කොට්ඨාශය, අංශය සහ ගිණුම් තත්ත්වය යාවත්කාලීන කරන්න.")}
                  </p>
                </div>
              </div>

              <button
                onClick={closeEditModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-[#4295D9]">
                  {editingUser.name[0]}
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {editingUser.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {editingUser.role} · {editingUser.division}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Full Name", "සම්පූර්ණ නම")}
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Role", "කාර්යභාරය")}
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, role: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                  >
                    <option value="Commissioner">Commissioner</option>
                    <option value="Assistant Commissioner">Assistant Commissioner</option>
                    <option value="Assistant Director">Assistant Director</option>
                    <option value="Administrative Officer">Administrative Officer</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Development Officer">Development Officer</option>
                    <option value="Store Keeper">Store Keeper</option>
                    <option value="Institution">Institution</option>
                    <option value="DS Office">DS Office</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Division", "කොට්ඨාශය")}
                  </label>
                  <select
                    value={editForm.division}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, division: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                  >
                    <option value="SS">SS</option>
                    <option value="PC">PC</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Section", "අංශය")}
                  </label>
                  <input
                    value={editForm.section}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, section: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Account Status", "ගිණුම් තත්ත්වය")}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                  >
                    <option value="active">{t(lang, "Active", "සක්‍රිය")}</option>
                    <option value="inactive">{t(lang, "Inactive", "අක්‍රිය")}</option>
                    <option value="suspended">{t(lang, "Suspended", "අත්හිටුවා ඇත")}</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                {t(
                  lang,
                  "Changing a user's role or division can affect what they can access in the system.",
                  "පරිශීලකයාගේ කාර්යභාරය හෝ කොට්ඨාශය වෙනස් කිරීමෙන් ඔහුට පද්ධතියේ ප්‍රවේශ විය හැකි කොටස් වෙනස් විය හැකිය."
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-white transition-all"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>

              <button
                onClick={handleSaveUser}
                className="flex items-center gap-2 px-5 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
              >
                <Save className="w-4 h-4" />
                {t(lang, "Save Changes", "වෙනස්කම් සුරකින්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

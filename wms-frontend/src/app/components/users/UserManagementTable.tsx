import { useEffect, useState, useCallback } from "react";
import { Search, X, Save, UserPen } from "lucide-react";
import api from "../../../api/axios";
import { getActiveUsers, updateUser } from "../../../services/userManagementService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { AdminUser } from "../../types/userManagement";

type UserType = "all" | "staff" | "institution";

interface OptionItem {
  id: number;
  code?: string;
  name_en: string;
  name_si: string;
}

interface EditForm {
  full_name: string;
  email: string;
  phone: string;
  role_id: string;
  division_id: string;
  section_id: string;
  account_status: "ACTIVE" | "SUSPENDED";
}

export function UserManagementTable({ lang }: { lang: Lang }) {
  const [filter, setFilter] = useState<UserType>("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const [roles, setRoles] = useState<OptionItem[]>([]);
  const [divisions, setDivisions] = useState<OptionItem[]>([]);
  const [sections, setSections] = useState<OptionItem[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: "",
    role_id: "",
    division_id: "",
    section_id: "",
    email: "",
    phone: "",
    account_status: "ACTIVE",
  });
  const [editError, setEditError] = useState("");

  const editingRoleCode = editingUser?.staff_profile?.role?.code ?? null;
  const isAdminUser = editingRoleCode === "ADMIN";
  const isCommissionerUser = editingRoleCode === "COMMISSIONER";
  const isRegularStaff = editingUser?.account_type === "STAFF" && !isAdminUser && !isCommissionerUser;

  useEffect(() => {
    api.get("/registration-options").then((res) => {
      setRoles(res.data.roles);
      setDivisions(res.data.divisions);
    }).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!editingUser || !isRegularStaff || !editForm.division_id) {
      setSections([]);
      return;
    }

    setLoadingSections(true);
    api.get("/registration-options/sections", { params: { division_id: editForm.division_id } })
      .then((res) => setSections(res.data.sections))
      .catch((err) => console.error(err))
      .finally(() => setLoadingSections(false));
  }, [editForm.division_id, editingUser, isRegularStaff]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getActiveUsers({
        type: filter === "all" ? undefined : filter,
        search: search.trim() || undefined,
        per_page: 100,
      });
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load users.", "පරිශීලකයන් පූරණය කළ නොහැක."));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, lang]);

  useEffect(() => {
    const timeout = setTimeout(loadUsers, 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  const typeLabel: Record<UserType, string> = {
    all: t(lang, "All Types", "සියලු"),
    staff: t(lang, "Staff", "කාර්ය මණ්ඩලය"),
    institution: t(lang, "Institution", "ආයතනය"),
  };

  function displayName(u: AdminUser): string {
    return u.staff_profile?.full_name ?? u.organization?.name ?? u.username;
  }

  function displayRole(u: AdminUser): string {
    if (u.staff_profile?.role) return t(lang, u.staff_profile.role.name_en, u.staff_profile.role.name_si);
    if (u.organization) {
      return u.organization.organization_kind === "INSTITUTION"
        ? t(lang, "Institution", "ආයතනය")
        : t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය");
    }
    return u.account_type;
  }

  function displayDivision(u: AdminUser): string {
    const division = u.staff_profile?.division ?? u.organization?.division;
    return division ? t(lang, division.name_en, division.name_si) : "-";
  }

  function displaySection(u: AdminUser): string {
    return u.staff_profile?.section ? t(lang, u.staff_profile.section.name_en, u.staff_profile.section.name_si) : "-";
  }

  function openEditModal(user: AdminUser) {
    setEditingUser(user);
    setEditError("");
    setEditForm({
      full_name: displayName(user),
      email: user.email ?? "",
      phone: user.staff_profile?.phone ?? user.organization?.contact_number ?? "",
      role_id: user.staff_profile?.role ? String(user.staff_profile.role.id) : "",
      division_id: (user.staff_profile?.division ?? user.organization?.division)
        ? String((user.staff_profile?.division ?? user.organization?.division)!.id)
        : "",
      section_id: user.staff_profile?.section ? String(user.staff_profile.section.id) : "",
      account_status: user.account_status,
    });
  }

  function closeEditModal() {
    setEditingUser(null);
  }

  function handleDivisionChange(newDivisionId: string) {
    setEditForm((f) => ({ ...f, division_id: newDivisionId, section_id: "" }));
  }

  async function handleSaveUser() {
  if (!editingUser) return;

  if (!editForm.full_name.trim()) {
    setEditError(t(lang, "Name is required.", "නම අවශ්‍යයි."));
    return;
  }

  if (isRegularStaff) {
    if (!editForm.role_id) {
      setEditError(t(lang, "Please select a role.", "කරුණාකර භූමිකාවක් තෝරන්න."));
      return;
    }
    if (!editForm.division_id) {
      setEditError(t(lang, "Please select a division.", "කරුණාකර කොට්ඨාශයක් තෝරන්න."));
      return;
    }
  }

  try {
    setBusyId(editingUser.id);
    setEditError("");

    const basePayload = {
      full_name: editForm.full_name.trim(),
      email: editForm.email.trim() || null,
      phone: editForm.phone.trim() || null,
    };

    if (isAdminUser) {
      // Admin: name + email + phone only, no status/role/division.
      await updateUser(editingUser.id, basePayload);
    } else if (isCommissionerUser) {
      // Commissioner: name + email + phone + status, no role/division/section.
      await updateUser(editingUser.id, {
        ...basePayload,
        account_status: editForm.account_status,
      });
    } else if (isRegularStaff) {
      await updateUser(editingUser.id, {
        ...basePayload,
        account_status: editForm.account_status,
        role_id: Number(editForm.role_id),
        division_id: Number(editForm.division_id),
        section_id: editForm.section_id ? Number(editForm.section_id) : null,
      });
    } else {
      // Institution / DS Office
      await updateUser(editingUser.id, {
        ...basePayload,
        account_status: editForm.account_status,
        division_id: editForm.division_id ? Number(editForm.division_id) : undefined,
      });
    }

    setEditingUser(null);
    loadUsers();
  } catch (err) {
    console.error(err);
    setEditError(t(lang, "Unable to save changes. Please try again.", "වෙනස්කම් සුරැකිය නොහැක. නැවත උත්සාහ කරන්න."));
  } finally {
    setBusyId(null);
  }
}

  async function handleToggleStatus(user: AdminUser) {
    const roleCode = user.staff_profile?.role?.code;
    if (roleCode === "ADMIN") return; // admins never toggled from this table

    try {
      setBusyId(user.id);
      const nextStatus = user.account_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      await updateUser(user.id, { account_status: nextStatus });
      setUsers((current) => current.map((u) => (u.id === user.id ? { ...u, account_status: nextStatus } : u)));
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to update status. Please try again.", "තත්ත්වය යාවත්කාලීන කළ නොහැක. නැවත උත්සාහ කරන්න."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "Search users…", "පරිශීලකයන් සෙවීම…")}
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(["all", "staff", "institution"] as UserType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {typeLabel[f]}
            </button>
          ))}
        </div>
      </div>

      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
        {t(lang, "Active Users", "සක්‍රිය පරිශීලකයන්")}
      </h3>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                t(lang, "Name", "නාමය"),
                t(lang, "Role", "කාර්යභාරය"),
                t(lang, "Division", "කොට්ඨාශය"),
                t(lang, "Section", "අංශය"),
                t(lang, "Status", "තත්ත්වය"),
                "",
                "",
              ].map((h, i) => (
                <th key={i} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                  {t(lang, "Loading…", "පූරණය වෙමින්…")}
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-gray-400">
                  {t(lang, "No users found.", "පරිශීලකයන් හමු නොවීය.")}
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u) => {
                const roleCode = u.staff_profile?.role?.code;
                const isAdminRow = roleCode === "ADMIN";

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{displayName(u)}</td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{displayRole(u)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {displayDivision(u)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{displaySection(u)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          u.account_status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {u.account_status === "ACTIVE" ? t(lang, "Active", "සක්‍රිය") : t(lang, "Suspended", "අත්හිටුවා ඇත")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEditModal(u)}
                        disabled={busyId === u.id}
                        className="text-xs text-[#4295D9] font-medium hover:underline disabled:opacity-50"
                      >
                        {t(lang, "Edit", "සංස්කරණය")}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      {!isAdminRow && (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={busyId === u.id}
                          className={`text-xs font-medium hover:underline disabled:opacity-50 ${
                            u.account_status === "ACTIVE" ? "text-amber-600" : "text-green-600"
                          }`}
                        >
                          {u.account_status === "ACTIVE"
                            ? t(lang, "Deactivate", "අක්‍රිය කරන්න")
                            : t(lang, "Activate", "සක්‍රිය කරන්න")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                    {isAdminUser
                      ? t(lang, "Only the name can be updated for this account.", "මෙම ගිණුම සඳහා නම පමණක් යාවත්කාලීන කළ හැක.")
                      : isCommissionerUser
                        ? t(lang, "Only name and account status can be updated.", "නම සහ ගිණුම් තත්ත්වය පමණක් යාවත්කාලීන කළ හැක.")
                        : t(lang, "Update details and account status.", "විස්තර සහ ගිණුම් තත්ත්වය යාවත්කාලීන කරන්න.")}
                  </p>
                </div>
              </div>
              <button onClick={closeEditModal} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{editError}</div>
              )}

              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-bold text-[#4295D9]">
                  {editForm.full_name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">@{editingUser.username}</div>
                  <div className="text-xs text-gray-400">{displayRole(editingUser)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Full Name", "සම්පූර්ණ නම")}
                  </label>
                  <input
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, full_name: e.target.value }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Email", "විද්‍යුත් තැපෑල")}
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder={t(lang, "Optional", "අවශ්‍ය නම්")}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                    {t(lang, "Phone Number", "දුරකථන අංකය")}
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t(lang, "Optional", "අවශ්‍ය නම්")}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                  />
                </div>

                {isRegularStaff && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        {t(lang, "Role", "කාර්යභාරය")}
                      </label>
                      <select
                        value={editForm.role_id}
                        onChange={(e) => setEditForm((f) => ({ ...f, role_id: e.target.value }))}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                      >
                        <option value="">{t(lang, "Select role…", "භූමිකාව තෝරන්න…")}</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {t(lang, r.name_en, r.name_si)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        {t(lang, "Division", "කොට්ඨාශය")}
                      </label>
                      <select
                        value={editForm.division_id}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                      >
                        <option value="">{t(lang, "Select division…", "කොට්ඨාශය තෝරන්න…")}</option>
                        {divisions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {t(lang, d.name_en, d.name_si)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        {t(lang, "Section", "අංශය")}
                      </label>
                      <select
                        value={editForm.section_id}
                        onChange={(e) => setEditForm((f) => ({ ...f, section_id: e.target.value }))}
                        disabled={!editForm.division_id || loadingSections}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white disabled:opacity-50"
                      >
                        <option value="">
                          {loadingSections
                            ? t(lang, "Loading…", "පූරණය වෙමින්…")
                            : t(lang, "None / not applicable", "නැත")}
                        </option>
                        {sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            {t(lang, s.name_en, s.name_si)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {!isRegularStaff && !isAdminUser && editingUser.account_type !== "STAFF" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      {t(lang, "Division", "කොට්ඨාශය")}
                    </label>
                    <select
                      value={editForm.division_id}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                    >
                      <option value="">{t(lang, "Select division…", "කොට්ඨාශය තෝරන්න…")}</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {t(lang, d.name_en, d.name_si)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!isAdminUser && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      {t(lang, "Account Status", "ගිණුම් තත්ත්වය")}
                    </label>
                    <select
                      value={editForm.account_status}
                      onChange={(e) => setEditForm((f) => ({ ...f, account_status: e.target.value as "ACTIVE" | "SUSPENDED" }))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white"
                    >
                      <option value="ACTIVE">{t(lang, "Active", "සක්‍රිය")}</option>
                      <option value="SUSPENDED">{t(lang, "Suspended", "අත්හිටුවා ඇත")}</option>
                    </select>
                  </div>
                )}
              </div>

              {isRegularStaff && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                  {t(
                    lang,
                    "Changing a user's role or division can affect what they can access in the system.",
                    "පරිශීලකයාගේ කාර්යභාරය හෝ කොට්ඨාශය වෙනස් කිරීමෙන් ඔහුට පද්ධතියේ ප්‍රවේශ විය හැකි කොටස් වෙනස් විය හැකිය.",
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={closeEditModal} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-white transition-all">
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>
              <button
                onClick={handleSaveUser}
                disabled={busyId === editingUser.id}
                className="flex items-center gap-2 px-5 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {busyId === editingUser.id ? t(lang, "Saving…", "සුරකිමින්…") : t(lang, "Save Changes", "වෙනස්කම් සුරකින්න")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
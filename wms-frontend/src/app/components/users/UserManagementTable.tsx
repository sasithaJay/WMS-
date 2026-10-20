import { useEffect, useState, useCallback } from "react";
import { Search, X, Save, UserPen, Loader2, AlertCircle, User, ShieldAlert } from "lucide-react";
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
  nic_number: string;
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
    nic_number: "",
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
      nic_number: user.staff_profile?.nic_number ?? "",
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
        ...(editingUser.account_type === "STAFF" ? { nic_number: editForm.nic_number.trim() } : {}),
      };

      if (isAdminUser) {
        await updateUser(editingUser.id, basePayload);
      } else if (isCommissionerUser) {
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
    if (roleCode === "ADMIN") return;

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
    <div className="space-y-4 sm:space-y-6">
      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(lang, "Search users…", "පරිශීලකයන් සෙවීම…")}
            className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0">
          {(["all", "staff", "institution"] as UserType[]).map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === f
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {typeLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t(lang, "Active Users", "සක්‍රිය පරිශීලකයන්")}</span>
        </h3>
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* USERS DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 whitespace-nowrap">{t(lang, "Name", "නාමය")}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t(lang, "Role", "කාර්යභාරය")}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t(lang, "Division", "කොට්ඨාශය")}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t(lang, "Section", "අංශය")}</th>
                <th className="px-5 py-3.5 whitespace-nowrap">{t(lang, "Status", "තත්ත්වය")}</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap">{t(lang, "Actions", "ක්‍රියාමාර්ග")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="font-semibold">{t(lang, "Loading…", "පූරණය වෙමින්…")}</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    {t(lang, "No users found.", "පරිශීලකයන් හමු නොවීය.")}
                  </td>
                </tr>
              )}

              {!loading &&
                users.map((u) => {
                  const roleCode = u.staff_profile?.role?.code;
                  const isAdminRow = roleCode === "ADMIN";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div>{displayName(u)}</div>
                        <div className="font-mono text-[10px] text-slate-400 font-semibold">@{u.username}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-semibold">{displayRole(u)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                          {displayDivision(u)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">{displaySection(u)}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            u.account_status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200/80"
                          }`}
                        >
                          {u.account_status === "ACTIVE"
                            ? t(lang, "Active", "සක්‍රිය")
                            : t(lang, "Suspended", "අත්හිටුවා ඇත")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            disabled={busyId === u.id}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
                          >
                            {t(lang, "Edit", "සංස්කරණය")}
                          </button>

                          {!isAdminRow && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u)}
                              disabled={busyId === u.id}
                              className={`text-xs font-bold cursor-pointer disabled:opacity-50 ${
                                u.account_status === "ACTIVE"
                                  ? "text-amber-600 hover:text-amber-700"
                                  : "text-emerald-600 hover:text-emerald-700"
                              }`}
                            >
                              {u.account_status === "ACTIVE"
                                ? t(lang, "Deactivate", "අක්‍රිය කරන්න")
                                : t(lang, "Activate", "සක්‍රිය කරන්න")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (<md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">{t(lang, "Loading…", "පූරණය වෙමින්…")}</span>
            </div>
          )}

          {!loading && users.length === 0 && (
            <div className="p-8 text-center text-xs font-medium text-slate-400">
              {t(lang, "No users found.", "පරිශීලකයන් හමු නොවීය.")}
            </div>
          )}

          {!loading &&
            users.map((u) => {
              const roleCode = u.staff_profile?.role?.code;
              const isAdminRow = roleCode === "ADMIN";

              return (
                <div key={u.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                        {displayName(u)[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{displayName(u)}</h4>
                        <p className="font-mono text-[10px] font-bold text-slate-400">@{u.username}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        u.account_status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                          : "bg-slate-100 text-slate-600 border-slate-200/80"
                      }`}
                    >
                      {u.account_status === "ACTIVE"
                        ? t(lang, "Active", "සක්‍රිය")
                        : t(lang, "Suspended", "අත්හිටුවා ඇත")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 block font-medium">{t(lang, "Role", "කාර්යභාරය")}</span>
                      <span className="font-bold text-slate-800">{displayRole(u)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">{t(lang, "Division", "කොට්ඨාශය")}</span>
                      <span className="font-bold text-slate-800">{displayDivision(u)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(u)}
                      disabled={busyId === u.id}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
                    >
                      {t(lang, "Edit", "සංස්කරණය")}
                    </button>

                    {!isAdminRow && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u)}
                        disabled={busyId === u.id}
                        className={`text-xs font-bold cursor-pointer disabled:opacity-50 ${
                          u.account_status === "ACTIVE"
                            ? "text-amber-600 hover:text-amber-700"
                            : "text-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        {u.account_status === "ACTIVE"
                          ? t(lang, "Deactivate", "අක්‍රිය කරන්න")
                          : t(lang, "Activate", "සක්‍රිය කරන්න")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* EDIT USER DETAILS MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={closeEditModal} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity" />

          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <UserPen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    {t(lang, "Edit User Details", "පරිශීලක තොරතුරු සංස්කරණය")}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400">
                    {isAdminUser
                      ? t(lang, "Only the name can be updated for this account.", "මෙම ගිණුම සඳහා නම පමණක් යාවත්කාලීන කළ හැක.")
                      : isCommissionerUser
                      ? t(lang, "Only name and account status can be updated.", "නම සහ ගිණුම් තත්ත්වය පමණක් යාවත්කාලීන කළ හැක.")
                      : t(lang, "Update details and account status.", "විස්තර සහ ගිණුම් තත්ත්වය යාවත්කාලීන කරන්න.")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {editError && (
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* User Overview Tag */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-bold text-blue-600 text-sm shrink-0 shadow-xs">
                  {editForm.full_name[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">@{editingUser.username}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">{displayRole(editingUser)}</div>
                </div>
              </div>

              {/* Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t(lang, "Full Name", "සම්පූර්ණ නම")}
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t(lang, "Email", "විද්‍යුත් තැපෑල")}
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder={t(lang, "Optional", "අවශ්‍ය නම්")}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t(lang, "Phone Number", "දුරකථන අංකය")}
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder={t(lang, "Optional", "අවශ්‍ය නම්")}
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  />
                </div>

                {editingUser.account_type === "STAFF" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t(lang, "NIC Number", "ජාතික හැඳුනුම්පත් අංකය")}
                    </label>
                    <input
                      type="text"
                      value={editForm.nic_number}
                      onChange={(e) => setEditForm((f) => ({ ...f, nic_number: e.target.value }))}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                  </div>
                )}

                {isRegularStaff && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t(lang, "Role", "කාර්යභාරය")}
                      </label>
                      <select
                        value={editForm.role_id}
                        onChange={(e) => setEditForm((f) => ({ ...f, role_id: e.target.value }))}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t(lang, "Division", "කොට්ඨාශය")}
                      </label>
                      <select
                        value={editForm.division_id}
                        onChange={(e) => handleDivisionChange(e.target.value)}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {t(lang, "Section", "අංශය")}
                      </label>
                      <select
                        value={editForm.section_id}
                        onChange={(e) => setEditForm((f) => ({ ...f, section_id: e.target.value }))}
                        disabled={!editForm.division_id || loadingSections}
                        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer disabled:opacity-50"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t(lang, "Division", "කොට්ඨාශය")}
                    </label>
                    <select
                      value={editForm.division_id}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {t(lang, "Account Status", "ගිණුම් තත්ත්වය")}
                    </label>
                    <select
                      value={editForm.account_status}
                      onChange={(e) => setEditForm((f) => ({ ...f, account_status: e.target.value as "ACTIVE" | "SUSPENDED" }))}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    >
                      <option value="ACTIVE">{t(lang, "Active", "සක්‍රිය")}</option>
                      <option value="SUSPENDED">{t(lang, "Suspended", "අත්හිටුවා ඇත")}</option>
                    </select>
                  </div>
                )}
              </div>

              {isRegularStaff && (
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 text-xs font-medium text-amber-800 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    {t(
                      lang,
                      "Changing a user's role or division can affect what they can access in the system.",
                      "පරිශීලකයාගේ කාර්යභාරය හෝ කොට්ඨාශය වෙනස් කිරීමෙන් ඔහුට පද්ධතියේ ප්‍රවේශ විය හැකි කොටස් වෙනස් විය හැකිය."
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={closeEditModal}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු කරන්න")}
              </button>
              <button
                type="button"
                onClick={handleSaveUser}
                disabled={busyId === editingUser.id}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {busyId === editingUser.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {busyId === editingUser.id
                    ? t(lang, "Saving…", "සුරකිමින්…")
                    : t(lang, "Save Changes", "වෙනස්කම් සුරකින්න")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

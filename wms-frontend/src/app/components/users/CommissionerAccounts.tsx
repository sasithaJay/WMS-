import { useEffect, useState } from "react";
import { CheckCircle, Loader2, Plus, Shield, UserRound } from "lucide-react";
import api from "../../../api/axios";
import type { Lang } from "../../types";

type Account = {
  id: number;
  username: string;
  email: string;
  account_status: "ACTIVE" | "SUSPENDED";
  staff_profile?: { full_name: string };
};

const emptyForm = { full_name: "", email: "", nic_number: "", phone: "", employee_number: "", salary_number: "", password: "", password_confirmation: "" };

export function CommissionerAccounts({ lang }: { lang: Lang }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const si = lang === "si";

  const load = async () => {
    const response = await api.get("/admin/commissioners");
    setAccounts(response.data.data);
  };
  useEffect(() => { load().catch(() => setError("Unable to load Commissioner accounts.")); }, []);

  const create = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await api.post("/admin/commissioners", form);
      setMessage(response.data.message); setForm(emptyForm); await load();
    } catch (e: any) {
      setError(e.response?.data?.message ?? Object.values(e.response?.data?.errors ?? {}).flat().join(" ") ?? "Unable to create account.");
    } finally { setBusy(false); }
  };

  const setStatus = async (account: Account) => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await api.patch(`/admin/commissioners/${account.id}`, { account_status: account.account_status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" });
      setMessage(response.data.message); await load();
    } catch (e: any) { setError(e.response?.data?.message ?? "Unable to update account."); }
    finally { setBusy(false); }
  };

  const fields: Array<[keyof typeof emptyForm, string, string]> = [
    ["full_name", "Full name", "text"], ["email", "Email", "email"],
    ["nic_number", "NIC number", "text"], ["phone", "Phone", "tel"], ["employee_number", "Employee number", "text"], ["salary_number", "Salary number", "text"],
    ["password", "Password (8+ characters)", "password"], ["password_confirmation", "Confirm password", "password"],
  ];

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Shield className="h-5 w-5" /></div><div><h2 className="text-xl font-bold text-slate-900">{si ? "කොමසාරිස් ගිණුම්" : "Commissioner Accounts"}</h2><p className="text-sm text-slate-500">{si ? "ගිණුම් සාදන්න සහ තත්ත්වය කළමනාකරණය කරන්න" : "Create accounts and manage Commissioner succession."}</p></div></div>
    {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {message && <div role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{message}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><UserRound className="h-4 w-4" />{si ? "පවතින ගිණුම්" : "Existing accounts"}</h3>
      {accounts.length === 0 ? <p className="text-sm text-slate-500">No Commissioner accounts found.</p> : <div className="divide-y divide-slate-100">{accounts.map(account => <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-900">{account.staff_profile?.full_name} <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${account.account_status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{account.account_status}</span></p><p className="text-sm text-slate-500">{account.username} · {account.email}</p></div><button disabled={busy} onClick={() => setStatus(account)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{account.account_status === "ACTIVE" ? "Deactivate" : "Activate successor"}</button></div>)}</div>}
    </section>
    <form onSubmit={create} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-900"><Plus className="h-4 w-4" />{si ? "නව කොමසාරිස් ගිණුම" : "Create Commissioner account"}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{fields.map(([key, label, type]) => <label key={key} className="space-y-1 text-sm font-medium text-slate-700">{label}<input required type={type} autoComplete={type === "password" ? "new-password" : undefined} minLength={key === "password" || key === "password_confirmation" ? 8 : undefined} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /></label>)}
        <label className="space-y-1 text-sm font-medium text-slate-700">Generated username<input readOnly value={`SWPCS-${form.salary_number}`} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600" /></label>
      </div>
      <p className="mt-3 text-xs text-slate-500">New accounts receive access to both Social Service and Child Service stores through the Commissioner role.</p>
      <button disabled={busy} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}{si ? "ගිණුම සාදන්න" : "Create account"}</button>
    </form>
  </div>;
}

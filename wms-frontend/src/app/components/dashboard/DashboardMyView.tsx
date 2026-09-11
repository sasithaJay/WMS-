import { useEffect, useState } from "react";
import { Clock, CheckCircle2, FileText, ListChecks, Loader2, AlertCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import { getDashboardMyView } from "../../../services/dashboardService";
import { PendingRequestTable } from "./PendingRequestTable";
import { RecentActivityTable } from "./RecentActivityTable";
import type { Lang, Role } from "../../types";
import type { MyViewSummary } from "../../types/dashboard";

export function DashboardMyView({
  lang,
  role,
  onNavigate,
}: {
  lang: Lang;
  role: Role;
  onNavigate: (navId: string) => void;
}) {
  const [summary, setSummary] = useState<MyViewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setLoading(true);
      setError("");
      const response = await getDashboardMyView();
      setSummary(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load your dashboard.",
          "ඔබගේ උපකරණ පුවරුව පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2.5">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-xs font-semibold">
          {t(lang, "Loading your view…", "පූරණය වෙමින්…")}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t(lang, "My Requests", "මගේ ඉල්ලීම්")}
          value={String(summary.my_requests_this_month_count)}
          sub={t(lang, "This month", "මෙම මාසය")}
          color="blue"
          bgColor="bgBlue"
          icon={<FileText className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Action Required", "ක්‍රියාව අවශ්‍යයි")}
          value={String(summary.action_required_count)}
          sub={t(lang, "Awaiting your action", "ඔබගේ ක්‍රියාව අපේක්ෂිත")}
          color="amber"
          bgColor="bgAmber"
          icon={<ListChecks className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Pending Issue", "නිකුත් කිරීමට නියමිත")}
          value={String(summary.my_pending_issuance_count)}
          sub={t(
            lang,
            "Your requests awaiting stock",
            "ඔබගේ ඉල්ලීම් තොග අපේක්ෂිත"
          )}
          color="purple"
          bgColor="bgPurple"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label={t(lang, "Issued", "නිකුත් කළ")}
          value={String(summary.my_issued_this_month_count)}
          sub={t(lang, "This month", "මෙම මාසය")}
          color="green"
          bgColor="bgGreen"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
      </div>

      {/* Action Required Items */}
      <PendingRequestTable
        lang={lang}
        items={summary.action_required_items}
        onNavigate={onNavigate}
      />

      {/* Recent Activity */}
      <RecentActivityTable
        lang={lang}
        movements={summary.recent_movements}
      />
    </div>
  );
}
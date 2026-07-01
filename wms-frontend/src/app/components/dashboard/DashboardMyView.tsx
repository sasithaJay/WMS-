import { Clock, CheckCircle, FileText, PlusCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { PendingRequestTable } from "./PendingRequestTable";
import { RecentActivityTable } from "./RecentActivityTable";

export function DashboardMyView({ lang }: { lang: Lang }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t(lang, "My Requests", "මගේ ඉල්ලීම්")}
          value="8"
          sub={t(lang, "This month", "මෙම මාසය")}
          color="blue"
          icon={<FileText className="w-5 h-5" />}
        />

        <StatCard
          label={t(lang, "Pending Issue", "නිකුත් කිරීමට නියමිත")}
          value="3"
          sub={t(lang, "Waiting for store keeper", "ගබඩා භාරකරු අපේක්ෂිත")}
          color="amber"
          icon={<Clock className="w-5 h-5" />}
        />

        <StatCard
          label={t(lang, "Issued", "නිකුත් කළ")}
          value="5"
          sub={t(lang, "Completed requests", "සම්පූර්ණ ඉල්ලීම්")}
          color="green"
          icon={<CheckCircle className="w-5 h-5" />}
        />

      </div>

      <PendingRequestTable lang={lang} />

      <RecentActivityTable lang={lang} />
    </div>
  );
}
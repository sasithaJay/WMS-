import { STATUS_CONFIG, t } from "../../constants/translations";
import type { StatusType, Lang } from "../../types";

export function StatusBadge({ status, lang }: { status: StatusType; lang: Lang }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      {t(lang, cfg.label, cfg.labelSi)}
    </span>
  );
}

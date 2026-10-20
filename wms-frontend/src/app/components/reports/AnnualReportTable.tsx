import type { Lang } from "../../types";
import type { AnnualReportRow } from "../../types/reports";
import { MonthlyReportTable } from "./MonthlyReportTable";

export function AnnualReportTable({
  lang,
  rows,
  year,
  divisionLabel,
}: {
  lang: Lang;
  rows: AnnualReportRow[];
  year: number;
  divisionLabel: string;
}) {
  return (
    <MonthlyReportTable
      lang={lang}
      rows={rows}
      month={1}
      year={year}
      divisionLabel={divisionLabel}
      title="Annual Inventory Transactions"
      periodLabel={String(year)}
      emptyDescription="No inventory transactions match the selected year and division."
    />
  );
}

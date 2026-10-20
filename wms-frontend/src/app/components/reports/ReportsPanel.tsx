import { useEffect, useState } from "react";
import {
  Eye,
  Download,
  X,
  Printer,
  Loader2,
  FileBarChart2,
  ArrowUpFromLine,
  ArrowDownToLine,
  CalendarDays,
  FileStack,
  FileClock,
  AlertCircle,
  Filter,
} from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import api from "../../../api/axios";
import {
  getStockReport,
  downloadStockReportPdf,
  getIssueReport,
  downloadIssueReportPdf,
  getReceiptReport,
  downloadReceiptReportPdf,
  getMonthlyReport,
  downloadMonthlyReportPdf,
  getAnnualReport,
  downloadAnnualReportPdf,
  getOfficerRequestsReport,
  downloadOfficerRequestsReportPdf,
} from "../../../services/reportService";
import type { ReportFilters } from "../../types/reports";
import { StockReportTable } from "./StockReportTable";
import { IssueReportTable } from "./IssueReportTable";
import { ReceiptReportTable } from "./ReceiptReportTable";
import { MonthlyReportTable } from "./MonthlyReportTable";
import { AnnualReportTable } from "./AnnualReportTable";
import { OfficerRequestReportTable } from "./OfficerRequestReportTable";

type ReportId = "stock" | "issue" | "receipt" | "monthly" | "annual" | "officer";

interface DivisionOption {
  id: number;
  name_en: string;
  name_si: string;
}

const REPORT_CARDS: {
  id: ReportId;
  icon: any;
  title: string;
  titleSi: string;
  desc: string;
  descSi: string;
  color: string;
}[] = [
  {
    id: "stock",
    icon: FileBarChart2,
    title: "Current Stock Report",
    titleSi: "වත්මන් තොග වාර්තාව",
    desc: "Full inventory snapshot with quantities and reorder status.",
    descSi: "ගබඩා දෙකෙහිම ප්‍රමාණ හා නැවත ඇණවුම් තත්ත්වය.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    id: "issue",
    icon: ArrowUpFromLine,
    title: "Issue Report",
    titleSi: "ගිලිහීම් වාර්තාව",
    desc: "All goods issued within a selected period.",
    descSi: "තෝරාගත් කාලය තුළ ගිලිහූ සියලු භාණ්ඩ.",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  {
    id: "receipt",
    icon: ArrowDownToLine,
    title: "Receipt Report",
    titleSi: "රිසිට් වාර්තාව",
    desc: "Stock received from suppliers with GRN numbers.",
    descSi: "GRN අංක සහිත සැපයුම්කරුවන්ගෙන් ලැබූ තොග.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    id: "monthly",
    icon: CalendarDays,
    title: "Monthly Report",
    titleSi: "මාසික වාර්තාව",
    desc: "Consolidated monthly summary of receipts and issues.",
    descSi: "රිසිට්, ගිලිහීම් මාසික සාරාංශය.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    id: "annual",
    icon: FileStack,
    title: "Annual Report",
    titleSi: "වාර්ෂික වාර්තාව",
    desc: "Received and issued item transactions for the selected year.",
    descSi: "විගණන අරමුණු සඳහා වාර්ෂික සාරාංශය.",
    color: "bg-rose-50 text-rose-600 border-rose-100",
  },
  {
    id: "officer",
    icon: FileClock,
    title: "Officer / DS Office Request Report",
    titleSi: "නිලධාරී ඉල්ලීම් වාර්තාව",
    desc: "All requests grouped by officer and division.",
    descSi: "නිලධාරී, DS කාර්යාලය, ආයතනය අනුව ඉල්ලීම්.",
    color: "bg-teal-50 text-teal-600 border-teal-100",
  },
];

const STATUS_OPTIONS = [
  "PENDING_RECOMMENDATION",
  "PENDING_APPROVAL",
  "APPROVED",
  "ISSUED",
  "REJECTED",
  "RETURNED",
  "CANCELLED",
];
const STOCK_STATUS_OPTIONS = ["OUT", "LOW", "NORMAL"];

function defaultFiltersFor(id: ReportId): ReportFilters {
  const now = new Date();
  switch (id) {
    case "monthly":
      return { month: now.getMonth() + 1, year: now.getFullYear() };
    case "annual":
      return { year: now.getFullYear() };
    default:
      return {};
  }
}

export function ReportsPanel({ lang, role }: { lang: Lang; role?: Role }) {
  const [previewing, setPreviewing] = useState<ReportId | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<ReportId | null>(null);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState<ReportFilters>({});
  const [divisions, setDivisions] = useState<DivisionOption[]>([]);
  const canSelectDivision = role === "COMMISSIONER" || role === "ADMIN";

  const [stockData, setStockData] = useState<Awaited<ReturnType<typeof getStockReport>>["data"]>([]);
  const [issueData, setIssueData] = useState<Awaited<ReturnType<typeof getIssueReport>>["data"]>([]);
  const [receiptData, setReceiptData] = useState<Awaited<ReturnType<typeof getReceiptReport>>["data"]>([]);
  const [monthlyData, setMonthlyData] = useState<Awaited<ReturnType<typeof getMonthlyReport>>["data"]>([]);
  const [annualData, setAnnualData] = useState<Awaited<ReturnType<typeof getAnnualReport>>["data"]>([]);
  const [officerData, setOfficerData] = useState<Awaited<ReturnType<typeof getOfficerRequestsReport>>["data"]>([]);

  useEffect(() => {
    if (canSelectDivision) {
      api
        .get("/registration-options")
        .then((res) => setDivisions(res.data.divisions))
        .catch((err) => console.error(err));
    }
  }, [canSelectDivision]);

  async function fetchReport(id: ReportId, activeFilters: ReportFilters) {
    setLoading(true);
    setError("");

    try {
      switch (id) {
        case "stock":
          setStockData((await getStockReport(activeFilters)).data);
          break;
        case "issue":
          setIssueData((await getIssueReport(activeFilters)).data);
          break;
        case "receipt":
          setReceiptData((await getReceiptReport(activeFilters)).data);
          break;
        case "monthly":
          setMonthlyData((await getMonthlyReport(activeFilters)).data);
          break;
        case "annual":
          setAnnualData((await getAnnualReport(activeFilters)).data);
          break;
        case "officer":
          setOfficerData((await getOfficerRequestsReport(activeFilters)).data);
          break;
      }
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to load this report.", "මෙම වාර්තාව පූරණය කළ නොහැක.")
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePreview(id: ReportId) {
    const initial = defaultFiltersFor(id);
    setPreviewing(id);
    setFilters(initial);
    fetchReport(id, initial);
  }

  function handleApplyFilters() {
    if (previewing) fetchReport(previewing, filters);
  }

  async function handleDownload(id: ReportId) {
    try {
      setDownloadingId(id);
      const activeFilters = id === previewing ? filters : defaultFiltersFor(id);
      const fn = {
        stock: downloadStockReportPdf,
        issue: downloadIssueReportPdf,
        receipt: downloadReceiptReportPdf,
        monthly: downloadMonthlyReportPdf,
        annual: downloadAnnualReportPdf,
        officer: downloadOfficerRequestsReportPdf,
      }[id];
      await fn(activeFilters);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to download PDF. Please try again.",
          "PDF බාගත කළ නොහැක. නැවත උත්සාහ කරන්න."
        )
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const activeCard = REPORT_CARDS.find((r) => r.id === previewing);

  const inputClass =
    "w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1.5";

  const hasFilterFields =
    canSelectDivision ||
    previewing === "stock" ||
    previewing === "issue" ||
    previewing === "receipt" ||
    previewing === "officer" ||
    previewing === "monthly" ||
    previewing === "annual";

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-xs font-medium text-slate-500">
        {t(
          lang,
          "Select a report to preview or download as PDF.",
          "PDF ලෙස බාගත කිරීමට හෝ පෙරදර්ශනය සඳහා වාර්තාවක් තෝරන්න."
        )}
      </p>

      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* REPORT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_CARDS.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center mb-4 ${r.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1">
                  {t(lang, r.title, r.titleSi)}
                </h3>
                <p className="text-xs font-medium text-slate-400 leading-relaxed mb-5">
                  {t(lang, r.desc, r.descSi)}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePreview(r.id)}
                  className="flex-1 h-9 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t(lang, "Preview", "පෙරදර්ශනය")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(r.id)}
                  disabled={downloadingId === r.id}
                  className="flex-1 h-9 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === r.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>{t(lang, "Download PDF", "PDF බාගත")}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* PREVIEW MODAL DIALOG */}
      {previewing && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
          {/* Frosted Glass Backdrop */}
          <div
            onClick={() => setPreviewing(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          {/* Centered Modal Frame */}
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[85vh] my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {t(
                      lang,
                      activeCard?.title || "",
                      activeCard?.titleSi || ""
                    )}
                  </h3>
                  <p className="text-[10px] font-mono font-bold text-slate-400">
                    {previewing.toUpperCase()} REPORT PREVIEW
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* FILTER BAR */}
              {hasFilterFields && (
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Filter className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t(lang, "Report Filters", "වාර්තා පෙරහන්")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {canSelectDivision && (
                      <div>
                        <label className={labelClass}>
                          {t(lang, "Division", "අංශය")}
                        </label>
                        <select
                          value={filters.division_id ?? ""}
                          onChange={(e) =>
                            setFilters((f) => ({
                              ...f,
                              division_id: e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="">
                            {t(lang, "All Divisions", "සියලුම අංශ")}
                          </option>
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {t(lang, d.name_en, d.name_si)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(previewing === "issue" ||
                      previewing === "receipt" ||
                      previewing === "officer") && (
                      <>
                        <div>
                          <label className={labelClass}>
                            {t(lang, "From Date", "සිට දිනය")}
                          </label>
                          <input
                            type="date"
                            value={filters.date_from ?? ""}
                            onChange={(e) =>
                              setFilters((f) => ({
                                ...f,
                                date_from: e.target.value || undefined,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>
                            {t(lang, "To Date", "දක්වා දිනය")}
                          </label>
                          <input
                            type="date"
                            value={filters.date_to ?? ""}
                            onChange={(e) =>
                              setFilters((f) => ({
                                ...f,
                                date_to: e.target.value || undefined,
                              }))
                            }
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    {previewing === "issue" && (
                      <div>
                        <label className={labelClass}>{t(lang, "Requester", "ඉල්ලුම්කරු")}</label>
                        <input
                          type="search"
                          value={filters.requester ?? ""}
                          onChange={(e) => setFilters((f) => ({ ...f, requester: e.target.value || undefined }))}
                          placeholder={t(lang, "Name or username", "නම හෝ පරිශීලක නාමය")}
                          className={inputClass}
                        />
                      </div>
                    )}

                    {previewing === "officer" && (
                      <div>
                        <label className={labelClass}>
                          {t(lang, "Status", "තත්ත්වය")}
                        </label>
                        <select
                          value={filters.status ?? ""}
                          onChange={(e) =>
                            setFilters((f) => ({
                              ...f,
                              status: e.target.value || undefined,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="">
                            {t(lang, "All Statuses", "සියලු තත්ත්ව")}
                          </option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {previewing === "stock" && (
                      <div>
                        <label className={labelClass}>
                          {t(lang, "Stock Status", "තොග තත්ත්වය")}
                        </label>
                        <select
                          value={filters.status ?? ""}
                          onChange={(e) =>
                            setFilters((f) => ({
                              ...f,
                              status: e.target.value || undefined,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="">{t(lang, "All Statuses", "සියලු තත්ත්ව")}</option>
                          {STOCK_STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {previewing === "monthly" && (
                      <>
                        <div>
                          <label className={labelClass}>{t(lang, "Month", "මාසය")}</label>
                          <select
                            value={filters.month ?? new Date().getMonth() + 1}
                            onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
                            className={inputClass}
                          >
                            {Array.from({ length: 12 }, (_, index) => {
                              const month = index + 1;
                              const label = new Intl.DateTimeFormat(lang === "si" ? "si-LK" : "en", { month: "long" }).format(new Date(2026, index, 1));
                              return <option key={month} value={month}>{label}</option>;
                            })}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>{t(lang, "Year", "වර්ෂය")}</label>
                          <input
                            type="number"
                            min={1900}
                            max={2200}
                            value={filters.year ?? new Date().getFullYear()}
                            onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))}
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    {previewing === "annual" && (
                      <div>
                        <label className={labelClass}>{t(lang, "Year", "Year")}</label>
                        <input
                          type="number"
                          min={1900}
                          max={2200}
                          value={filters.year ?? new Date().getFullYear()}
                          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))}
                          className={inputClass}
                        />
                      </div>
                    )}

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="w-full h-10 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {t(lang, "Apply", "යොදන්න")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* REPORT PREVIEW DATA */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <Printer className="w-8 h-8 animate-pulse text-blue-600" />
                  <p className="text-xs font-semibold">
                    {t(lang, "Loading report…", "වාර්තාව පූරණය වෙමින්…")}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                  {previewing === "stock" && (
                    <StockReportTable lang={lang} rows={stockData} />
                  )}
                  {previewing === "issue" && (
                    <IssueReportTable lang={lang} rows={issueData} />
                  )}
                  {previewing === "receipt" && (
                    <ReceiptReportTable lang={lang} rows={receiptData} />
                  )}
                  {previewing === "monthly" && (
                    <MonthlyReportTable
                      lang={lang}
                      rows={monthlyData}
                      month={filters.month ?? new Date().getMonth() + 1}
                      year={filters.year ?? new Date().getFullYear()}
                      divisionLabel={filters.division_id
                        ? divisions.find((division) => division.id === filters.division_id)?.name_en ?? "Selected division"
                        : canSelectDivision
                          ? "All divisions"
                          : monthlyData[0]?.division_name ?? "Assigned division"}
                    />
                  )}
                  {previewing === "annual" && (
                    <AnnualReportTable
                      lang={lang}
                      rows={annualData}
                      year={filters.year ?? new Date().getFullYear()}
                      divisionLabel={filters.division_id
                        ? divisions.find((division) => division.id === filters.division_id)?.name_en ?? "Selected division"
                        : canSelectDivision
                          ? "All divisions"
                          : annualData[0]?.division_name ?? "Assigned division"}
                    />
                  )}
                  {previewing === "officer" && (
                    <OfficerRequestReportTable lang={lang} groups={officerData} />
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="h-9 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t(lang, "Close", "වසන්න")}
              </button>

              <button
                type="button"
                onClick={() => handleDownload(previewing)}
                disabled={downloadingId === previewing}
                className="h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {downloadingId === previewing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{t(lang, "Download PDF", "PDF බාගත")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

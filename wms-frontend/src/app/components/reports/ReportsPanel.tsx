import { useEffect, useState } from "react";
import { Eye, Download, X, Printer, Loader2,
  FileBarChart2, ArrowUpFromLine, ArrowDownToLine, CalendarDays, FileStack, FileClock } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import api from "../../../api/axios";
import {
  getStockReport, downloadStockReportPdf,
  getIssueReport, downloadIssueReportPdf,
  getReceiptReport, downloadReceiptReportPdf,
  getMonthlyReport, downloadMonthlyReportPdf,
  getAnnualReport, downloadAnnualReportPdf,
  getOfficerRequestsReport, downloadOfficerRequestsReportPdf,
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

const REPORT_CARDS: { id: ReportId; icon: any; title: string; titleSi: string; desc: string; descSi: string; color: string }[] = [
  { id: "stock", icon: FileBarChart2, title: "Current Stock Report", titleSi: "වත්මන් තොග වාර්තාව", desc: "Full inventory snapshot with quantities and reorder status.", descSi: "ගබඩා දෙකෙහිම ප්‍රමාණ හා නැවත ඇණවුම් තත්ත්වය.", color: "bg-blue-50 text-[#4295D9]" },
  { id: "issue", icon: ArrowUpFromLine, title: "Issue Report", titleSi: "ගිලිහීම් වාර්තාව", desc: "All goods issued within a selected period.", descSi: "තෝරාගත් කාලය තුළ ගිලිහූ සියලු භාණ්ඩ.", color: "bg-green-50 text-green-600" },
  { id: "receipt", icon: ArrowDownToLine, title: "Receipt Report", titleSi: "රිසිට් වාර්තාව", desc: "Stock received from suppliers with GRN numbers.", descSi: "GRN අංක සහිත සැපයුම්කරුවන්ගෙන් ලැබූ තොග.", color: "bg-purple-50 text-purple-600" },
  { id: "monthly", icon: CalendarDays, title: "Monthly Report", titleSi: "මාසික වාර්තාව", desc: "Consolidated monthly summary of receipts and issues.", descSi: "රිසිට්, ගිලිහීම් මාසික සාරාංශය.", color: "bg-amber-50 text-amber-600" },
  { id: "annual", icon: FileStack, title: "Annual Report", titleSi: "වාර්ෂික වාර්තාව", desc: "Multi-year comprehensive report for audit purposes.", descSi: "විගණන අරමුණු සඳහා වාර්ෂික සාරාංශය.", color: "bg-red-50 text-red-600" },
  { id: "officer", icon: FileClock, title: "Officer / DS Office Request Report", titleSi: "නිලධාරී ඉල්ලීම් වාර්තාව", desc: "All requests grouped by officer and division.", descSi: "නිලධාරී, DS කාර්යාලය, ආයතනය අනුව ඉල්ලීම්.", color: "bg-teal-50 text-teal-600" },
];

const STATUS_OPTIONS = [
  "PENDING_RECOMMENDATION", "PENDING_APPROVAL", "APPROVED",
  "ISSUED", "REJECTED", "RETURNED", "CANCELLED",
];

function defaultFiltersFor(id: ReportId): ReportFilters {
  const now = new Date();
  switch (id) {
    case "monthly":
      return { year: now.getFullYear() };
    case "annual":
      return { from_year: now.getFullYear() - 2, to_year: now.getFullYear() };
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
  const isCommissioner = role === "COMMISSIONER";

  const [stockData, setStockData] = useState<Awaited<ReturnType<typeof getStockReport>>["data"]>([]);
  const [issueData, setIssueData] = useState<Awaited<ReturnType<typeof getIssueReport>>["data"]>([]);
  const [receiptData, setReceiptData] = useState<Awaited<ReturnType<typeof getReceiptReport>>["data"]>([]);
  const [monthlyData, setMonthlyData] = useState<Awaited<ReturnType<typeof getMonthlyReport>>["data"]>([]);
  const [annualData, setAnnualData] = useState<Awaited<ReturnType<typeof getAnnualReport>>["data"]>([]);
  const [officerData, setOfficerData] = useState<Awaited<ReturnType<typeof getOfficerRequestsReport>>["data"]>([]);

  useEffect(() => {
    if (isCommissioner) {
      api.get("/registration-options").then((res) => setDivisions(res.data.divisions)).catch((err) => console.error(err));
    }
  }, [isCommissioner]);

  async function fetchReport(id: ReportId, activeFilters: ReportFilters) {
    setLoading(true);
    setError("");

    try {
      switch (id) {
        case "stock": setStockData((await getStockReport(activeFilters)).data); break;
        case "issue": setIssueData((await getIssueReport(activeFilters)).data); break;
        case "receipt": setReceiptData((await getReceiptReport(activeFilters)).data); break;
        case "monthly": setMonthlyData((await getMonthlyReport(activeFilters)).data); break;
        case "annual": setAnnualData((await getAnnualReport(activeFilters)).data); break;
        case "officer": setOfficerData((await getOfficerRequestsReport(activeFilters)).data); break;
      }
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load this report.", "මෙම වාර්තාව පූරණය කළ නොහැක."));
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
      setError(t(lang, "Unable to download PDF. Please try again.", "PDF බාගත කළ නොහැක. නැවත උත්සාහ කරන්න."));
    } finally {
      setDownloadingId(null);
    }
  }

  const activeCard = REPORT_CARDS.find((r) => r.id === previewing);

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-white";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1";

  const hasFilterFields =
    isCommissioner ||
    previewing === "issue" ||
    previewing === "receipt" ||
    previewing === "officer" ||
    previewing === "monthly" ||
    previewing === "annual";

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t(lang, "Select a report to preview or download as PDF.", "PDF ලෙස බාගත කිරීමට හෝ පෙරදර්ශනය සඳහා වාර්තාවක් තෝරන්න.")}</p>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_CARDS.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all flex flex-col">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${r.color}`}><Icon className="w-5 h-5" /></div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{t(lang, r.title, r.titleSi)}</h3>
              <p className="text-xs text-gray-400 leading-relaxed flex-1 mb-5">{t(lang, r.desc, r.descSi)}</p>
              <div className="flex gap-2">
                <button onClick={() => handlePreview(r.id)} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-all flex-1 justify-center">
                  <Eye className="w-3.5 h-3.5" />{t(lang, "Preview", "පෙරදර්ශනය")}
                </button>
                <button
                  onClick={() => handleDownload(r.id)}
                  disabled={downloadingId === r.id}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#4295D9] text-white text-xs font-semibold rounded-lg hover:bg-[#3280C4] transition-all flex-1 justify-center disabled:opacity-50"
                >
                  {downloadingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {t(lang, "Download PDF", "PDF බාගත")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {previewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900">{t(lang, activeCard?.title || "", activeCard?.titleSi || "")}</h3>
              <button onClick={() => setPreviewing(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              {/* Filter controls — vary per report type */}
              

              {hasFilterFields && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {isCommissioner && (
                      <div>
                        <label className={labelClass}>{t(lang, "Division", "අංශය")}</label>
                        <select
                          value={filters.division_id ?? ""}
                          onChange={(e) => setFilters((f) => ({ ...f, division_id: e.target.value ? Number(e.target.value) : undefined }))}
                          className={inputClass}
                        >
                          <option value="">{t(lang, "Both Divisions", "අංශ දෙකම")}</option>
                          {divisions.map((d) => (
                            <option key={d.id} value={d.id}>{t(lang, d.name_en, d.name_si)}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {(previewing === "issue" || previewing === "receipt" || previewing === "officer") && (
                      <>
                        <div>
                          <label className={labelClass}>{t(lang, "From Date", "සිට දිනය")}</label>
                          <input
                            type="date"
                            value={filters.date_from ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>{t(lang, "To Date", "දක්වා දිනය")}</label>
                          <input
                            type="date"
                            value={filters.date_to ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    {previewing === "officer" && (
                      <div>
                        <label className={labelClass}>{t(lang, "Status", "තත්ත්වය")}</label>
                        <select
                          value={filters.status ?? ""}
                          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined }))}
                          className={inputClass}
                        >
                          <option value="">{t(lang, "All Statuses", "සියලු තත්ත්ව")}</option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {previewing === "monthly" && (
                      <div>
                        <label className={labelClass}>{t(lang, "Year", "වර්ෂය")}</label>
                        <input
                          type="number"
                          value={filters.year ?? ""}
                          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value ? Number(e.target.value) : undefined }))}
                          className={inputClass}
                        />
                      </div>
                    )}

                    {previewing === "annual" && (
                      <>
                        <div>
                          <label className={labelClass}>{t(lang, "From Year", "සිට වර්ෂය")}</label>
                          <input
                            type="number"
                            value={filters.from_year ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, from_year: e.target.value ? Number(e.target.value) : undefined }))}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>{t(lang, "To Year", "දක්වා වර්ෂය")}</label>
                          <input
                            type="number"
                            value={filters.to_year ?? ""}
                            onChange={(e) => setFilters((f) => ({ ...f, to_year: e.target.value ? Number(e.target.value) : undefined }))}
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex items-end">
                      <button
                        onClick={handleApplyFilters}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-[#4295D9] text-white text-xs font-semibold rounded-lg hover:bg-[#3280C4] transition-all disabled:opacity-50"
                      >
                        {t(lang, "Apply", "යොදන්න")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center h-56 text-gray-400">
                  <Printer className="w-8 h-8 mb-2 animate-pulse" />
                  <p className="text-sm">{t(lang, "Loading report…", "වාර්තාව පූරණය වෙමින්…")}</p>
                </div>
              ) : (
                <>
                  {previewing === "stock" && <StockReportTable lang={lang} rows={stockData} />}
                  {previewing === "issue" && <IssueReportTable lang={lang} rows={issueData} />}
                  {previewing === "receipt" && <ReceiptReportTable lang={lang} rows={receiptData} />}
                  {previewing === "monthly" && <MonthlyReportTable lang={lang} rows={monthlyData} />}
                  {previewing === "annual" && <AnnualReportTable lang={lang} rows={annualData} />}
                  {previewing === "officer" && <OfficerRequestReportTable lang={lang} groups={officerData} />}
                </>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => setPreviewing(null)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">{t(lang, "Close", "වසන්න")}</button>
                <button
                  onClick={() => handleDownload(previewing)}
                  disabled={downloadingId === previewing}
                  className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {downloadingId === previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t(lang, "Download PDF", "PDF බාගත")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
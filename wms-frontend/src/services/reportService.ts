

import api from "../api/axios";
import type {
  StockReportRow,
  IssueReportRow,
  ReceiptReportRow,
  MonthlyReportRow,
  AnnualReportRow,
  OfficerReportGroup,
  ReportFilters,
} from "../app/types/reports";

async function downloadPdf(url: string, params: ReportFilters, filename: string): Promise<void> {
  const response = await api.get(url, { params, responseType: "blob" });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function getStockReport(filters: ReportFilters = {}): Promise<{ data: StockReportRow[] }> {
  const response = await api.get("/reports/stock", { params: filters });
  return response.data;
}
export function downloadStockReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/stock/pdf", filters, "stock-report.pdf");
}

export async function getIssueReport(filters: ReportFilters = {}): Promise<{ data: IssueReportRow[] }> {
  const response = await api.get("/reports/issue", { params: filters });
  return response.data;
}
export function downloadIssueReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/issue/pdf", filters, "issue-report.pdf");
}

export async function getReceiptReport(filters: ReportFilters = {}): Promise<{ data: ReceiptReportRow[] }> {
  const response = await api.get("/reports/receipt", { params: filters });
  return response.data;
}
export function downloadReceiptReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/receipt/pdf", filters, "receipt-report.pdf");
}

export async function getMonthlyReport(filters: ReportFilters = {}): Promise<{ data: MonthlyReportRow[] }> {
  const response = await api.get("/reports/monthly", { params: filters });
  return response.data;
}
export function downloadMonthlyReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/monthly/pdf", filters, "monthly-report.pdf");
}

export async function getAnnualReport(filters: ReportFilters = {}): Promise<{ data: AnnualReportRow[] }> {
  const response = await api.get("/reports/annual", { params: filters });
  return response.data;
}
export function downloadAnnualReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/annual/pdf", filters, "annual-report.pdf");
}

export async function getOfficerRequestsReport(filters: ReportFilters = {}): Promise<{ data: OfficerReportGroup[] }> {
  const response = await api.get("/reports/officer-requests", { params: filters });
  return response.data;
}
export function downloadOfficerRequestsReportPdf(filters: ReportFilters = {}) {
  return downloadPdf("/reports/officer-requests/pdf", filters, "officer-requests-report.pdf");
}
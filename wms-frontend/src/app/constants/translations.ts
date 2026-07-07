import type { Lang } from "../types";

export const t = (lang: Lang, en: string, si: string): string =>
  lang === "en" ? en : si;

export const STATUS_CONFIG = {
  pending: { label: "Pending", labelSi: "අපේක්ෂිත", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", labelSi: "අනුමත", color: "bg-green-100 text-green-700" },
  issued: { label: "Issued", labelSi: "ලබාදුන්", color: "bg-blue-100 text-[#4295D9]" },
  rejected: { label: "Rejected", labelSi: "ප්‍රතික්ෂේප", color: "bg-red-100 text-red-700" },
  pending_issue: {
    label: "Pending Issue",
    labelSi: "නිකුත් කිරීමට නියමිත",
    color: "bg-yellow-100 text-yellow-700",
  },
  partially_issued: {
    label: "Partially Issued",
    labelSi: "කොටසක් නිකුත් කළ",
    color: "bg-purple-100 text-purple-700",
  },
  cancelled: {
    label: "Cancelled",
    labelSi: "අවලංගු කළ",
    color: "bg-gray-100 text-gray-600",
  },
};

import {
  LayoutDashboard, Package, ClipboardList, PlusCircle, BookOpen,
  BarChart2, Settings, Warehouse, ArrowDownToLine, Users, CheckCircle, FileText,
} from "lucide-react";
import type { Role } from "../types";

type NavItem = {
  icon: React.ElementType;
  label: string;
  labelSi: string;
  id: string;
  badge?: number;
};

export const NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    {
      id: "dashboard",
      label: "Dashboard",
      labelSi: "උපකරණ පුවරුව",
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: "User Management",
      labelSi: "පරිශීලක කළමනාකරණය",
      icon: Users,
      badge: 5,
    },
    {
      id: "reports",
      label: "Reports",
      labelSi: "වාර්තා",
      icon: FileText,
    },
    {
      id: "settings",
      label: "Settings",
      labelSi: "සැකසීම්",
      icon: Settings,
    },
  ],

  COMMISSIONER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: CheckCircle, label: "Approve", labelSi: "අනුමත", id: "approve", badge: 7 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Users, label: "User Verification", labelSi: "පරිශීලක කළමනාකරණය", id: "users" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  ASSISTANT_COMMISSIONER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: CheckCircle, label: "Approve", labelSi: "අනුමත", id: "approve", badge: 3 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  ASSISTANT_DIRECTOR: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: CheckCircle, label: "Approve", labelSi: "අනුමත", id: "approve", badge: 4 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  ACCOUNTANT: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: CheckCircle, label: "Approve", labelSi: "අනුමත", id: "approve", badge: 2 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  ADMINISTRATIVE_OFFICER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: BookOpen, label: "Recommend", labelSi: "නිර්දේශ", id: "recommend", badge: 4 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  SECTION_HEAD: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: BookOpen, label: "Recommend", labelSi: "නිර්දේශ", id: "recommend", badge: 2 },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  STORE_KEEPER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: Package, label: "Issue Goods", labelSi: "භාණ්ඩ ගිලිහීම", id: "issue" },
    { icon: Warehouse, label: "Inventory", labelSi: "තොග ලැයිස්තුව", id: "inventory" },
    { icon: ArrowDownToLine, label: "Stock Receipts", labelSi: "ගබඩා රිසිට්", id: "receipts" },
    { icon: BarChart2, label: "Reports", labelSi: "වාර්තා", id: "reports" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  DEVELOPMENT_OFFICER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: PlusCircle, label: "New Request", labelSi: "නව ඉල්ලීම", id: "new" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  OFFICER: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: PlusCircle, label: "New Request", labelSi: "නව ඉල්ලීම", id: "new" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  INSTITUTION: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: PlusCircle, label: "New Request", labelSi: "නව ඉල්ලීම", id: "new" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
  DIVISIONAL_SECRETARIAT: [
    { icon: LayoutDashboard, label: "Dashboard", labelSi: "උපකරණ පුවරුව", id: "dashboard" },
    { icon: ClipboardList, label: "My Requests", labelSi: "මගේ ඉල්ලීම්", id: "requests" },
    { icon: PlusCircle, label: "New Request", labelSi: "නව ඉල්ලීම", id: "new" },
    { icon: Settings, label: "Settings", labelSi: "සැකසීම්", id: "settings" },
  ],
};

export const SECTIONS_SS = ["Institutional", "Development", "Accounts"];
export const SECTIONS_PC = ["Institutional", "Development", "Probation"];
export const JOB_ROLES = [
  "Commissioner", "Assistant Commissioner", "Assistant Director",
  "Administrative Officer", "Accountant", "Section Head – Chief Clerk/Financial Assistant",
  "Development Officer", "Store Keeper", "Other Officer",
];
export const DISTRICTS = ["Galle", "Matara", "Hambantota"];

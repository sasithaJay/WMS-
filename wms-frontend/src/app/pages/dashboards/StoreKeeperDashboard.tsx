import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DashboardChart } from "../../components/dashboard/DashboardChart";
import { RecentActivityTable } from "../../components/dashboard/RecentActivityTable";
import { ReorderLevelTable } from "../../components/inventory/ReorderLevelTable";
import { StockIssueForm } from "../../components/inventory/StockIssueForm";
import { InventorySummary } from "../../components/inventory/InventorySummary";
import { StockBalanceTable } from "../../components/inventory/StockBalanceTable";
import { ItemRegistrationForm } from "../../components/inventory/ItemRegistrationForm";
import { StockReceivingForm } from "../../components/inventory/StockReceivingForm";
import { StockMovementTable } from "../../components/inventory/StockMovementTable";
import { BarcodeScannerPanel } from "../../components/inventory/BarcodeScannerPanel";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { StatCard } from "../../components/common/StatCard";
import { Package, AlertTriangle, ArrowDownToLine, Warehouse } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function StoreKeeperDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showAddItem, setShowAddItem] = useState(false);
  const role = "STORE_KEEPER" as const;

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout}>
      {activeNav === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t(lang, "Items to Issue", "ගිලිහිය යුතු")} value="12" color="amber" icon={<Package className="w-5 h-5" />} />
            <StatCard label={t(lang, "Low Stock Alerts", "අඩු තොග")} value="3" color="red" icon={<AlertTriangle className="w-5 h-5" />} />
            <StatCard label={t(lang, "Month Receipts", "මාසේ රිසිට්")} value="18" color="green" icon={<ArrowDownToLine className="w-5 h-5" />} />
            <StatCard label={t(lang, "Total SKUs", "මුළු SKU")} value="347" color="blue" icon={<Warehouse className="w-5 h-5" />} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3"><DashboardChart lang={lang} /></div>
            <div className="lg:col-span-2"><RecentActivityTable lang={lang} /></div>
          </div>
          <ReorderLevelTable lang={lang} />
          <BarcodeScannerPanel lang={lang} />
        </div>
      )}
      {activeNav === "issue" && <StockIssueForm lang={lang} />}
      {activeNav === "inventory" && (
        <div className="space-y-5">
          <InventorySummary lang={lang} />
          <div className="flex justify-end">
            <button onClick={() => setShowAddItem(true)} className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all">
              <Package className="w-4 h-4" />
              {t(lang, "Add Item", "භාණ්ඩ එකතු කරන්න")}
            </button>
          </div>
          <StockBalanceTable lang={lang} />
          {showAddItem && <ItemRegistrationForm lang={lang} onClose={() => setShowAddItem(false)} />}
        </div>
      )}
      {activeNav === "receipts" && (
        <div className="space-y-5">
          <StockReceivingForm lang={lang} />
          <StockMovementTable lang={lang} />
        </div>
      )}
      {activeNav === "reports" && <ReportsPanel lang={lang} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}

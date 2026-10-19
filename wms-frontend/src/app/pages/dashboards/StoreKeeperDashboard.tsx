import { useEffect, useState } from "react";
import { usePersistentActiveNav } from "../../hooks/usePersistentActiveNav";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DashboardChart } from "../../components/dashboard/DashboardChart";
import { RecentActivityTable } from "../../components/dashboard/RecentActivityTable";
import { ReorderLevelTable } from "../../components/inventory/ReorderLevelTable";
import { StockIssueForm } from "../../components/inventory/StockIssueForm";
import { StockReceivingForm } from "../../components/inventory/StockReceivingForm";
import { StockMovementTable } from "../../components/inventory/StockMovementTable";
import { BarcodeScannerPanel } from "../../components/inventory/BarcodeScannerPanel";
import { ReportsPanel } from "../../components/reports/ReportsPanel";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { StatCard } from "../../components/common/StatCard";
import { Package, AlertTriangle, ArrowDownToLine, Warehouse } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { DashTab } from "../../types";
import { InventoryPage } from "../../components/inventory/InventoryPage";
import { StockReceiptsList } from "../../components/inventory/StockReceiptsList";
import { StockReceiptDetailModal } from "../../components/inventory/StockReceiptDetailModal";
import { StockReceipt } from "../../types/stockReceipts";
import { getStockReceipt } from "../../../services/stockReceiptService";
import { RequestForm } from "../../components/requests/RequestForm";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";
import { getDashboardOverview } from "../../../services/dashboardService";
import type { DivisionDashboardSummary } from "../../types/dashboard";
import { VatRateRequestForm } from "../../components/requests/VatRateRequestForm";
import { MyVatRequestsTable } from "../../components/inventory/MyVatRequestsTable";
import { getCurrentVatRate } from "../../../services/vatRateService";
import { EquipmentReturnsPanel } from "../../components/inventory/EquipmentReturnsPanel";

export function StoreKeeperDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [division, setDivision] = useState<DivisionDashboardSummary | null>(null);
  const [loadingDivision, setLoadingDivision] = useState(true);
  const [activeNav, setActiveNav] = usePersistentActiveNav("STORE_KEEPER");
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [dashTab, setDashTab] = useState<DashTab>("personal");
  const [editingReceipt, setEditingReceipt] = useState<StockReceipt | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<StockReceipt | null>(null);
  const [loadingReceiptId, setLoadingReceiptId] = useState<number | null>(null);
  const [receiptsRefreshKey, setReceiptsRefreshKey] = useState(0);
  const [receiptLoadError, setReceiptLoadError] = useState("");
  const [stockActivityKey, setStockActivityKey] = useState(0);
  const [requestsRefreshSignal, setRequestsRefreshSignal] = useState(0);
  const role = "STORE_KEEPER" as const;
  const [currentVat, setCurrentVat] = useState(0);
  const [vatRefreshSignal, setVatRefreshSignal] = useState(0);

  useEffect(() => {
    getCurrentVatRate().then((res) => setCurrentVat(res.data.percentage));
  }, [vatRefreshSignal]);


  useEffect(() => {
    loadDivisionSummary();
  }, []);

  // Refresh the personal-tab stats whenever a stock-affecting action happens
  // elsewhere on this page (receipt confirmed, request issued, etc.)
  useEffect(() => {
    if (stockActivityKey > 0) {
      loadDivisionSummary();
    }
  }, [stockActivityKey]);

  async function loadDivisionSummary() {
    try {
      setLoadingDivision(true);
      const response = await getDashboardOverview();
      setDivision(response.data[0] ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDivision(false);
    }
  }

  async function handleEditReceipt(receipt: StockReceipt) {
    try {
      setReceiptLoadError("");
      setLoadingReceiptId(receipt.id);
      const fullReceipt = await getStockReceipt(receipt.id);
      setEditingReceipt(fullReceipt);
    } catch (err) {
      console.error(err);
      setReceiptLoadError(
        t(lang, "Unable to load this receipt for editing.", "සංස්කරණය සඳහා රිසිට් පූරණය කළ නොහැක."),
      );
    } finally {
      setLoadingReceiptId(null);
    }
  }

  async function handleViewReceipt(receipt: StockReceipt) {
    try {
      setReceiptLoadError("");
      setLoadingReceiptId(receipt.id);
      const fullReceipt = await getStockReceipt(receipt.id);
      setViewingReceipt(fullReceipt);
    } catch (err) {
      console.error(err);
      setReceiptLoadError(
        t(lang, "Unable to load this receipt.", "රිසිට් පූරණය කළ නොහැක."),
      );
    } finally {
      setLoadingReceiptId(null);
    }
  }

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout} canSeeSummary={true} dashTab={dashTab} setDashTab={setDashTab}>

      {activeNav === "dashboard" && (
        dashTab === "summary"
          ? <DashboardOverview lang={lang} />
          : loadingDivision ? (
              <p className="text-sm text-gray-500">{t(lang, "Loading…", "පූරණය වෙමින්…")}</p>
            ) : !division ? (
              <p className="text-sm text-gray-400">{t(lang, "No data available.", "දත්ත නොමැත.")}</p>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label={t(lang, "Items to Issue", "ගිලිහිය යුතු")} value={String(division.pending_issuance_count)} color="amber" bgColor="bgAmber" icon={<Package className="w-5 h-5" />} />
                  <StatCard label={t(lang, "Low Stock Alerts", "අඩු තොග")} value={String(division.low_stock_count)} color="red" bgColor="bgRed" icon={<AlertTriangle className="w-5 h-5" />} />
                  <StatCard label={t(lang, "Month Receipts", "මාසේ රිසිට්")} value={String(division.receipts_this_month_count)} color="green" bgColor="bgGreen" icon={<ArrowDownToLine className="w-5 h-5" />} />
                  <StatCard label={t(lang, "Total SKUs", "මුළු SKU")} value={String(division.total_items)} color="blue" bgColor="bgBlue" icon={<Warehouse className="w-5 h-5" />} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3"><DashboardChart lang={lang} data={division.monthly_chart} /></div>
                  <div className="lg:col-span-2"><RecentActivityTable lang={lang} movements={division.recent_movements} /></div>
                </div>
                <ReorderLevelTable lang={lang} />
              </div>
            )
      )}

      {activeNav === "requests" && !showNewRequest && (
        <MyRequestsTable lang={lang} role={role} onNewRequest={() => setShowNewRequest(true)}
        refreshSignal={requestsRefreshSignal} />
      )}
      {activeNav === "requests" && showNewRequest && (
        <RequestForm lang={lang} role={role} onCancel={() => setShowNewRequest(false)} 
        onSubmitted={() => {
          setRequestsRefreshSignal((s) => s + 1);
          setShowNewRequest(false);
        }}/>
      )}

      {activeNav === "issue" && <StockIssueForm lang={lang} />}
      {activeNav === "equipment-returns" && <EquipmentReturnsPanel lang={lang} />}

      {activeNav === "inventory" && (
        <InventoryPage lang={lang} userRole={role} />
      )}

      {activeNav === "receipts" && (
        <div className="space-y-5">
          {receiptLoadError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {receiptLoadError}
            </div>
          )}

          <StockReceivingForm
            lang={lang}
            editingReceipt={editingReceipt}
            onCancelEdit={() => setEditingReceipt(null)}
            onSaved={() => {
              setEditingReceipt(null);
              setReceiptsRefreshKey((k) => k + 1);
              setStockActivityKey((k) => k + 1);
            }}
          />

          <StockMovementTable lang={lang} refreshSignal={stockActivityKey} />

          <StockReceiptsList
            key={receiptsRefreshKey}
            lang={lang}
            onEdit={handleEditReceipt}
            onView={handleViewReceipt}
            onStockChanged={() => setStockActivityKey((k) => k + 1)}
          />

          {viewingReceipt && (
            <StockReceiptDetailModal
              lang={lang}
              receipt={viewingReceipt}
              onClose={() => setViewingReceipt(null)}
            />
          )}
        </div>
      )}

      {activeNav === "vat" && (
        <div className="space-y-5">
          <VatRateRequestForm
            lang={lang}
            currentPercentage={currentVat}
            onSubmitted={() => setVatRefreshSignal((s) => s + 1)}
          />
          <MyVatRequestsTable lang={lang} refreshSignal={vatRefreshSignal} />
        </div>
      )}

      {activeNav === "reports" && <ReportsPanel lang={lang} role={role} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}

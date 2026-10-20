import { useEffect, useState, useCallback } from "react";
import {
  Database,
  Upload,
  RefreshCw,
  Download,
  Trash2,
  Globe,
  AlertTriangle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  HardDrive,
  Clock,
} from "lucide-react";
import {
  getBackups,
  backupDatabase,
  backupUploads,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  getMaintenanceStatus,
  toggleMaintenance,
} from "../../../services/backupService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { Backup } from "../../types/backup";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function BackupSettingsPanel({ lang }: { lang: Lang }) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);

  const [restoringBackup, setRestoringBackup] = useState<Backup | null>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const [deletingBackup, setDeletingBackup] = useState<Backup | null>(null);

  const loadBackups = useCallback(async () => {
    try {
      setLoading((prev) => (backups.length === 0 ? true : prev));
      setError("");
      const response = await getBackups();
      setBackups(response.data);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load backup history.",
          "උපස්ථ ඉතිහාසය පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [lang, backups.length]);

  useEffect(() => {
    loadBackups();
    getMaintenanceStatus()
      .then((res) => setMaintenanceEnabled(res.data.enabled))
      .catch((err) => console.error(err))
      .finally(() => setLoadingMaintenance(false));
  }, [loadBackups]);

  async function handleBackupDatabase() {
    try {
      setBusyAction("db-backup");
      setError("");
      setSuccess("");
      await backupDatabase();
      await loadBackups();
      setSuccess(
        t(
          lang,
          "Database backup created successfully.",
          "දත්ත සමුදායේ උපස්ථය සාර්ථකව සාදන ලදී."
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to create database backup.",
          "දත්ත සමුදාය උපස්ථ කිරීමට නොහැක."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleBackupUploads() {
    try {
      setBusyAction("uploads-backup");
      setError("");
      await backupUploads();
      await loadBackups();
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to create uploads backup.",
          "උඩුගත ගොනු උපස්ථ කිරීමට නොහැක."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownload(backup: Backup) {
    try {
      setBusyAction(`download-${backup.id}`);
      await downloadBackup(backup);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to download this backup.",
          "මෙම උපස්ථය බාගත කළ නොහැක."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDelete() {
    if (!deletingBackup) return;
    try {
      setBusyAction(`delete-${deletingBackup.id}`);
      await deleteBackup(deletingBackup.id);
      setBackups((current) => current.filter((b) => b.id !== deletingBackup.id));
      setDeletingBackup(null);
    } catch (err) {
      console.error(err);
      setError(
        t(lang, "Unable to delete this backup.", "මෙම උපස්ථය මකා දැමිය නොහැක.")
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRestore() {
    if (!restoringBackup || confirmationText !== "RESTORE") return;
    try {
      setBusyAction(`restore-${restoringBackup.id}`);
      setError("");
      await restoreBackup(restoringBackup.id);
      setRestoringBackup(null);
      setConfirmationText("");
      alert(
        t(
          lang,
          "Database restored successfully. The page will now reload.",
          "දත්ත සමුදාය සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී. පිටුව නැවත පූරණය වේ."
        )
      );
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Restore failed. Please check server logs.",
          "ප්‍රතිස්ථාපනය අසාර්ථක විය. සර්වර් ලොග් පරීක්ෂා කරන්න."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleMaintenance() {
    const next = !maintenanceEnabled;
    try {
      setBusyAction("maintenance");
      await toggleMaintenance(next);
      setMaintenanceEnabled(next);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to update maintenance mode.",
          "නඩත්තු ප්‍රකාරය යාවත්කාලීන කළ නොහැක."
        )
      );
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200/80 rounded-2xl p-4 text-xs font-semibold text-green-700 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ERROR ALERT */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* MANUAL ACTIONS PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Manual Actions", "අතින් ක්‍රියා")}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {t(lang, "One-time maintenance operations", "එක්වර නඩත්තු මෙහෙයුම්")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleBackupDatabase}
            disabled={busyAction === "db-backup"}
            className="h-10 px-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {busyAction === "db-backup" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Database className="w-4 h-4 text-slate-500" />
            )}
            <span>{t(lang, "Backup Database", "දත්ත සමුදාය උපස්ථ කරන්න")}</span>
          </button>

          <button
            type="button"
            onClick={handleBackupUploads}
            disabled={busyAction === "uploads-backup"}
            className="h-10 px-4 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {busyAction === "uploads-backup" ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-4 h-4 text-slate-500" />
            )}
            <span>{t(lang, "Backup Uploads", "උඩුගත ගොනු උපස්ථ කරන්න")}</span>
          </button>

          <button
            type="button"
            onClick={loadBackups}
            className="h-10 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>{t(lang, "Refresh", "නැවුම් කරන්න")}</span>
          </button>
        </div>
      </div>

      {/* BACKUP HISTORY */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Backup History", "උපස්ථ ඉතිහාසය")}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {t(
              lang,
              "Download or delete previous manual database and uploaded file backups",
              "පෙර දත්ත සමුදාය සහ ගොනු උපස්ථ බාගත කරන්න හෝ මකන්න"
            )}
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs font-semibold">
              {t(lang, "Loading…", "පූරණය වෙමින්…")}
            </p>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-8 text-center text-xs font-medium text-slate-400">
            {t(lang, "No backups yet.", "උපස්ථ නොමැත.")}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      {t(lang, "File Name", "ගොනු නාමය")}
                    </th>
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      {t(lang, "Type", "වර්ගය")}
                    </th>
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      {t(lang, "Created At", "සාදන ලද දිනය")}
                    </th>
                    <th className="px-5 py-3.5 whitespace-nowrap">
                      {t(lang, "File Size", "ගොනු ප්‍රමාණය")}
                    </th>
                    <th className="px-5 py-3.5 text-right whitespace-nowrap">
                      {t(lang, "Actions", "ක්‍රියා")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {backups.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {b.file_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            b.type === "DATABASE"
                              ? "bg-blue-50 text-blue-700 border-blue-200/80"
                              : "bg-purple-50 text-purple-700 border-purple-200/80"
                          }`}
                        >
                          {b.type === "DATABASE"
                            ? t(lang, "Database", "දත්ත සමුදාය")
                            : t(lang, "Uploads", "උඩුගත ගොනු")}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(b.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {formatFileSize(b.file_size)}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(b)}
                            disabled={busyAction === `download-${b.id}`}
                            title={t(lang, "Download", "බාගත කරන්න")}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {busyAction === `download-${b.id}` ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>

                          {b.type === "DATABASE" && (
                            <button
                              type="button"
                              onClick={() => {
                                setRestoringBackup(b);
                                setConfirmationText("");
                              }}
                              title={t(lang, "Restore", "ප්‍රතිස්ථාපනය කරන්න")}
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setDeletingBackup(b)}
                            title={t(lang, "Delete", "මකන්න")}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (<md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {backups.map((b) => (
                <div key={b.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          b.type === "DATABASE"
                            ? "bg-blue-50 text-blue-700 border-blue-200/80"
                            : "bg-purple-50 text-purple-700 border-purple-200/80"
                        }`}
                      >
                        {b.type === "DATABASE"
                          ? t(lang, "Database", "දත්ත සමුදාය")
                          : t(lang, "Uploads", "උඩුගත ගොනු")}
                      </span>
                      <p className="font-mono text-xs font-bold text-slate-900 break-all pt-1">
                        {b.file_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(b)}
                        disabled={busyAction === `download-${b.id}`}
                        className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {b.type === "DATABASE" && (
                        <button
                          type="button"
                          onClick={() => {
                            setRestoringBackup(b);
                            setConfirmationText("");
                          }}
                          className="w-8 h-8 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-700 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingBackup(b)}
                        className="w-8 h-8 rounded-xl border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-700 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">
                        {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 text-slate-500 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{formatFileSize(b.file_size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MAINTENANCE MODE SWITCH */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Maintenance Mode", "නඩත්තු ප්‍රකාරය")}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-slate-400">
            {t(
              lang,
              "Take the system offline for maintenance",
              "නඩත්තු සඳහා පද්ධතිය නොබැඳගත් කරන්න"
            )}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {t(lang, "Enable Maintenance Mode", "නඩත්තු ප්‍රකාරය සක්‍රිය කරන්න")}
              </p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                {t(
                  lang,
                  "Users will see a maintenance page and cannot access the system",
                  "පරිශීලකයන්ට නඩත්තු පිටුවක් පෙන්වන අතර පද්ධතියට ප්‍රවේශ විය නොහැක"
                )}
              </p>
            </div>
          </div>

          {loadingMaintenance ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
            <button
                type="button"
                onClick={handleToggleMaintenance}
                disabled={busyAction === "maintenance"}
                aria-pressed={maintenanceEnabled}
                className={`
                relative h-6 w-11 shrink-0 rounded-full
                transition-colors duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-blue-500/30
                disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer
                ${maintenanceEnabled ? "bg-blue-600" : "bg-slate-300"}
                `}
            >
                <span
                className={`
                    absolute top-0.5 left-0.5
                    h-5 w-5 rounded-full bg-white
                    shadow-md
                    transform-gpu
                    transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${
                    maintenanceEnabled
                        ? "translate-x-5"
                        : "translate-x-0"
                    }
                `}
                />
            </button>
            )}
        </div>
      </div>

      {/* DELETE CONFIRMATION DIALOG MODAL */}
      {deletingBackup && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
          <div
            onClick={() => setDeletingBackup(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 p-5 space-y-4 my-auto">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Delete this backup?", "මෙම උපස්ථය මකන්නද?")}
              </h4>
              <p className="mt-1 font-mono text-xs font-bold text-slate-500 break-all bg-slate-50 p-2 rounded-xl border border-slate-100">
                {deletingBackup.file_name}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingBackup(null)}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busyAction === `delete-${deletingBackup.id}`}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {busyAction === `delete-${deletingBackup.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>{t(lang, "Delete", "මකන්න")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION DIALOG MODAL */}
      {restoringBackup && (
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
          <div
            onClick={() => {
              setRestoringBackup(null);
              setConfirmationText("");
            }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {t(lang, "Restore Database", "දත්ත සමුදාය ප්‍රතිස්ථාපනය")}
                  </h4>
                  <p className="text-[10px] font-mono font-bold text-slate-400">
                    CRITICAL OPERATION
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRestoringBackup(null);
                  setConfirmationText("");
                }}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-medium text-slate-600 leading-relaxed bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-2xl text-amber-800">
                {t(
                  lang,
                  "This will permanently overwrite the current database with the contents of this backup. This action cannot be undone. The system will go into maintenance mode during the restore.",
                  "මෙය වත්මන් දත්ත සමුදාය මෙම උපස්ථයේ අන්තර්ගතය සමඟ ස්ථිරවම ප්‍රතිස්ථාපනය කරයි. මෙය ආපසු හැරවිය නොහැක."
                )}
              </p>

              <p className="font-mono text-xs font-bold text-slate-500 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {restoringBackup.file_name}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t(lang, 'Type "RESTORE" to confirm', '"RESTORE" ලෙස ටයිප් කර තහවුරු කරන්න')}
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="RESTORE"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRestoringBackup(null);
                  setConfirmationText("");
                }}
                className="h-9 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                {t(lang, "Cancel", "අවලංගු")}
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={
                  confirmationText !== "RESTORE" ||
                  busyAction === `restore-${restoringBackup.id}`
                }
                className="h-9 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                {busyAction === `restore-${restoringBackup.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                <span>
                  {busyAction === `restore-${restoringBackup.id}`
                    ? t(lang, "Restoring…", "ප්‍රතිස්ථාපනය වෙමින්…")
                    : t(lang, "Restore Database", "දත්ත සමුදාය ප්‍රතිස්ථාපනය")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

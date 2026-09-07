import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Database, 
  HardDrive, 
  Sliders, 
  RefreshCw, 
  Cloud, 
  FileText, 
  ShieldCheck, 
  Download, 
  Sparkles,
  Server,
  Layers,
  CheckCircle2,
  Cpu,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import type { 
  AuditDiscrepancy, 
  WrongPickingItem, 
  AppSettings, 
  SyncMetadata, 
  MasterInvoiceItem 
} from '../types';
import { ErrorReportScreen } from './ErrorReportScreen';
import { MasterDatabaseView } from './MasterDatabaseView';
import { ScannerSimulator } from './ScannerSimulator';

export type ArchiveSubTab = 'discrepancies' | 'master' | 'data-sync' | 'simulator-tools';

interface ArchiveAndAppDataScreenProps {
  initialSubTab?: ArchiveSubTab;
  discrepancies: AuditDiscrepancy[];
  wrongPickings: WrongPickingItem[];
  onRefreshDiscrepancies: () => void;
  onRefreshWrongPickings: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  syncMeta: SyncMetadata;
  onOpenSyncModal: () => void;
  onSelectInvoice: (invNo: string) => void;
  onSimulateScan: (code: string) => Promise<void>;
  activeInvoiceNo: string | null;
  masterItems: MasterInvoiceItem[];
  onOpenAuditorModal?: () => void;
  onOpenFirebaseModal?: () => void;
  onOpenApkGuide?: () => void;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
}

export const ArchiveAndAppDataScreen: React.FC<ArchiveAndAppDataScreenProps> = ({
  initialSubTab = 'discrepancies',
  discrepancies,
  wrongPickings,
  onRefreshDiscrepancies,
  onRefreshWrongPickings,
  settings,
  onUpdateSettings,
  syncMeta,
  onOpenSyncModal,
  onSelectInvoice,
  onSimulateScan,
  activeInvoiceNo,
  masterItems,
  onOpenAuditorModal,
  onOpenFirebaseModal,
  onOpenApkGuide,
  canInstallPwa,
  onInstallPwa,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ArchiveSubTab>(initialSubTab);
  const isRtl = settings.language === 'ar';
  const totalIssues = discrepancies.length + wrongPickings.length;

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // JSON backup export for all discrepancies & system audit data
  const handleExportSystemJsonBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      syncMetadata: syncMeta,
      auditor: {
        name: settings.auditorName,
        id: settings.auditorId,
        title: settings.auditorTitle,
      },
      stats: {
        totalDiscrepancies: discrepancies.length,
        totalWrongPickings: wrongPickings.length,
        totalMasterItems: masterItems.length,
      },
      discrepancies,
      wrongPickings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wms-audit-archive-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Banner & Unified Technical Hub Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 border border-indigo-500/40 text-white flex items-center justify-center shadow-lg shadow-indigo-950">
              <Database className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {isRtl ? 'الأرشيف وبيانات التطبيق والمنظومة' : 'Archive & System Application Data'}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  HUB_v4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isRtl 
                  ? 'المركز الموحد للأرشفة الرقابية: سجل الفروقات، قاعدة فواتير اليوم، كفاءة التخزين المحلي والمزامنة، ومحاكي الباركود'
                  : 'Unified operational archive: discrepancies, daily master records, storage telemetry, and scanner simulation'}
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenSyncModal && (
              <button
                onClick={onOpenSyncModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition-all active:scale-95 shadow-sm"
                title={isRtl ? 'تحديث ملف الإكسيل اليومي' : 'Update Excel Master Data'}
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isRtl ? 'تحديث الإكسيل' : 'Update Excel'}</span>
                {syncMeta.totalInvoices > 0 && (
                  <span className="bg-emerald-900 text-emerald-200 text-[10px] px-1.5 rounded font-mono">
                    {syncMeta.totalInvoices}
                  </span>
                )}
              </button>
            )}

            {onOpenFirebaseModal && (
              <button
                onClick={onOpenFirebaseModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-700/60 text-xs font-bold transition-all active:scale-95 shadow-sm"
                title={isRtl ? 'المزامنة مع قاعدة بيانات Firebase' : 'Firebase Cloud Sync'}
              >
                <Cloud className="w-3.5 h-3.5 text-amber-400" />
                <span>{isRtl ? 'سحابة Firebase' : 'Cloud Sync'}</span>
              </button>
            )}

            <button
              onClick={handleExportSystemJsonBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95 shadow-sm"
              title={isRtl ? 'تنزيل نسخة احتياطية كاملة بصيغة JSON' : 'Export JSON System Backup'}
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{isRtl ? 'نسخة JSON' : 'Export JSON'}</span>
            </button>
          </div>
        </div>

        {/* High-Tech Sub-Navigation Tabs Bar */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
          {/* Sub-tab 1: Discrepancies */}
          <button
            onClick={() => setActiveSubTab('discrepancies')}
            id="archive-tab-discrepancies"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'discrepancies'
                ? 'bg-rose-950 text-rose-200 border border-rose-600 shadow-md ring-1 ring-rose-500/50'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${activeSubTab === 'discrepancies' ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>{isRtl ? 'سجل الفروقات والتنبيهات' : 'Discrepancy Records'}</span>
            {totalIssues > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-black ${
                activeSubTab === 'discrepancies' ? 'bg-rose-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-700'
              }`}>
                {totalIssues}
              </span>
            )}
          </button>

          {/* Sub-tab 2: Master Invoices */}
          <button
            onClick={() => setActiveSubTab('master')}
            id="archive-tab-master"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'master'
                ? 'bg-indigo-950 text-indigo-200 border border-indigo-600 shadow-md ring-1 ring-indigo-500/50'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Database className={`w-4 h-4 ${activeSubTab === 'master' ? 'text-indigo-400' : 'text-slate-400'}`} />
            <span>{isRtl ? 'أرشيف فواتير اليوم' : 'Daily Invoices'}</span>
            {syncMeta.totalInvoices > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                activeSubTab === 'master' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {syncMeta.totalInvoices}
              </span>
            )}
          </button>

          {/* Sub-tab 3: Data & Storage Hub */}
          <button
            onClick={() => setActiveSubTab('data-sync')}
            id="archive-tab-data-sync"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'data-sync'
                ? 'bg-cyan-950 text-cyan-200 border border-cyan-600 shadow-md ring-1 ring-cyan-500/50'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'
            }`}
          >
            <HardDrive className={`w-4 h-4 ${activeSubTab === 'data-sync' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{isRtl ? 'بيانات النظام والتخزين' : 'Storage & App Data'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Sub-tab 4: Scanner Simulator & Tools */}
          <button
            onClick={() => setActiveSubTab('simulator-tools')}
            id="archive-tab-simulator-tools"
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'simulator-tools'
                ? 'bg-purple-950 text-purple-200 border border-purple-600 shadow-md ring-1 ring-purple-500/50'
                : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeSubTab === 'simulator-tools' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>{isRtl ? 'محاكي الباركود والإعدادات' : 'Simulator & Tools'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab View 1: Discrepancies & Discarded Wrong Pickings */}
      {activeSubTab === 'discrepancies' && (
        <div className="animate-in fade-in duration-150">
          <ErrorReportScreen
            discrepancies={discrepancies}
            wrongPickings={wrongPickings}
            onRefreshDiscrepancies={onRefreshDiscrepancies}
            onRefreshWrongPickings={onRefreshWrongPickings}
            settings={settings}
            onOpenAuditorModal={onOpenAuditorModal || (() => {})}
          />
        </div>
      )}

      {/* Sub-tab View 2: Master Database View */}
      {activeSubTab === 'master' && (
        <div className="animate-in fade-in duration-150">
          <MasterDatabaseView
            syncMeta={syncMeta}
            onOpenSyncModal={onOpenSyncModal}
            onSelectInvoice={onSelectInvoice}
          />
        </div>
      )}

      {/* Sub-tab View 3: Data & Storage Health Hub */}
      {activeSubTab === 'data-sync' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Storage & Telemetry Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{isRtl ? 'حالة التخزين المحلي' : 'Local IndexedDB'}</span>
                <Server className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-black text-white mt-1 font-mono">100% Offline</div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{isRtl ? 'جاهز للاستخدام بدون إنترنت' : 'Zero internet dependency'}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{isRtl ? 'إجمالي الأصناف بالقاعدة' : 'Total Master Items'}</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-black text-white mt-1 font-mono">
                {masterItems.length.toLocaleString()} <span className="text-xs text-slate-400 font-normal">{isRtl ? 'صنف' : 'items'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {syncMeta.totalInvoices} {isRtl ? 'فاتورة وأمر مفتوح' : 'Invoices loaded'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{isRtl ? 'آخر مزامنة إكسيل' : 'Last Excel Sync'}</span>
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-sm font-black text-slate-200 mt-1 truncate">
                {syncMeta.fileName || (isRtl ? 'لم يُرفع ملف بعد' : 'No file loaded')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                {syncMeta.lastSyncDate ? new Date(syncMeta.lastSyncDate).toLocaleString() : '---'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">{isRtl ? 'مخزن التنبيهات والأخطاء' : 'Archived Discrepancies'}</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className={`text-xl font-black mt-1 font-mono ${totalIssues > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalIssues} <span className="text-xs text-slate-400 font-normal">{isRtl ? 'سجل' : 'records'}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {discrepancies.length} {isRtl ? 'فروقات كمية' : 'variances'}, {wrongPickings.length} {isRtl ? 'أصناف خاطئة' : 'wrong pickings'}
              </div>
            </div>
          </div>

          {/* Diagnostics and Action Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sync & Backup Management */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? 'إدارة السلامة الرقابية والنسخ الاحتياطي' : 'Audit Integrity & Data Export'}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isRtl
                  ? 'يتم الاحتفاظ بكافة بيانات الفحص اليومي، الفروقات المكتشفة، وتوقيعات المراجعين في قاعدة بيانات المتصفح المحلية فائقة السرعة مع إمكانية التصدير اللحظي.'
                  : 'All operational records, discrepancy logs, and auditor signatures are securely kept in local IndexedDB storage with instant JSON and Excel export capability.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleExportSystemJsonBackup}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>{isRtl ? 'تحميل كامل الأرشيف (JSON)' : 'Download Full Archive (JSON)'}</span>
                </button>

                {onOpenSyncModal && (
                  <button
                    onClick={onOpenSyncModal}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700 text-xs font-bold transition-all shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>{isRtl ? 'استيراد إكسيل جديد' : 'Import New Excel'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cloud & Progressive Web App Status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Cloud className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'التكامل السحابي وحزمة الأندرويد' : 'Cloud Integration & Android Pack'}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isRtl
                  ? 'يمكن ربط المنظومة مع Firebase لمزامنة الفواتير عبر فرق العمل والمستودعات المتعددة، أو تصدير المنظومة إلى تطبيق أندرويد APK مستقل.'
                  : 'Sync invoices across multi-warehouse operations via Firebase, or deploy as a native Android APK package.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {onOpenFirebaseModal && (
                  <button
                    onClick={onOpenFirebaseModal}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-700 text-xs font-bold transition-all shadow-sm"
                  >
                    <Cloud className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? 'إعدادات مزامنة Firebase' : 'Firebase Cloud Sync'}</span>
                  </button>
                )}

                {onOpenApkGuide && (
                  <button
                    onClick={onOpenApkGuide}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-950 text-indigo-300 hover:bg-indigo-900 border border-indigo-700 text-xs font-bold transition-all shadow-sm"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <span>{isRtl ? 'دليل تطبيق أندرويد APK' : 'Android APK Guide'}</span>
                  </button>
                )}

                {canInstallPwa && onInstallPwa && (
                  <button
                    onClick={onInstallPwa}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-950 text-teal-300 hover:bg-teal-900 border border-teal-700 text-xs font-bold transition-all shadow-sm animate-pulse"
                  >
                    <Smartphone className="w-4 h-4 text-teal-400" />
                    <span>{isRtl ? 'تثبيت تطبيق PWA' : 'Install PWA'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab View 4: Scanner Simulator & Hardware Tools */}
      {activeSubTab === 'simulator-tools' && (
        <div className="animate-in fade-in duration-150">
          <ScannerSimulator
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onSimulateScan={onSimulateScan}
            activeInvoiceNo={activeInvoiceNo}
            masterItems={masterItems}
            onOpenAuditorModal={onOpenAuditorModal}
            canInstallPwa={canInstallPwa}
            onInstallPwa={onInstallPwa}
          />
        </div>
      )}
    </div>
  );
};

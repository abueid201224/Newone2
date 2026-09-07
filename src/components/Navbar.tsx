import React from 'react';
import { 
  ScanLine, 
  Volume2, 
  VolumeX, 
  WifiOff, 
  CheckCircle2,
  Languages,
  Smartphone,
  UserCheck,
  RotateCcw,
  Boxes,
  Menu,
  BookOpen,
  Cloud,
  ExternalLink,
  Eye,
  Sun,
  Moon,
  Database,
  RefreshCw
} from 'lucide-react';
import type { SyncMetadata, AppSettings, LightingMode } from '../types';
import { translations } from '../services/i18n';
import type { LogicGuideTab } from './LogicGuideModal';
import { useAuth } from '../context/AuthContext';

export type ActiveNavTab = 'welcome' | 'audit' | 'receiving' | 'returns' | 'inventory' | 'picking' | 'archive' | 'errors' | 'master' | 'settings';

interface NavbarProps {
  currentTab: ActiveNavTab;
  setCurrentTab: (tab: ActiveNavTab) => void;
  syncMeta: SyncMetadata;
  onOpenSyncModal: () => void;
  errorCount: number;
  wrongPickingCount?: number;
  overdueLabCount?: number;
  pendingLabCount?: number;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => Promise<void>;
  onToggleSound: () => void;
  onToggleLanguage: () => void;
  isScannerActive: boolean;
  canInstallPwa?: boolean;
  onInstallPwa?: () => void;
  onOpenAuditorModal?: () => void;
  onOpenUserModal?: () => void;
  onToggleDrawer?: () => void;
  onToggleSidebar?: () => void;
  onOpenApkGuide?: () => void;
  onOpenFirebaseModal?: () => void;
  onOpenLogicGuide?: (tab?: LogicGuideTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  syncMeta,
  onOpenSyncModal,
  errorCount,
  wrongPickingCount = 0,
  overdueLabCount = 0,
  pendingLabCount = 0,
  settings,
  onUpdateSettings,
  onToggleSound,
  onToggleLanguage,
  isScannerActive,
  canInstallPwa,
  onInstallPwa,
  onOpenAuditorModal,
  onOpenUserModal,
  onToggleDrawer,
  onToggleSidebar,
  onOpenApkGuide,
  onOpenFirebaseModal,
  onOpenLogicGuide,
}) => {
  const { currentAppUser, roleConfig } = useAuth();
  const t = translations[settings.language] || translations.en;
  const isRtl = settings.language === 'ar';
  const lightingMode: LightingMode = settings.lightingMode || 'eye-comfort';

  const handleCycleLighting = () => {
    if (!onUpdateSettings) return;
    const nextMode: LightingMode = 
      lightingMode === 'eye-comfort' ? 'high-contrast' :
      lightingMode === 'high-contrast' ? 'warm-amber' : 'eye-comfort';
    onUpdateSettings({ ...settings, lightingMode: nextMode });
  };

  const getActiveTabTitle = () => {
    switch (currentTab) {
      case 'welcome': return isRtl ? 'الرئيسية (لوحة التحكم)' : 'Home Hub';
      case 'receiving': return isRtl ? 'الاستلام ومطابقة الشحنات' : 'Inbound Receiving';
      case 'picking': return isRtl ? 'قوائم الانتقاء والتجهيز' : 'Wave Picking';
      case 'audit': return isRtl ? 'المراجعة والتدقيق والباركود' : 'Dispatch Audit';
      case 'inventory': return isRtl ? 'الجرد وتفكيك العبوات' : 'Cycle Count';
      case 'returns': return isRtl ? 'المرتجعات وفحص الجودة' : 'Returns & Lab';
      case 'archive': return isRtl ? 'الأرشيف وبيانات التطبيق' : 'Archive & App Data';
      case 'errors': return isRtl ? 'تقرير الفروقات (الأرشيف)' : 'Discrepancies Archive';
      case 'master': return isRtl ? 'أرشيف فواتير اليوم' : 'Daily Master Archive';
      case 'settings': return isRtl ? 'محاكي الباركود والإعدادات' : 'Simulator & Settings';
      default: return isRtl ? 'الخدمة النشطة' : 'Active Workstation';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
      {/* Primary Executive Telemetry Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Sidebar Toggle & Active Workstation Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Vertical Sidebar / Drawer Toggle */}
          <button
            onClick={onToggleSidebar || onToggleDrawer}
            id="top-sidebar-toggle-btn"
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 shadow-sm transition-all active:scale-95 shrink-0"
            title={isRtl ? 'فتح / طي القائمة الجانبية للخدمات' : 'Toggle Vertical Services Sidebar'}
          >
            <Menu className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-bold text-slate-200">
              {isRtl ? 'الخدمات' : 'Services'}
            </span>
          </button>

          {/* Active Workstation Pill (High-tech visual breadcrumb) */}
          <div className="flex items-center gap-2 min-w-0">
            <div 
              onClick={() => setCurrentTab('welcome')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-600/50 cursor-pointer transition-all shrink-0"
              title={isRtl ? 'العودة للرئيسية' : 'Return to Home'}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-slate-100 hidden sm:inline">Smart WMS</span>
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-slate-400 text-xs hidden md:inline">/</span>
              <span className="text-xs sm:text-sm font-black text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2.5 py-1 rounded-xl truncate">
                {getActiveTabTitle()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Technical Controls & Lighting Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Eye-Comfort Screen Lighting Quick Toggle */}
          <button
            onClick={handleCycleLighting}
            id="navbar-lighting-toggle-btn"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm active:scale-95 ${
              lightingMode === 'eye-comfort'
                ? 'bg-teal-950/80 text-teal-300 border-teal-600/60 hover:bg-teal-900/60'
                : lightingMode === 'high-contrast'
                ? 'bg-slate-800 text-amber-300 border-amber-500/60 hover:bg-slate-700'
                : 'bg-amber-950/80 text-amber-200 border-amber-600/60 hover:bg-amber-900/60'
            }`}
            title={isRtl 
              ? `إضاءة الشاشة: ${lightingMode === 'eye-comfort' ? 'مريح للعين (Low-Glare)' : lightingMode === 'high-contrast' ? 'تباين عالي (Daylight)' : 'ليلي دافئ (Warm Amber)'}. انقر للتبديل` 
              : `Display Lighting: ${lightingMode}. Click to toggle`}
          >
            {lightingMode === 'eye-comfort' && <Eye className="w-4 h-4 text-teal-400" />}
            {lightingMode === 'high-contrast' && <Sun className="w-4 h-4 text-amber-400" />}
            {lightingMode === 'warm-amber' && <Moon className="w-4 h-4 text-amber-500" />}
            <span className="hidden lg:inline">
              {lightingMode === 'eye-comfort' ? (isRtl ? 'مريح للعين' : 'Eye Comfort') :
               lightingMode === 'high-contrast' ? (isRtl ? 'تباين عالي' : 'High Contrast') :
               (isRtl ? 'ليلي دافئ' : 'Warm Amber')}
            </span>
          </button>

          {/* Logic & Math Guide Trigger */}
          {onOpenLogicGuide && (
            <button
              id="navbar-logic-guide-btn"
              onClick={() => onOpenLogicGuide(currentTab === 'welcome' ? 'all' : (currentTab as LogicGuideTab))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-xs font-bold text-purple-300 transition-all shadow-sm active:scale-95"
              title={isRtl ? 'دليل المنطق والمعادلات والحلول الرقابية' : 'WMS Logic & Troubleshooting Guide'}
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline">{isRtl ? 'دليل المنطق 💡' : 'Logic Guide'}</span>
            </button>
          )}

          {/* Open in Separate Tab Button */}
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            id="navbar-open-new-tab-btn"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 text-xs font-bold text-sky-300 transition-all shadow-sm active:scale-95"
            title={isRtl ? 'فتح في تبويب منفصل بالكامل' : 'Open preview in a separate tab'}
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">{isRtl ? 'تبويب منفصل ↗' : 'New Tab ↗'}</span>
          </a>

          {/* Hardware Scanner Pulse indicator */}
          <div 
            title={isScannerActive ? "Hardware Scanner Ready & Connected" : "Listening for Barcode Key-Wedge"}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300"
          >
            <span className={`w-2 h-2 rounded-full ${isScannerActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
            <span className="font-mono text-[11px]">{t.scannerReady}</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            title={isRtl ? "Switch to English" : "التحويل للغة العربية"}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">{isRtl ? 'EN' : 'عربي'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={settings.soundEnabled ? "Mute Audible Scan Feedback" : "Enable Audible Scan Feedback"}
            className={`p-1.5 rounded-xl border transition-colors ${
              settings.soundEnabled 
                ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* User Account / Role Trigger Button */}
          <button
            onClick={() => {
              if (onOpenUserModal) onOpenUserModal();
              else if (onOpenAuditorModal) onOpenAuditorModal();
            }}
            id="navbar-user-profile-btn"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-emerald-600/50 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 transition-colors shadow-sm"
            title={isRtl ? 'إدارة المستخدمين والصلاحيات' : 'User Account & RBAC Permissions'}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">{currentAppUser?.name || settings.auditorName || 'المراجع'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold border ${roleConfig.color} ${roleConfig.bgLight}`}>
              {isRtl ? roleConfig.labelAr : roleConfig.labelEn}
            </span>
          </button>

          {/* CRITICAL: Daily Excel Update Button */}
          <button
            id="daily-excel-sync-btn"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all border border-emerald-400/40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{t.updateExcel}</span>
            <span className="xs:hidden">{t.sync}</span>
            {syncMeta.totalInvoices > 0 && (
              <span className="bg-emerald-950 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono border border-emerald-700/50">
                {syncMeta.totalInvoices}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sleek Minimal Daily Master Data Telemetry Strip */}
      {syncMeta.lastSyncDate && (
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-3 sm:px-4 py-1 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">
              {isRtl ? 'قاعدة بيانات اليوم:' : 'Daily Master Data:'} <strong className="text-slate-200">{syncMeta.fileName || 'Active Dataset'}</strong> ({syncMeta.totalInvoices} {isRtl ? 'فواتير' : 'Invoices'}, {syncMeta.totalItems} {isRtl ? 'صنف' : 'Items'})
            </span>
          </div>
          <span className="hidden sm:inline font-mono shrink-0">
            {isRtl ? 'توقيت التحديث:' : 'Synced:'} {new Date(syncMeta.lastSyncDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )}
    </header>
  );
};





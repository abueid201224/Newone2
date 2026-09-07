import React from 'react';
import { 
  Home,
  Truck, 
  ScanLine, 
  RotateCcw, 
  Boxes, 
  ListFilter, 
  Database, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Eye,
  ShieldCheck,
  UserCheck,
  Sparkles,
  BookOpen,
  WifiOff,
  RefreshCw,
  X
} from 'lucide-react';
import type { ActiveNavTab } from './Navbar';
import type { AppSettings, SyncMetadata, ActiveInvoiceSession, LightingMode } from '../types';
import type { LogicGuideTab } from './LogicGuideModal';
import { useAuth } from '../context/AuthContext';

interface VerticalSidebarProps {
  currentTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => Promise<void>;
  syncMeta: SyncMetadata;
  errorCount: number;
  pendingLabCount?: number;
  overdueLabCount?: number;
  activeSession: ActiveInvoiceSession | null;
  onOpenSyncModal: () => void;
  onOpenUserModal: () => void;
  onOpenLogicGuide?: (tab?: LogicGuideTab) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const VerticalSidebar: React.FC<VerticalSidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  settings,
  onUpdateSettings,
  syncMeta,
  errorCount,
  pendingLabCount = 0,
  overdueLabCount = 0,
  activeSession,
  onOpenSyncModal,
  onOpenUserModal,
  onOpenLogicGuide,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentAppUser, roleConfig } = useAuth();
  const isRtl = settings.language === 'ar';
  const lightingMode: LightingMode = settings.lightingMode || 'eye-comfort';

  const handleLightingChange = (mode: LightingMode) => {
    onUpdateSettings({ ...settings, lightingMode: mode });
  };

  const navItems: {
    id: ActiveNavTab;
    titleAr: string;
    titleEn: string;
    descAr: string;
    descEn: string;
    icon: React.ElementType;
    color: string;
    activeBg: string;
    activeBorder: string;
    badge?: string | number | null;
    badgeColor?: string;
  }[] = [
    {
      id: 'welcome',
      titleAr: 'الرئيسية',
      titleEn: 'Home Hub',
      descAr: 'لوحة التحكم السريعة',
      descEn: 'Overview & quick actions',
      icon: Home,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950/80 text-emerald-300',
      activeBorder: 'border-emerald-600/70',
    },
    {
      id: 'receiving',
      titleAr: 'الاستلام والمطابقة',
      titleEn: 'Inbound Receiving',
      descAr: 'فحص الشحنات وأوامر الشراء',
      descEn: 'Inspect inbound shipments',
      icon: Truck,
      color: 'text-blue-400',
      activeBg: 'bg-blue-950/80 text-blue-300',
      activeBorder: 'border-blue-600/70',
    },
    {
      id: 'audit',
      titleAr: 'المراجعة والتدقيق',
      titleEn: 'Dispatch Audit',
      descAr: 'مسح الباركود واكتشاف الفوارق',
      descEn: 'Barcode scan & error detection',
      icon: ScanLine,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-950/80 text-emerald-300',
      activeBorder: 'border-emerald-600/70',
      badge: activeSession ? (isRtl ? `ف: ${activeSession.invoiceNo}` : `Inv: ${activeSession.invoiceNo}`) : null,
      badgeColor: 'bg-emerald-900 text-emerald-200 border border-emerald-600 animate-pulse font-mono',
    },
    {
      id: 'returns',
      titleAr: 'المرتجعات وفحص الجودة',
      titleEn: 'Returns & Lab',
      descAr: 'استلام RMA وفحص المعمل',
      descEn: 'Process returns & quality lab',
      icon: RotateCcw,
      color: 'text-amber-400',
      activeBg: 'bg-amber-950/80 text-amber-300',
      activeBorder: 'border-amber-600/70',
      badge: pendingLabCount > 0 ? pendingLabCount : null,
      badgeColor: overdueLabCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white',
    },
    {
      id: 'inventory',
      titleAr: 'الجرد وتفكيك العبوات',
      titleEn: 'Cycle Count',
      descAr: 'تفكيك الكراتين والباكتات والقطع',
      descEn: 'Carton/pack decomposition',
      icon: Boxes,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-950/80 text-indigo-300',
      activeBorder: 'border-indigo-600/70',
    },
    {
      id: 'picking',
      titleAr: 'قوائم الانتقاء والتجهيز',
      titleEn: 'Wave Picking',
      descAr: 'موجات السحب حسب خبرة العمال',
      descEn: 'Batch multi-order picking',
      icon: ListFilter,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-950/80 text-cyan-300',
      activeBorder: 'border-cyan-600/70',
    },
    {
      id: 'archive',
      titleAr: 'الأرشيف وبيانات التطبيق',
      titleEn: 'Archive & App Data',
      descAr: 'سجل الفروقات، الفواتير، والأدوات',
      descEn: 'Discrepancies, master & config',
      icon: Database,
      color: 'text-purple-400',
      activeBg: 'bg-purple-950/80 text-purple-300',
      activeBorder: 'border-purple-600/70',
      badge: errorCount > 0 ? errorCount : (syncMeta.totalInvoices > 0 ? syncMeta.totalInvoices : null),
      badgeColor: errorCount > 0 ? 'bg-rose-600 text-white font-mono' : 'bg-slate-800 text-slate-300 border border-slate-700 font-mono',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-e border-slate-800 select-none">
      {/* Brand Header */}
      <div className={`p-3.5 border-b border-slate-800/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onSelectTab('welcome')}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950 cursor-pointer hover:scale-105 transition-transform"
            >
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-white text-sm tracking-tight">Smart WMS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-700/60 font-bold">
                  v4.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                {isRtl ? 'المستودع الذكي Offline' : 'Offline Industrial WMS'}
              </p>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => onSelectTab('welcome')}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-950 cursor-pointer"
            title={isRtl ? 'الرئيسية' : 'Home'}
          >
            <ScanLine className="w-5 h-5 animate-pulse" />
          </div>
        )}

        {/* Mobile close button or Desktop collapse toggle */}
        {isMobileOpen ? (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={isCollapsed ? (isRtl ? 'توسيع القائمة' : 'Expand Sidebar') : (isRtl ? 'تصغير القائمة' : 'Collapse Sidebar')}
          >
            {isRtl ? (
              isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Services List (Only 7 clean items!) */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 scrollbar-thin">
        {!isCollapsed && (
          <div className="px-2 pb-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{isRtl ? 'خدمات العمليات المستودعية' : 'Operations Services'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected = currentTab === item.id || 
            (item.id === 'archive' && (currentTab === 'errors' || currentTab === 'master' || currentTab === 'settings'));

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? (isRtl ? item.titleAr : item.titleEn) : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-start transition-all relative group ${
                isSelected
                  ? `${item.activeBg} border ${item.activeBorder} shadow-md font-bold`
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              {/* Active lateral indicator strip */}
              {isSelected && (
                <span className="absolute top-1.5 bottom-1.5 start-0.5 w-1 rounded-full bg-emerald-400" />
              )}

              <div className={`shrink-0 p-1.5 rounded-lg ${isSelected ? 'bg-slate-950/60' : 'bg-slate-800/60 group-hover:bg-slate-800'}`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>

              {!isCollapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                  <div className="truncate">
                    <div className="text-xs sm:text-sm leading-tight truncate font-bold text-slate-100">
                      {isRtl ? item.titleAr : item.titleEn}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                      {isRtl ? item.descAr : item.descEn}
                    </div>
                  </div>

                  {item.badge !== undefined && item.badge !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Floating badge in collapsed mode */}
              {isCollapsed && item.badge !== undefined && item.badge !== null && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black flex items-center justify-center shadow">
                  {typeof item.badge === 'number' && item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Unique Technical Attributes & Eye-Comfort Ambient Lighting Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 space-y-3">
        {/* Eye-Comfort Lighting Switcher */}
        {!isCollapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isRtl ? 'إضاءة الشاشة المريحة للعين' : 'Eye Comfort Lighting'}</span>
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleLightingChange('eye-comfort')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  lightingMode === 'eye-comfort'
                    ? 'bg-teal-950 text-teal-300 border border-teal-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'الوضع التكتيكي المريح للعين ومضاد لإجهاد الشاشات' : 'Low-Glare Eye Comfort'}
              >
                <Eye className="w-3.5 h-3.5 mb-0.5 text-teal-400" />
                <span>{isRtl ? 'مريح للعين' : 'Low Glare'}</span>
              </button>

              <button
                onClick={() => handleLightingChange('high-contrast')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  lightingMode === 'high-contrast'
                    ? 'bg-slate-800 text-emerald-300 border border-emerald-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'تباين فائق لبيئات المستودع الساطعة والنهار' : 'High Contrast for Bright Lighting'}
              >
                <Sun className="w-3.5 h-3.5 mb-0.5 text-amber-400" />
                <span>{isRtl ? 'تباين عالي' : 'High Cont.'}</span>
              </button>

              <button
                onClick={() => handleLightingChange('warm-amber')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  lightingMode === 'warm-amber'
                    ? 'bg-amber-950 text-amber-200 border border-amber-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'وضع دافئ مرشح للضوء الأزرق للورديات الليلية' : 'Warm Amber Night Shift'}
              >
                <Moon className="w-3.5 h-3.5 mb-0.5 text-amber-500" />
                <span>{isRtl ? 'ليلي دافئ' : 'Warm Amber'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => {
                const nextMode: LightingMode = 
                  lightingMode === 'eye-comfort' ? 'high-contrast' :
                  lightingMode === 'high-contrast' ? 'warm-amber' : 'eye-comfort';
                handleLightingChange(nextMode);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 transition-all"
              title={isRtl ? `نمط الإضاءة الحالي: ${lightingMode}. انقر للتبديل` : `Lighting: ${lightingMode}. Click to toggle`}
            >
              {lightingMode === 'eye-comfort' && <Eye className="w-4 h-4 text-teal-400" />}
              {lightingMode === 'high-contrast' && <Sun className="w-4 h-4 text-amber-400" />}
              {lightingMode === 'warm-amber' && <Moon className="w-4 h-4 text-amber-500" />}
            </button>
          </div>
        )}

        {/* User Account & Role Badge Trigger */}
        <div 
          onClick={onOpenUserModal}
          className={`cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 p-2 transition-all flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
          title={isRtl ? 'إدارة المستخدم والصلاحيات' : 'User profile & permissions'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentAppUser?.name || settings.auditorName || (isRtl ? 'المراجع' : 'Auditor')}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isRtl ? roleConfig.labelAr : roleConfig.labelEn}
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black border ${roleConfig.color} ${roleConfig.bgLight}`}>
              {activeSession ? 'ON-AUDIT' : 'READY'}
            </span>
          )}
        </div>

        {/* Telemetry Status Line */}
        {!isCollapsed && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-emerald-400" />
              <span>OFFLINE_DB: OK</span>
            </span>
            <span className="text-emerald-400">100% READY</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop / Tablet Persistent Vertical Sidebar */}
      <aside 
        className={`hidden md:block shrink-0 transition-all duration-200 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-16' : 'w-64 lg:w-72'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
          />
          <div 
            className={`relative z-50 w-72 max-w-[85vw] h-full shadow-2xl ${
              isRtl ? 'mr-auto' : 'ml-auto'
            }`}
          >
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

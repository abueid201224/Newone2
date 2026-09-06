import React, { useState, useEffect, useCallback } from 'react';
import type { 
  ActiveInvoiceSession, 
  AuditDiscrepancy, 
  WrongPickingItem,
  SyncMetadata, 
  AppSettings,
  MasterInvoiceItem,
  ScannedAuditItem
} from './types';
import { 
  getActiveSession, 
  saveActiveSession, 
  getAllAuditDiscrepancies, 
  getAllWrongPickings,
  saveWrongPicking,
  findItemBelonging,
  getSyncMetadata, 
  getAppSettings, 
  saveAppSettings,
  getInvoiceMasterItems,
  doesInvoiceExist,
  getAllMasterItems,
  isInvoiceCompleted,
  getIncompleteInvoice,
  saveAuditDiscrepancies,
  getAllReturnReports,
  isInvoiceOrOrderNumberPattern,
  isItemBarcodeValidLength,
  DEFAULT_SETTINGS
} from './services/db';
import { useScannerListener } from './services/scannerListener';
import { SoundEffects } from './services/audio';

import { Navbar, type ActiveNavTab } from './components/Navbar';
import { ActiveAuditScreen } from './components/ActiveAuditScreen';
import { ErrorReportScreen } from './components/ErrorReportScreen';
import { MasterDatabaseView } from './components/MasterDatabaseView';
import { ScannerSimulator } from './components/ScannerSimulator';
import { ExcelSyncModal } from './components/ExcelSyncModal';
import { InvoiceSummaryModal } from './components/InvoiceSummaryModal';
import { AuditorSignatureModal } from './components/AuditorSignatureModal';
import { ReceivingScreen } from './components/ReceivingScreen';
import { ReturnsScreen } from './components/ReturnsScreen';
import { InventoryCountScreen } from './components/InventoryCountScreen';
import { PickingWaveScreen } from './components/PickingWaveScreen';
import { VerticalServicesDrawer } from './components/VerticalServicesDrawer';
import { AndroidApkGuideModal } from './components/AndroidApkGuideModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import { LogicGuideModal, type LogicGuideTab } from './components/LogicGuideModal';
import { WelcomeDashboardScreen } from './components/WelcomeDashboardScreen';
import { UserAuthModal } from './components/UserAuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';

// Helper for finding matching key ignoring case, whitespace, and leading zeros
function findMatchingItemKey(items: Record<string, ScannedAuditItem>, code: string): string | null {
  const clean = code.trim();
  if (items[clean]) return clean;

  const cleanLower = clean.toLowerCase();
  const strippedClean = clean.replace(/^0+/, '');

  for (const key of Object.keys(items)) {
    if (key.toLowerCase() === cleanLower) return key;
    if (strippedClean && key.replace(/^0+/, '').toLowerCase() === strippedClean.toLowerCase()) return key;
  }
  return null;
}

export function App() {
  const { currentAppUser, roleConfig, hasRole } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveNavTab>('welcome');
  const [activeSession, setActiveSession] = useState<ActiveInvoiceSession | null>(null);
  const [discrepancies, setDiscrepancies] = useState<AuditDiscrepancy[]>([]);
  const [wrongPickings, setWrongPickings] = useState<WrongPickingItem[]>([]);
  const [syncMeta, setSyncMeta] = useState<SyncMetadata>({
    lastSyncDate: null,
    totalInvoices: 0,
    totalItems: 0,
    fileName: null,
  });
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [masterItemsList, setMasterItemsList] = useState<MasterInvoiceItem[]>([]);
  const [pendingLabCount, setPendingLabCount] = useState<number>(0);
  const [overdueLabCount, setOverdueLabCount] = useState<number>(0);
  
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isServicesDrawerOpen, setIsServicesDrawerOpen] = useState(false);
  const [isApkGuideModalOpen, setIsApkGuideModalOpen] = useState(false);
  const [isLogicGuideOpen, setIsLogicGuideOpen] = useState(false);
  const [logicGuideInitialTab, setLogicGuideInitialTab] = useState<LogicGuideTab>('all');


  const handleOpenLogicGuide = (tab?: string) => {
    const validTabs: LogicGuideTab[] = ['all', 'audit', 'returns', 'receiving', 'inventory', 'picking', 'discrepancy', 'packaging', 'calculator'];
    if (tab && validTabs.includes(tab as LogicGuideTab)) {
      setLogicGuideInitialTab(tab as LogicGuideTab);
    } else {
      setLogicGuideInitialTab('all');
    }
    setIsLogicGuideOpen(true);
  };
  const [summaryModalState, setSummaryModalState] = useState<{
    isOpen: boolean;
    invoiceNo: string;
    discardedCount: number;
    archivedDiscrepancies: AuditDiscrepancy[];
    totalRequiredQty?: number;
    totalScannedQty?: number;
    totalLineItems?: number;
  }>({
    isOpen: false,
    invoiceNo: '',
    discardedCount: 0,
    archivedDiscrepancies: [],
    totalRequiredQty: 0,
    totalScannedQty: 0,
    totalLineItems: 0,
  });
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [scannerAlertNotice, setScannerAlertNotice] = useState<{ message: string; type: 'blocked' | 'warning' | 'success' } | null>(null);

  // Listen for PWA Install Prompt & Installed status
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      console.log('WMS PWA was installed successfully');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredInstallPrompt(null);
    }
  };

  // Initial Load from local IndexedDB (100% Offline)
  useEffect(() => {
    async function initOfflineStorage() {
      try {
        const [savedSession, savedDiscrepancies, savedWrongPickings, savedMeta, savedSettings, allMaster, allReturns] = await Promise.all([
          getActiveSession(),
          getAllAuditDiscrepancies(),
          getAllWrongPickings(),
          getSyncMetadata(),
          getAppSettings(),
          getAllMasterItems(),
          getAllReturnReports(),
        ]);

        if (savedSession) setActiveSession(savedSession);
        if (savedDiscrepancies) setDiscrepancies(savedDiscrepancies);
        if (savedWrongPickings) setWrongPickings(savedWrongPickings);
        if (savedMeta) setSyncMeta(savedMeta);
        if (savedSettings) setSettings(savedSettings);
        if (allMaster) setMasterItemsList(allMaster);

        if (allReturns) {
          const pending = allReturns.filter(r => r.status === 'PENDING_LAB');
          setPendingLabCount(pending.length);
          setOverdueLabCount(pending.filter(r => r.isOverdueForLab).length);
        }
      } catch (err) {
        console.error('Error initializing offline database', err);
      }
    }

    initOfflineStorage();
  }, []);

  const refreshDiscrepancies = async () => {
    const list = await getAllAuditDiscrepancies();
    setDiscrepancies(list);
  };

  const refreshWrongPickings = async () => {
    const list = await getAllWrongPickings();
    setWrongPickings(list);
  };

  const refreshMasterData = async () => {
    const [meta, items] = await Promise.all([
      getSyncMetadata(),
      getAllMasterItems(),
    ]);
    setSyncMeta(meta);
    setMasterItemsList(items);
  };

  // Called when an invoice completes or switches
  const handleInvoiceCompleted = (
    invoiceNo: string, 
    discarded: number, 
    discList: AuditDiscrepancy[], 
    totalRequiredQty = 0, 
    totalScannedQty = 0, 
    totalLineItems = 0
  ) => {
    // If invoice is completely clean (100% matched), skip modal blocker and instantly transfer to scanner cell!
    if (discList.length === 0) {
      setTimeout(() => {
        const input = document.getElementById('barcode-input') as HTMLInputElement | null;
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 50);
    } else {
      setSummaryModalState({
        isOpen: true,
        invoiceNo,
        discardedCount: discarded,
        archivedDiscrepancies: discList,
        totalRequiredQty,
        totalScannedQty,
        totalLineItems,
      });
    }
    refreshDiscrepancies();
    refreshWrongPickings();
  };

  // STEP A: Lock onto Invoice
  const lockInvoiceByBarcode = useCallback(async (invoiceNo: string) => {
    const cleanInvoice = invoiceNo.trim();
    if (!cleanInvoice) return;

    // Strict rule: Invoice/Order numbers must start with 200 or 204 from the left
    if (!isInvoiceOrOrderNumberPattern(cleanInvoice)) {
      if (settings.soundEnabled) SoundEffects.playMismatchWarning(settings.soundVolume);
      if (settings.vibrationEnabled) SoundEffects.vibrate([200, 100, 200]);
      setScannerAlertNotice({
        message: '⚠️ تنبيه رقابي: نمط رقم الفاتورة أو الطلب يجب أن يبدأ بـ 200 أو 204 من اليسار. لا يتم تفعيل مسح الأصناف إلا بعد فتح الفاتورة للمراجعة!',
        type: 'blocked',
      });
      setTimeout(() => setScannerAlertNotice(null), 5000);
      return;
    }

    // Check if completed
    const completed = await isInvoiceCompleted(cleanInvoice);
    if (completed) {
      if (settings.soundEnabled) SoundEffects.playAlreadyCompletedBlocked(settings.soundVolume);
      if (settings.vibrationEnabled) SoundEffects.vibrate([200, 100, 200]);
      setScannerAlertNotice({
        message: `⚠️ الفاتورة [${cleanInvoice}] تم تدقيقها وإقفالها مسبقاً ولا يمكن تكرار مسحها.`,
        type: 'warning',
      });
      setTimeout(() => setScannerAlertNotice(null), 4000);
      setCurrentTab('audit');
      return;
    }

    const masterItems = await getInvoiceMasterItems(cleanInvoice);
    const incomplete = await getIncompleteInvoice(cleanInvoice);

    const initialItems: Record<string, ScannedAuditItem> = {};
    const now = new Date().toISOString();

    if (incomplete && incomplete.session && incomplete.session.items) {
      Object.assign(initialItems, incomplete.session.items);
    } else {
      masterItems.forEach((m, idx) => {
        initialItems[m.itemCode] = {
          itemCode: m.itemCode,
          itemName: m.itemName,
          unit: m.unit,
          requiredQty: m.requiredQty,
          actualQty: 0,
          codeStatus: 'MATCH',
          qtyStatus: 'SHORTAGE',
          lastScannedAt: now,
          scanHistory: [],
          orderNo: m.orderNo,
          originalIndex: m.originalIndex !== undefined ? m.originalIndex : idx,
        };
      });
    }

    const firstItemWithOrder = masterItems.find(m => Boolean(m.orderNo));

    const newSession: ActiveInvoiceSession = {
      invoiceNo: cleanInvoice,
      orderNo: firstItemWithOrder?.orderNo || incomplete?.orderNo,
      startedAt: incomplete?.session?.startedAt || now,
      lastActivityAt: now,
      items: initialItems,
      isLocked: true,
      lastScannedItemCode: null,
      longBarcodePolicy: 'ALLOW',
    };

    await saveActiveSession(newSession);
    setActiveSession(newSession);
    setCurrentTab('audit');
    setScannerAlertNotice(null);

    if (settings.soundEnabled) SoundEffects.playInvoiceLock(settings.soundVolume);
    if (settings.vibrationEnabled) SoundEffects.vibrate(100);
  }, [settings.soundEnabled, settings.soundVolume, settings.vibrationEnabled]);

  // STEP B: Random Item Scan within active invoice (Supports ANY item in ANY order)
  const scanItemByBarcode = useCallback(async (code: string, currentSession: ActiveInvoiceSession) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Enforce condition: Barcode MUST be longer than 10 digits (> 10 digits)
    if (!isItemBarcodeValidLength(cleanCode)) {
      if (settings.soundEnabled) SoundEffects.playMismatchWarning(settings.soundVolume);
      if (settings.vibrationEnabled) SoundEffects.vibrate([150, 80, 150]);
      setScannerAlertNotice({
        message: `⚠️ تم رفض الصنف: شرط النظام يتطلب أن يكون باركود الصنف أطول من 10 أرقام (> 10 خانات). الكود الحالي: [${cleanCode}] مكون من ${cleanCode.length} خانات فقط.`,
        type: 'blocked',
      });
      setTimeout(() => setScannerAlertNotice(null), 5000);
      return;
    }

    const session = { ...currentSession };
    const items = { ...session.items };
    const now = new Date().toISOString();

    const matchingKey = findMatchingItemKey(items, cleanCode);
    let targetItem = matchingKey ? items[matchingKey] : null;
    let resolvedItemCode = cleanCode;

    if (targetItem) {
      // MATCH - ITEM BELONGS TO INVOICE
      resolvedItemCode = targetItem.itemCode;
      const newActualQty = targetItem.actualQty + 1;
      let newQtyStatus: 'EXACT' | 'SHORTAGE' | 'SURPLUS' = 'SHORTAGE';

      if (newActualQty === targetItem.requiredQty) {
        newQtyStatus = 'EXACT';
        if (settings.soundEnabled) SoundEffects.playExactComplete(settings.soundVolume);
        if (settings.vibrationEnabled) SoundEffects.vibrate([80, 50, 80]);
      } else if (newActualQty > targetItem.requiredQty) {
        newQtyStatus = 'SURPLUS';
        if (settings.soundEnabled) SoundEffects.playSurplusAlert(settings.soundVolume);
        if (settings.vibrationEnabled) SoundEffects.vibrate([150, 100, 150]);
      } else {
        newQtyStatus = 'SHORTAGE';
        if (settings.soundEnabled) SoundEffects.playScanMatch(settings.soundVolume);
        if (settings.vibrationEnabled) SoundEffects.vibrate(40);
      }

      items[targetItem.itemCode] = {
        ...targetItem,
        actualQty: newActualQty,
        qtyStatus: newQtyStatus,
        lastScannedAt: now,
        scanHistory: [...(targetItem.scanHistory || []), now],
      };

      session.items = items;
      session.lastActivityAt = now;
      session.lastScannedItemCode = resolvedItemCode;

      await saveActiveSession(session);
      setActiveSession(session);
    } else {
      // WRONG PICKING (تجهيز خاطئ) - Item does NOT belong to this invoice!
      // Do NOT add to session.items! Divert directly to wrong_pickings table.
      if (settings.soundEnabled) SoundEffects.playMismatchWarning(settings.soundVolume);
      if (settings.vibrationEnabled) SoundEffects.vibrate([200, 100, 200, 100, 200]);

      const belonging = await findItemBelonging(cleanCode);

      await saveWrongPicking({
        activeInvoiceNo: session.invoiceNo,
        orderNo: session.orderNo,
        itemCode: cleanCode,
        itemName: belonging?.itemName || 'صنف غير مدرج بالفاتورة',
        unit: belonging?.unit || 'PCS',
        actualBelongingInvoiceNo: belonging?.invoiceNo,
        actualBelongingOrderNo: belonging?.orderNo,
        scannedAt: now,
        auditorName: settings.auditorName || 'أحمد حمادة',
        auditorId: settings.auditorId || 'AUD-101',
        quantity: 1,
        notes: belonging?.invoiceNo 
          ? `يخص فاتورة رقم ${belonging.invoiceNo}${belonging.orderNo ? ` (طلب: ${belonging.orderNo})` : ''}`
          : 'صنف أجنبي غير موجود بالقاعدة المرجعية',
      });

      session.lastActivityAt = now;
      await saveActiveSession(session);
      setActiveSession(session);
      await refreshWrongPickings();
    }
  }, [settings.soundEnabled, settings.soundVolume, settings.vibrationEnabled, settings.auditorName, settings.auditorId]);

  // Global Hardware 1D Barcode Scanner Keyboard-Wedge Listener
  const handleHardwareScan = useCallback(async (barcode: string) => {
    const clean = barcode.trim();
    if (!clean) return;

    // Only handle global hardware scan on audit or welcome screen (other tabs handle their own scans via lastScannedBarcode)
    if (currentTab !== 'audit' && currentTab !== 'welcome') {
      return;
    }

    const matchesInvoicePattern = isInvoiceOrOrderNumberPattern(clean);

    if (!activeSession) {
      // Step A: No invoice is currently open
      // Enforce rule: Restrict scanning strictly to invoice/order pattern starting with 200 or 204
      // Do not activate item scans until an invoice is opened!
      if (!matchesInvoicePattern) {
        if (settings.soundEnabled) SoundEffects.playMismatchWarning(settings.soundVolume);
        if (settings.vibrationEnabled) SoundEffects.vibrate([200, 100, 200]);
        setScannerAlertNotice({
          message: '⚠️ تنبيه رقابي: يجب مسح باركود الفاتورة أو الطلب أولاً (يبدأ بـ 200 أو 204 من اليسار). لا يتم تفعيل مسح الأصناف إلا بعد فتح الفاتورة للمراجعة!',
          type: 'blocked',
        });
        setTimeout(() => setScannerAlertNotice(null), 5000);
        return;
      }

      // Valid 200 or 204 pattern: Lock onto invoice!
      await lockInvoiceByBarcode(clean);
    } else {
      // Step B: Invoice is OPEN FOR REVIEW
      // Check if this scan is a NEW invoice (starts with 200 or 204 and differs from active invoice/order)
      const isNewInvoiceScan = matchesInvoicePattern && 
        clean.toLowerCase() !== activeSession.invoiceNo.toLowerCase() && 
        clean.toLowerCase() !== (activeSession.orderNo || '').toLowerCase();

      if (isNewInvoiceScan) {
        // Automatic Switch & Clean for next invoice
        const prevSession = activeSession;
        const allItems: ScannedAuditItem[] = Object.values(prevSession.items);
        const auditedAt = new Date().toISOString();

        let cleanDiscarded = 0;
        const discrepanciesToArchive: AuditDiscrepancy[] = [];

        for (const item of allItems) {
          if (item.codeStatus === 'MATCH' && item.qtyStatus === 'EXACT') {
            cleanDiscarded += 1;
          } else {
            discrepanciesToArchive.push({
              invoiceNo: prevSession.invoiceNo,
              orderNo: prevSession.orderNo || item.orderNo,
              itemCode: item.itemCode,
              itemName: item.itemName,
              unit: item.unit,
              requiredQty: item.requiredQty,
              actualQty: item.actualQty,
              codeStatus: item.codeStatus,
              qtyStatus: item.qtyStatus,
              difference: item.actualQty - item.requiredQty,
              auditedAt,
              notes: item.codeStatus === 'MISMATCH' ? 'صنف غير مدرج بالفاتورة' : item.qtyStatus,
            });
          }
        }

        handleInvoiceCompleted(prevSession.invoiceNo, cleanDiscarded, discrepanciesToArchive);
        await lockInvoiceByBarcode(clean);
      } else {
        // Step C: Item scan within active invoice session
        // Enforce rule: Item barcode MUST be longer than 10 digits (> 10 digits)
        if (!isItemBarcodeValidLength(clean)) {
          if (settings.soundEnabled) SoundEffects.playMismatchWarning(settings.soundVolume);
          if (settings.vibrationEnabled) SoundEffects.vibrate([150, 80, 150]);
          setScannerAlertNotice({
            message: `⚠️ تم رفض الصنف: شرط النظام يتطلب أن يكون باركود الصنف أطول من 10 أرقام (> 10 خانات). الكود الحالي: [${clean}] مكون من ${clean.length} خانات فقط.`,
            type: 'blocked',
          });
          setTimeout(() => setScannerAlertNotice(null), 5000);
          return;
        }

        await scanItemByBarcode(clean, activeSession);
      }
    }
  }, [activeSession, currentTab, handleInvoiceCompleted, lockInvoiceByBarcode, scanItemByBarcode, settings.soundEnabled, settings.soundVolume, settings.vibrationEnabled]);


  const { lastScannedBarcode, isScannerActive } = useScannerListener({
    onScan: handleHardwareScan,
    minLength: settings.scannerMinLength,
  });

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveAppSettings(newSettings);
  };

  const handleToggleSound = () => {
    handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const handleToggleLanguage = () => {
    const newLang = settings.language === 'ar' ? 'en' : 'ar';
    handleUpdateSettings({ ...settings, language: newLang });
  };

  const isRtl = settings.language === 'ar';

  return (
    <div 
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white ${isRtl ? 'rtl' : 'ltr'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        syncMeta={syncMeta}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        errorCount={discrepancies.length + wrongPickings.length}
        wrongPickingCount={wrongPickings.length}
        overdueLabCount={overdueLabCount}
        pendingLabCount={pendingLabCount}
        settings={settings}
        onToggleSound={handleToggleSound}
        onToggleLanguage={handleToggleLanguage}
        isScannerActive={isScannerActive}
        canInstallPwa={Boolean(deferredInstallPrompt)}
        onInstallPwa={handleInstallPwa}
        onOpenAuditorModal={() => setIsAuditorModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onToggleDrawer={() => setIsServicesDrawerOpen(prev => !prev)}
        onOpenApkGuide={() => setIsApkGuideModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenLogicGuide={handleOpenLogicGuide}
      />

      {/* Main Screen Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 pb-20 md:pb-6">
        {/* Global Scanner Feedback Toast / Notice */}
        {scannerAlertNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-950/95 border-2 border-red-500/80 text-red-100 flex items-center justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 font-bold text-sm">
              <span className="text-xl shrink-0">🛑</span>
              <span>{scannerAlertNotice.message}</span>
            </div>
            <button
              onClick={() => setScannerAlertNotice(null)}
              className="px-2 py-1 hover:bg-red-900 rounded-lg text-red-300 hover:text-white text-xs font-bold shrink-0"
            >
              {isRtl ? 'إغلاق' : 'Dismiss'}
            </button>
          </div>
        )}
        {/* 0. Home & Welcome Screen (When no active workstation is selected) */}
        {currentTab === 'welcome' && (
          <WelcomeDashboardScreen
            syncMeta={syncMeta}
            activeSession={activeSession}
            errorCount={discrepancies.length + wrongPickings.length}
            pendingLabCount={pendingLabCount}
            overdueLabCount={overdueLabCount}
            onSelectService={(tab) => setCurrentTab(tab)}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenLogicGuide={handleOpenLogicGuide}
            onOpenUserModal={() => setIsUserModalOpen(true)}
            onOpenApkGuide={() => setIsApkGuideModalOpen(true)}
            settings={settings}
            isRtl={isRtl}
          />
        )}

        {/* 1. Inbound Receiving Screen */}
        {currentTab === 'receiving' && (
          <ReceivingScreen
            settings={settings}
            lastScannedCode={lastScannedBarcode}
            onOpenLogicGuide={handleOpenLogicGuide}
          />
        )}

        {/* 2. Invoice Dispatch Auditor Screen */}
        {currentTab === 'audit' && (
          <ActiveAuditScreen
            activeSession={activeSession}
            setActiveSession={setActiveSession}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onInvoiceCompleted={handleInvoiceCompleted}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            lastScannedCode={lastScannedBarcode}
            discrepancies={discrepancies}
            wrongPickings={wrongPickings}
            onRefreshDiscrepancies={() => {
              refreshDiscrepancies();
              refreshWrongPickings();
            }}
            onOpenLogicGuide={handleOpenLogicGuide}
          />
        )}

        {/* 3. Returns & Refunds (RMA) Screen with Smart PDF extraction */}
        {currentTab === 'returns' && (
          <ReturnsScreen
            settings={settings}
            lastScannedCode={lastScannedBarcode}
            onOpenAuditorModal={() => setIsAuditorModalOpen(true)}
            onTransferToAudit={(invoiceNo) => {
              lockInvoiceByBarcode(invoiceNo);
              setCurrentTab('audit');
            }}
            discrepancies={discrepancies}
            wrongPickings={wrongPickings}
            onRefreshDiscrepancies={() => {
              refreshDiscrepancies();
              refreshWrongPickings();
            }}
            onOpenLogicGuide={handleOpenLogicGuide}
          />
        )}

        {/* 4. Cycle Count & Packaging Breakdown Screen */}
        {currentTab === 'inventory' && (
          <InventoryCountScreen
            settings={settings}
            lastScannedCode={lastScannedBarcode}
            onOpenLogicGuide={handleOpenLogicGuide}
          />
        )}

        {/* 5. Batch Wave Picking List Generator Screen */}
        {currentTab === 'picking' && (
          <PickingWaveScreen
            settings={settings}
            lastScannedCode={lastScannedBarcode}
            onOpenLogicGuide={handleOpenLogicGuide}
          />
        )}

        {/* Discrepancies & Discarded Wrong Pickings */}
        {currentTab === 'errors' && (
          <ErrorReportScreen
            discrepancies={discrepancies}
            wrongPickings={wrongPickings}
            onRefreshDiscrepancies={refreshDiscrepancies}
            onRefreshWrongPickings={refreshWrongPickings}
            settings={settings}
            onOpenAuditorModal={() => setIsAuditorModalOpen(true)}
          />
        )}

        {/* Master Database Screen */}
        {currentTab === 'master' && (
          <MasterDatabaseView
            syncMeta={syncMeta}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onSelectInvoice={(invNo) => {
              lockInvoiceByBarcode(invNo);
              setCurrentTab('audit');
            }}
          />
        )}

        {/* Scanner Simulator & Tools Screen */}
        {currentTab === 'settings' && (
          <ScannerSimulator
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSimulateScan={handleHardwareScan}
            activeInvoiceNo={activeSession?.invoiceNo || null}
            masterItems={masterItemsList}
            onOpenAuditorModal={() => setIsAuditorModalOpen(true)}
            canInstallPwa={Boolean(deferredInstallPrompt)}
            onInstallPwa={handleInstallPwa}
          />
        )}
      </main>

      {/* Mobile & Tablet Bottom Quick Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onToggleDrawer={() => setIsServicesDrawerOpen(prev => !prev)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        errorCount={discrepancies.length + wrongPickings.length}
        isRtl={isRtl}
        onOpenApkGuide={() => setIsApkGuideModalOpen(true)}
      />

      {/* Vertical Services Drawer (Active Working Service Always on Top!) */}
      <VerticalServicesDrawer
        isOpen={isServicesDrawerOpen}
        onClose={() => setIsServicesDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'apk-guide') {
            setCurrentTab(tab);
          }
        }}
        settings={settings}
        syncMeta={syncMeta}
        errorCount={discrepancies.length + wrongPickings.length}
        wrongPickingCount={wrongPickings.length}
        pendingLabCount={pendingLabCount}
        overdueLabCount={overdueLabCount}
        activeSession={activeSession}
        onOpenApkGuide={() => setIsApkGuideModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenAuditorModal={() => setIsAuditorModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        onOpenLogicGuide={handleOpenLogicGuide}
      />

      {/* User Accounts & RBAC Roles Authentication Modal */}
      <UserAuthModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      {/* WMS Logic, Equations & Problem-Solving Guide Modal */}
      <LogicGuideModal
        isOpen={isLogicGuideOpen}
        onClose={() => setIsLogicGuideOpen(false)}
        initialTab={logicGuideInitialTab}
        isRtl={isRtl}
      />

      {/* Firebase Cloud Sync & Auth Modal */}
      <FirebaseSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        isRtl={isRtl}
      />

      {/* Android Studio APK Build Guide & PDF Export Modal */}
      <AndroidApkGuideModal
        isOpen={isApkGuideModalOpen}
        onClose={() => setIsApkGuideModalOpen(false)}
        settings={settings}
      />

      {/* Daily Excel Sync Modal */}
      <ExcelSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentMeta={syncMeta}
        onSyncComplete={(meta) => {
          setSyncMeta(meta);
          refreshMasterData();
        }}
      />

      {/* Auditor Profile & Digital Signature Modal (ISA 500 Evidence Compliance) */}
      <AuditorSignatureModal
        isOpen={isAuditorModalOpen}
        onClose={() => setIsAuditorModalOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onSaveAuditorInfo={(info) => {
          handleUpdateSettings({
            ...settings,
            ...info,
          });
        }}
      />

      {/* Invoice Evaluation & Switch Summary Modal */}
      <InvoiceSummaryModal
        isOpen={summaryModalState.isOpen}
        onClose={() => {
          setSummaryModalState(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => {
            const input = document.getElementById('barcode-input') as HTMLInputElement | null;
            if (input) {
              input.value = '';
              input.focus();
            }
          }, 50);
        }}
        invoiceNo={summaryModalState.invoiceNo}
        discardedCount={summaryModalState.discardedCount}
        archivedDiscrepancies={summaryModalState.archivedDiscrepancies}
        totalRequiredQty={summaryModalState.totalRequiredQty}
        totalScannedQty={summaryModalState.totalScannedQty}
        totalLineItems={summaryModalState.totalLineItems}
        auditorName={settings.auditorName}
        auditorId={settings.auditorId}
        auditorSignature={settings.auditorSignature}
        language={settings.language}
        onViewErrorReport={() => {
          setSummaryModalState(prev => ({ ...prev, isOpen: false }));
          setCurrentTab('errors');
        }}
        onContinueScanning={() => {
          setSummaryModalState(prev => ({ ...prev, isOpen: false }));
          setCurrentTab('audit');
          setTimeout(() => {
            const input = document.getElementById('barcode-input') as HTMLInputElement | null;
            if (input) {
              input.value = '';
              input.focus();
            }
          }, 50);
        }}
      />
    </div>
  );
}

export default App;

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncManager } from '../db/syncManager';
import { SyncMetadataRecord } from '../db/tables';

interface PwaContextType {
  isOnline: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  swStatus: 'installed' | 'installing' | 'not-installed';
  hasUpdate: boolean;
  lastSyncMeta: SyncMetadataRecord | null;
  reportStats: { pending: number; syncing: number; synced: number; failed: number; total: number };
  installPwa: () => Promise<void>;
  updateServiceWorker: () => void;
  triggerManualSync: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [swStatus, setSwStatus] = useState<'installed' | 'installing' | 'not-installed'>('not-installed');
  const [hasUpdate, setHasUpdate] = useState<boolean>(false);
  const [lastSyncMeta, setLastSyncMeta] = useState<SyncMetadataRecord | null>(null);
  const [reportStats, setReportStats] = useState({ pending: 0, syncing: 0, synced: 0, failed: 0, total: 0 });

  // Update offline/online status & trigger sync upon reconnect
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Process pending offline reports & fetch latest state
      await syncManager.syncPendingCitizenReports();
      await syncManager.syncCloudToLocal();
      refreshStats();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshStats();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check & sync if online
    if (navigator.onLine) {
      syncManager.syncCloudToLocal().then(() => refreshStats()).catch(console.warn);
    } else {
      refreshStats();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      const meta = await syncManager.getLastSyncMetadata();
      const rStats = await syncManager.getReportSyncStats();
      if (meta) setLastSyncMeta(meta);
      setReportStats(rStats);
    } catch (e) {
      console.warn('Could not refresh PWA sync stats:', e);
    }
  }, []);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check Service Worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setSwStatus('installed');
          if (reg.waiting) {
            setHasUpdate(true);
          }
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  const triggerManualSync = async () => {
    if (navigator.onLine) {
      await syncManager.syncPendingCitizenReports();
      await syncManager.syncCloudToLocal();
    }
    await refreshStats();
  };

  return (
    <PwaContext.Provider
      value={{
        isOnline,
        isInstallable,
        isInstalled,
        swStatus,
        hasUpdate,
        lastSyncMeta,
        reportStats,
        installPwa,
        updateServiceWorker,
        triggerManualSync
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = () => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};

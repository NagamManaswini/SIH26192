import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  Layers, 
  Cpu, 
  Clock, 
  HardDrive, 
  Smartphone, 
  Radio, 
  Building2, 
  Users, 
  Volume2, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { usePwa } from '../context/PwaContext';
import { offlineDb } from '../db/database';

export const PwaStatusPage: React.FC = () => {
  const { 
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
  } = usePwa();

  const [tableCounts, setTableCounts] = useState({
    sensors: 0,
    watersheds: 0,
    alerts: 0,
    evacuationCenters: 0,
    citizenReports: 0
  });

  const [syncing, setSyncing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadTableCounts = async () => {
    try {
      const [s, w, a, sh, r] = await Promise.all([
        offlineDb.sensors.count(),
        offlineDb.watersheds.count(),
        offlineDb.alerts.count(),
        offlineDb.evacuationCenters.count(),
        offlineDb.citizenReports.count()
      ]);
      setTableCounts({
        sensors: s,
        watersheds: w,
        alerts: a,
        evacuationCenters: sh,
        citizenReports: r
      });
    } catch (err) {
      console.warn('Failed to count IndexedDB tables:', err);
    }
  };

  useEffect(() => {
    loadTableCounts();
  }, [lastSyncMeta]);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await triggerManualSync();
      await loadTableCounts();
      setNotification('Offline IndexedDB database successfully synchronized with cloud server!');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setNotification('Sync failed. Please check internet connection.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setSyncing(false);
    }
  };

  const totalCachedRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-bold flex items-center gap-2 shadow-xs animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-xs">
            <Smartphone className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">PWA & Offline System Status</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                isOnline 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              }`}>
                {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Progressive Web App health, Service Worker lifecycle, and Dexie IndexedDB offline caching.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          {isInstallable && (
            <button
              onClick={installPwa}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Install Flash Flood App
            </button>
          )}

          <button
            onClick={handleSyncNow}
            disabled={syncing || !isOnline}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Service Worker Update Alert Banner */}
      {hasUpdate && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-bold text-sm text-slate-900">New version available!</div>
              <div className="text-xs text-slate-600">An updated service worker build is ready to activate.</div>
            </div>
          </div>
          <button
            onClick={updateServiceWorker}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            Update & Reload
          </button>
        </div>
      )}

      {/* 5 Core Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Service Worker Status */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-blue-600" /> Service Worker
          </div>
          <div className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${swStatus === 'installed' ? 'bg-blue-600' : 'bg-amber-500'}`}></span>
            {swStatus === 'installed' ? 'Installed' : 'Registering...'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isInstalled ? 'Running in Standalone App' : 'App shell cached'}
          </div>
        </div>

        {/* Network Connection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            {isOnline ? <Wifi className="w-4 h-4 text-blue-600" /> : <WifiOff className="w-4 h-4 text-amber-500" />} Network State
          </div>
          <div className="text-base font-black text-slate-900 mt-1.5">
            <span className={isOnline ? 'text-blue-600' : 'text-amber-600'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isOnline ? 'Live API WebSocket' : 'Local IndexedDB Active'}
          </div>
        </div>

        {/* Last Sync Timestamp */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" /> Last Sync
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1.5 font-mono">
            {lastSyncMeta?.last_synced_at 
              ? new Date(lastSyncMeta.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
              : 'Syncing...'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            {lastSyncMeta?.last_synced_at ? new Date(lastSyncMeta.last_synced_at).toLocaleDateString() : 'Auto-sync active'}
          </div>
        </div>

        {/* Cached Data Records */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-600" /> Cached Records
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {totalCachedRecords}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Across 5 local tables</div>
        </div>

        {/* Pending Sync Queue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-amber-600" /> Pending Uploads
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {reportStats.pending}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Queued citizen reports</div>
        </div>

      </div>

      {/* Offline Data Integrity Notice */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" /> Offline IndexedDB Data Storage (Dexie.js)
          </h3>
          <span className="text-xs font-mono text-blue-600 font-bold">
            Showing last synchronized data: {lastSyncMeta?.last_synced_at ? new Date(lastSyncMeta.last_synced_at).toLocaleString() : 'Live'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Sensors</span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{tableCounts.sensors}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Watersheds</span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{tableCounts.watersheds}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-slate-700">Active Alerts</span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{tableCounts.alerts}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Shelters</span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{tableCounts.evacuationCenters}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-700">Reports</span>
            </div>
            <span className="text-sm font-black text-slate-900 font-mono">{tableCounts.citizenReports}</span>
          </div>
        </div>
      </div>

      {/* Offline Citizen Reporting Queue Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" /> Offline Citizen Reporting Queue Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Citizen reports submitted while offline are stored locally in IndexedDB and automatically synchronized when connectivity returns.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold">
              Pending: <strong>{reportStats.pending}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold">
              Synced: <strong>{reportStats.synced}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-bold">
              Failed: <strong>{reportStats.failed}</strong>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Never lose a citizen report due to mountain connectivity drops. Reports remain persistent in IndexedDB until confirmed by server.</span>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing || !isOnline}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50 transition shadow-xs shrink-0 cursor-pointer"
          >
            Flush Queue
          </button>
        </div>
      </div>

    </div>
  );
};

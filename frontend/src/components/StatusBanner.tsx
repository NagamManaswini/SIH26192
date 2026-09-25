import React, { useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Server, 
  Zap, 
  Wifi, 
  WifiOff, 
  Download, 
  Database
} from 'lucide-react';
import { apiService } from '../services/api';
import { usePwa } from '../context/PwaContext';
import { HealthResponse } from '../types';

interface StatusBannerProps {
  onNavigatePwa?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ onNavigatePwa }) => {
  const { isOnline, isInstallable, installPwa, lastSyncMeta, hasUpdate, updateServiceWorker } = usePwa();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  const fetchHealth = async () => {
    if (!navigator.onLine) {
      setLoading(false);
      setHealth(null);
      setError('Browser is offline (Offline Mode)');
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    try {
      const data = await apiService.getHealth();
      const endTime = performance.now();
      setHealth(data);
      setPingLatency(Math.round(endTime - startTime));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to reach backend API');
      setHealth(null);
      setPingLatency(null);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, [isOnline]);

  return (
    <div className="w-full bg-slate-50/90 border-b border-slate-200 px-4 py-1.5 text-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Network Online/Offline & Backend API Status */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* PWA Network Badge */}
          <button 
            onClick={onNavigatePwa}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition hover:opacity-90 ${
            isOnline 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3 mr-1 text-blue-600" /> : <WifiOff className="w-3 h-3 mr-1 text-amber-600" />}
            {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
          </button>

          {!isOnline && (
            <button 
              onClick={onNavigatePwa}
              className="text-[11px] text-amber-700 font-mono flex items-center gap-1 hover:underline cursor-pointer font-medium"
            >
              <Database className="w-3 h-3 text-amber-600" />
              Showing last synchronized data: {lastSyncMeta?.last_synced_at ? new Date(lastSyncMeta.last_synced_at).toLocaleTimeString() : 'Cached'}
            </button>
          )}

          {isOnline && (
            <div className="flex items-center space-x-2 text-slate-700">
              <div className="flex items-center space-x-1.5 font-bold text-slate-500">
                <Server className="w-3 h-3 text-blue-600" />
                <span>API:</span>
              </div>

              {loading && !health && !error ? (
                <span className="flex items-center space-x-1 text-slate-500 text-[11px]">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />
                  <span>Connecting...</span>
                </span>
              ) : health?.status === 'ok' ? (
                <div className="flex items-center space-x-1.5">
                  <span className="text-blue-700 font-bold">{health.service}</span>
                  {pingLatency !== null && (
                    <span className="text-[10px] font-mono text-slate-500 flex items-center">
                      <Zap className="w-2.5 h-2.5 text-amber-500 mr-0.5" />
                      {pingLatency}ms
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-rose-600 text-[11px] font-semibold">
                  {error}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions, Updates & Install Prompt */}
        <div className="flex items-center space-x-3 text-slate-500 text-[11px]">
          {hasUpdate && (
            <button
              onClick={updateServiceWorker}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition font-bold"
            >
              <RefreshCw className="w-3 h-3 mr-0.5" />
              <span>Update Available</span>
            </button>
          )}

          {isInstallable && (
            <button
              onClick={installPwa}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
            >
              <Download className="w-3 h-3" />
              <span>Install Flash Flood App</span>
            </button>
          )}

          {lastChecked && (
            <span className="hidden sm:inline text-slate-400 font-medium">
              Checked: {lastChecked.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition disabled:opacity-50 font-medium"
            title="Re-check network"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

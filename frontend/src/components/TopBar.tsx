import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  FileText, 
  LogOut, 
  User as UserIcon, 
  Play, 
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePwa } from '../context/PwaContext';
import { NavigationTab } from '../types';

interface TopBarProps {
  currentTab: NavigationTab;
  onOpenDemo?: () => void;
  onOpenReport?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ currentTab, onOpenDemo, onOpenReport, onNavigateTab }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOnline, isInstallable, installPwa } = usePwa();
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = (tab: NavigationTab) => {
    switch (tab) {
      case 'command-center':
        return 'Disaster Command Center & Live Operations';
      case 'live-map':
        return 'Live GIS Hazard & Inundation Map';
      case 'sensors':
        return 'IoT Sensor Telemetry & Gauge Stations';
      case 'predictions':
        return 'AI Flood Forecasting (30-120m Horizons)';
      case 'alerts':
        return 'Early Warning Broadcast & Siren Triggers';
      case 'citizen-reports':
        return 'Citizen Field Observation Portal';
      case 'evacuation':
        return 'Safe Evacuation Routing & Shelter Management';
      case 'edge-network':
        return 'LoRa Mesh & Autonomous Edge Sirens';
      case 'analytics':
        return 'Historical Hydrology & Event Analytics';
      case 'pwa-status':
        return 'PWA Offline Storage & Sync Manager';
      case 'rbac-matrix':
        return 'Role-Based Access Control Matrix';
      case 'settings':
        return 'System Parameters & Threshold Calibration';
      default:
        return 'Disaster Management Platform';
    }
  };

  const handleGeneratePdf = () => {
    if (onOpenReport) {
      onOpenReport();
    } else {
      window.print();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 text-slate-900 px-4 lg:px-6 py-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Left: Active Module Name */}
      <div className="flex items-center gap-3">
        <h2 className="text-base lg:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          {getPageTitle(currentTab)}
        </h2>
        <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
          isOnline ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
        }`}>
          {isOnline ? 'LIVE TELEMETRY' : 'OFFLINE MODE'}
        </span>
      </div>

      {/* Right: Actions, Clock, User Profile & Logout */}
      <div className="flex items-center flex-wrap gap-2.5 text-xs">
        {/* PWA Install Button (if available) */}
        {isInstallable && (
          <button
            onClick={installPwa}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* Start Flood Demo Button */}
        {onOpenDemo && (
          <button
            onClick={onOpenDemo}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>START FLOOD DEMO</span>
          </button>
        )}

        {/* Generate Report Button (Pink pill matching screenshot) */}
        <button
          onClick={handleGeneratePdf}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>GENERATE PDF REPORT</span>
        </button>

        {/* IST Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono text-[11px] font-semibold">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{currentTime} IST</span>
        </div>

        {/* User Profile Pill */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-[11px] shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="font-bold text-[11px] text-slate-900 flex items-center gap-1">
                <span>{user.name}</span>
                <span className="text-[9px] bg-blue-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                  {user.role}
                </span>
              </div>
              <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{user.email}</div>
            </div>

            <button
              onClick={logout}
              className="ml-1 p-1 hover:bg-slate-200/80 rounded-lg text-slate-400 hover:text-rose-600 transition"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigateTab?.('login')}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { 
  Radio, 
  LayoutDashboard, 
  Map, 
  BrainCircuit, 
  Bell, 
  BarChart3, 
  Layers, 
  Shield,
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Cpu,
  Navigation,
  HeartHandshake
} from 'lucide-react';
import { NavigationTab, UserRole } from '../types';
import { usePwa } from '../context/PwaContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  allowedRoles?: UserRole[];
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { isOnline } = usePwa();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const userRole: UserRole = user?.role || 'CITIZEN';

  const navGroups: NavGroup[] = [
    {
      groupName: 'CONTROL CENTER MODULES',
      items: [
        { id: 'command-center', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'live-map', label: 'Live Hazard Map', icon: Map, badge: 'Live GIS' },
        { 
          id: 'alerts', 
          label: 'Red Zones & Alerts', 
          icon: Bell, 
          badge: 'Critical', 
          badgeColor: 'bg-red-500 text-white',
          allowedRoles: ['CITIZEN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ADMIN']
        },
      ]
    },
    {
      groupName: 'EVACUATION & RELIEF',
      items: [
        { 
          id: 'evacuation', 
          label: 'Evacuation & Shelters', 
          icon: Navigation,
          allowedRoles: ['CITIZEN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ADMIN']
        },
        { 
          id: 'citizen-reports', 
          label: 'Citizen Ground Reports', 
          icon: HeartHandshake,
          allowedRoles: ['CITIZEN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ADMIN']
        },
      ]
    },
    {
      groupName: 'TELEMETRY & SENSORS',
      items: [
        { 
          id: 'sensors', 
          label: 'Sensor Network (48 Nodes)', 
          icon: Radio,
          allowedRoles: ['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN']
        },
        { 
          id: 'predictions', 
          label: 'AI Forecasting (t+120m)', 
          icon: BrainCircuit,
          allowedRoles: ['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN']
        },
        { 
          id: 'edge-network', 
          label: 'LoRa Mesh & Edge Sirens', 
          icon: Cpu,
          allowedRoles: ['CITIZEN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER', 'ADMIN']
        },
        { 
          id: 'analytics', 
          label: 'Historical Analytics', 
          icon: BarChart3,
          allowedRoles: ['CITIZEN', 'RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN']
        },
      ]
    },
    {
      groupName: 'ADMINISTRATION & OFFLINE',
      items: [
        { 
          id: 'pwa-status', 
          label: 'PWA Offline Cache', 
          icon: Layers, 
          badge: 'IndexedDB',
          allowedRoles: ['CITIZEN', 'ADMIN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER']
        },
        { 
          id: 'rbac-matrix', 
          label: 'RBAC Permission Matrix', 
          icon: Shield,
          allowedRoles: ['CITIZEN', 'ADMIN', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'RESEARCHER']
        },
      ]
    }
  ];

  const visibleNavGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.allowedRoles) return true;
      if (userRole === 'ADMIN') return true;
      return item.allowedRoles.includes(userRole);
    })
  })).filter(group => group.items.length > 0);

  const handleItemClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Toggle Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#0c1022] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3" onClick={() => onSelectTab('command-center')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Shield className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block">DISASTER PLATFORM</span>
            <span className="text-[10px] text-pink-400 block font-medium">National Warning Portal</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0c1022] border-r border-slate-800/80 transition-all duration-300 select-none shadow-2xl ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* 1. Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0a0e1e]">
          <div 
            className="flex items-center space-x-3 cursor-pointer overflow-hidden"
            onClick={() => handleItemClick('command-center')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/30">
              <Shield className="w-5 h-5 text-white fill-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-black text-sm tracking-wider text-white uppercase block">
                  DISASTER PLATFORM
                </span>
                <span className="text-[11px] text-slate-400 font-medium tracking-tight block">
                  National Warning Portal
                </span>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0 ml-1"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* 2. Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {visibleNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {group.groupName}
                </div>
              )}

              {group.items.map((item, itemIdx) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={`${item.id}-${itemIdx}`}
                    onClick={() => handleItemClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                      isActive 
                        ? 'bg-[#3b49df] text-white shadow-lg shadow-indigo-950/60 font-bold' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />

                    {!isCollapsed && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && item.badge && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#151c38] border border-slate-700 text-white text-xs font-semibold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-nowrap shadow-xl">
                        {item.label}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* 3. Bottom Live Operations Status Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0a0e1e]">
          {!isCollapsed ? (
            <div className="p-2.5 bg-[#121830] border border-slate-800/80 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-slate-300">Live Operations</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                isOnline ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {isOnline ? 'ACTIVE' : 'OFFLINE'}
              </span>
            </div>
          ) : (
            <div className="flex justify-center p-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" title="Live Operations Active"></span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

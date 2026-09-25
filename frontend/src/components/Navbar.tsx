import React, { useState } from 'react';
import { 
  Map, 
  Radio, 
  BrainCircuit, 
  Bell, 
  Users, 
  ShieldAlert, 
  BarChart3, 
  Settings,
  Waves,
  LogIn,
  LogOut,
  UserPlus,
  ChevronDown,
  Layers,
  Lock
} from 'lucide-react';
import { NavigationTab, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
  allowedRoles?: UserRole[];
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'command-center', label: 'Command Center', icon: Radio, badge: 'LIVE OPS' },
    { id: 'live-map', label: 'Live Map', icon: Map },
    { id: 'sensors', label: 'Sensors', icon: Radio, badge: '48 Active', allowedRoles: ['RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN'] },
    { id: 'predictions', label: 'Predictions', icon: BrainCircuit, allowedRoles: ['RESEARCHER', 'RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'ADMIN'] },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: '2 Warnings' },
    { id: 'citizen-reports', label: 'Citizen Reports', icon: Users },
    { id: 'evacuation', label: 'Evacuation', icon: ShieldAlert, allowedRoles: ['RESPONSE_TEAM', 'GOVERNMENT_OFFICIAL', 'CITIZEN', 'ADMIN'] },
    { id: 'edge-network', label: 'Edge / LoRa', icon: Layers, badge: 'Edge Siren' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, allowedRoles: ['RESEARCHER', 'GOVERNMENT_OFFICIAL', 'ADMIN'] },
    { id: 'pwa-status', label: 'PWA & Offline', icon: Layers, badge: 'IndexedDB' },
    { id: 'settings', label: 'Settings', icon: Settings, allowedRoles: ['ADMIN'] },
    { id: 'rbac-matrix', label: 'RBAC Inspector', icon: Layers },
  ];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'SUPER ADMIN', style: 'bg-purple-950/80 text-purple-300 border-purple-500/50' };
      case 'GOVERNMENT_OFFICIAL':
        return { label: 'GOV OFFICIAL', style: 'bg-blue-950/80 text-blue-300 border-blue-500/50' };
      case 'RESPONSE_TEAM':
        return { label: 'NDRF DISPATCH', style: 'bg-amber-950/80 text-amber-300 border-amber-500/50' };
      case 'RESEARCHER':
        return { label: 'RESEARCHER', style: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50' };
      case 'CITIZEN':
      default:
        return { label: 'CITIZEN', style: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' };
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
        
        {/* Brand Logo & Name */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => onSelectTab('command-center')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <Waves className="w-5 h-5 text-white animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="heading-font font-bold text-lg tracking-tight text-white">
                FLASH FLOOD
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                EARLY WARNING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Hilly Region Early Warning System</p>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav className="hidden xl:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isAccessible = item.allowedRoles ? (isAuthenticated ? hasRole(item.allowedRoles) : true) : true;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 relative ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                    : isAccessible
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40 opacity-70'
                }`}
                title={!isAccessible ? `Requires ${item.allowedRoles?.join(' or ')} role` : undefined}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : isAccessible ? 'text-slate-400' : 'text-slate-600'}`} />
                <span>{item.label}</span>
                {!isAccessible && isAuthenticated && (
                  <Lock className="w-2.5 h-2.5 text-slate-500 ml-0.5" />
                )}
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Auth & Role Profile */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/50 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-white max-w-[110px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${getRoleBadge(user.role).style}`}>
                      {getRoleBadge(user.role).label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono max-w-[130px] truncate">{user.email}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 glass-panel border border-slate-700/80 rounded-xl p-3 shadow-2xl z-50 animate-fade-in text-xs space-y-2">
                  <div className="pb-2 border-b border-slate-800">
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-slate-400 font-mono text-[11px] truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Active Role:</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRoleBadge(user.role).style}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onSelectTab('rbac-matrix');
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white flex items-center space-x-2 transition-all"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Permissions & RBAC Matrix</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                        onSelectTab('command-center');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-950/50 text-rose-300 hover:text-rose-200 border border-transparent hover:border-rose-500/30 flex items-center space-x-2 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out (Revoke JWT)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectTab('login')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  currentTab === 'login'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                    : 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onSelectTab('register')}
                className={`hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-semibold items-center space-x-1.5 transition-all ${
                  currentTab === 'register'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subnav for smaller screens */}
      <div className="xl:hidden flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

